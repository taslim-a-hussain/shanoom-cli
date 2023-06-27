import fs from 'fs/promises';
import fsync from 'fs';
import path from 'path';
import {glob} from 'glob';
import ora from 'ora';
import { createRequire } from 'module';
import JSON5 from 'json5';
import {hashContent} from './content-hash.js';


const shanoomrcPath = path.join(process.env.HOME, '.shanoomrc');

export const getToken = async () => {
  try {
    const fileContents = await fs.readFile(shanoomrcPath, 'utf-8');
    const { token } = JSON.parse(fileContents);
    return token;
  } catch (error) {
    throw new Error('Error reading .shanoomrc file:', error.message);
  }
};


// Delete the .shanoomrc file
export const deleteTokenFile = () => {
    fsync.unlinkSync(shanoomrcPath);
};


// Empty the .shanoomrc file
export const deleteToken = () => {
    fsync.writeFileSync(shanoomrcPath, JSON.stringify({token: ''}));
};


// If the .shanoomrc file doesn't exist, create it with an empty token
export const checkTokenFile = () => {
    if (!fsync.existsSync(shanoomrcPath)) {
        fsync.writeFileSync(shanoomrcPath, JSON.stringify({token: ''}));
    }
};


// Create a middleware function to check if the user is logged in, for authenticated operations
export const auth = async (next, ...params) => {
    const token = await getToken();
    if (!token) {
        console.log('You are not logged in');
        process.exit(1);
    }

    next(token, ...params);
};


// Middleware to check if the user is already logged in, for unauthenticated operations
export const notAuth = async (next) => {
    const token = await getToken();
    if (token) {
        console.log('You are already logged in');
        process.exit(1);
    }
    next();
};


// Remove props from an object
export const removeProps = (obj, keys=[]) => {
    if (keys) {
        // remove the keys from the object
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            delete obj[key];
        }
    }

    return obj;
};


// ISO Date Parser
export const isoDateParse = (isoDate) => {
    const date = new Date(isoDate);
    const humanReadableDate = date.toLocaleString();
    return humanReadableDate;
};


/**
 * Search for files matching a pattern and return an array of objects with the file name as key and the file path as value
 * @returns {Promise<Array>} Of object with file name as key and file path as value
 */
const getFiles = async () => {

    const pattern = '**/*.data.{js,mjs}'; // Pattern to match files

    const fileNameRegex = /([^/]+)\.data\.(js|mjs)$/; // Regex to extract the file name from the file path
    
    const rawFiles = await glob(pattern, { ignore: 'node_modules/**' }); // Get all files matching the pattern

    // Create an array of objects with the file name as key and the file path as value
    const filesObj = rawFiles.map(file => { 
        const fileName = file.match(fileNameRegex)[1];
        return { [fileName]: file };
    });

    return filesObj;
};


/** 
* From an array of objects with the file name as key and the file path as value, * return an object with the file name as key and the file content as value
* @param {Array} filesObj Array of objects with the file name as key and the file * * * path as value
* @returns {Promise<Object>} Object with the file name as key and the file content as * value
*/
export const filesContent = async () => {
    const files = await getFiles();

    const data = [];

    // Loop through the array of objects and read file names and paths
    for (const file of files) {
        const fileName = Object.keys(file)[0];
        const filePath = Object.values(file)[0];

        // Read the file content
        const fileContent = await fs.readFile(path.resolve(filePath), 'utf8');

        const regex = /{([^}]+)}/gm; // Match everything between curly brackets
        const matches = regex.exec(fileContent); // Execute the regex on the file content

        if (matches && matches.length > 1) { // If there is a match
            const textBetweenCurlyBrackets = matches[0]; // Get the first match
            const sanitizedText = textBetweenCurlyBrackets.replace(/'/g, '"'); // Replace single quotes with double quotes (JSON5 requires double quotes)
            const json5Data = (new Function(`return ${sanitizedText}`))(); // Evaluate the string as JavaScript code (using function constructor instead of eval to avoid security issues)
            
            data.push({name: fileName, data: json5Data});
        }        
    }

    return data;
};


/* 
  `readFile`:
   - Uses `createRequire` and `import` statements to dynamically load the file content.
   - It checks whether the file uses CommonJS or ES modules syntax by checking for the presence of `module.exports`.
   - If it uses CommonJS syntax, it uses `require` to load the file. If it uses ES modules syntax, it uses `import`.
   - This approach leverages the native module system and dynamically imports the file, allowing it to handle more complex JavaScript logic and dynamic imports.
   - It avoids string manipulations and regex, which can potentially improve performance, especially for larger files.
   - Suitable for scenarios where the file structure can be either CommonJS or ES modules and involves more complex JavaScript logic.
*/
export const readFile2 = async (filePath) => {
    try {
      // Create a require function that supports ES modules
      const require = createRequire(import.meta.url);
  
      // Resolve the absolute path to the file
      const absolutePath = path.resolve(filePath);
      // Read the file contents
      const rawData = await fs.readFile(filePath, 'utf8');

      // Check if the file uses CommonJS or ES modules syntax
      let data;
      if (rawData.includes('module.exports')) {
        // For CommonJS, use require
        data = require(absolutePath);
        data = data.default || data;
      } else {
        // For ES modules, use import
        data = await import(absolutePath);
        data = data.default || data;
      }

      // Check if data is a valid js object if not throw an error Invalid JS Object
      if (typeof data !== 'object') {
        throw new Error('Invalid JS Object');
      };

      // File name
      const name = path.basename(filePath, path.extname(filePath)).split('.')[0];

      // Hash
      const hash = hashContent(JSON.stringify(data));

      // Return content (in JS object format)
      return {name, hash, data};
      
    } catch (error) {
      throw error;
    }
};


/* 
1. `readFile2`:
   - Reads the file using `fs.readFile` and parses the data using regular expressions and JSON5 library.
   - It performs string manipulations to remove the `export default` or `module.exports` statement and the trailing semicolon.
   - Then it uses `JSON5.parse` to parse the resulting JSON-like data.
   - This approach relies on string manipulations and regex, which can have some performance impact for larger files.
   - Suitable for scenarios where the file structure is known to be JSON-like and doesn't involve complex JavaScript logic.
*/
export const readFile = async (filePath) => {

        // Get contents from filePath
        const rawData = await fs.readFile(filePath, 'utf8');

        const name = path.basename(filePath, path.extname(filePath)).split('.')[0];
        let data = {};
        let hash = hashContent(JSON.stringify(data));

        if (!rawData) {
            return {name, hash, data};
        };

        // Remove export default or module.exports statement
        let trimmedData = rawData.replace(/(module\.exports\s*=\s*|export\s+default\s*)/, '');
        // Remove semicolon from the end of the file
        trimmedData = trimmedData.replace(/;\s*$/, '');

        try {
            // Parse the JSON5 data
            data = JSON5.parse(trimmedData);
        } catch (error) {
            throw new Error('Invalid JS Object in file: ' + filePath);
        }

        // Hash
        hash = hashContent(JSON.stringify(data));

        // Return content (in JS object format)
        return {name, hash, data};
        
};


// Spinner function
export const spinner = (action, options = {}) => {
    const startMessage = options.startMessage || 'Wait a moment...';
    const endMessage = options.endMessage || `👍`;
    const timeout = options.timeout || 8;

    const spinner = ora(startMessage).start();

    setTimeout(() => {
        action();
        spinner.succeed(endMessage);
    }, timeout);
};


// Get the current working directory name
export const getCwdName = () => {
    const cwd = process.cwd();
    const cwdName = cwd.split(path.sep).pop();
    return cwdName;
};
