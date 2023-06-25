import chalk from 'chalk';
import path from 'path';
import ora from 'ora';
import { ftrim } from 'gokit';
import { createDomainCall, getDomainCall } from '../apicall/domain.js';
import { createContentCall, updateContentCall, deleteContentCall, getContentCall } from '../apicall/content.js';
import { filesContent, getCwdName, readFile } from '../lib/index.js';
import { readPackage } from "read-pkg";
import chokidar from 'chokidar';



const domainNameMinLength = 2;

const {log, error: logError} = console;


// Raw Action
export const raw = async () => {
    try {
      const data = await filesContent();
  
      const cwdName = getCwdName();
  
      log(chalk.bgWhite.blueBright(' domainName: ') + chalk.bgBlueBright.whiteBright(` ${cwdName} `));
  
      // Print out the total number of files
      log(chalk.green(` Total: ${data.length} content(s) \n`));
  
      // Loop through the data and print it if createdAt and updatedAt format it (output = `${key}: ${isoDateParse(value)}`;)
      for (const item of data) {
          log(JSON.stringify(item, null, 4) + '\n');
          
          // Print a full horizental separator
          log(chalk.green('='.repeat(80)) + '\n');
      }
      
    } catch (error) {
      logError(chalk.red(`Error: ${error.message}`));
    }
};


// Create Domain decreetly (without asking for domain name and description)
const createDomainDecreetly = async (token, domainName) => {
    try {

      // If package.json file exists, read the description from it
      const pkg = await readPackage({cwd: process.cwd()});
      const description = pkg.description || '';
      
      const data = {
        name: ftrim(domainName).replace(/\s+/g, '-').toLowerCase(),
        description
      };
  
      await createDomainCall(token, data);
  
    } catch (error) {
      logError(chalk.red(`Error: ${error.message}`));
    }
};


// Create Content Action
export const createContent = async (token, filePath, domainName) => {
  try {
    // Get the content 
    const content = await readFile(filePath);

    // If not content (Because of an error thrown by the readFile function), return
    if (!content) {
      return;
    }

    // First Check if content already exists in the database
    const contentExists = await getContentCall(token, domainName, content.name);

    // If content already exists, Check for changes
    if (contentExists) {

      // Check content hash against existing content hash (if they are the same, do nothing else update)
      if (contentExists.hash === content.hash) {
      log(chalk.greenBright.bold(`Watching content ${content.name} in ${domainName} domain.`));
      return;
      } else {
        // Update the content
        const result = await updateContentCall(token, domainName, content.name, content);
        return result;
      }
    }

    // Create the content
    const result = await createContentCall(token, domainName, content);

    return result;

  } catch (error) {
    console.log('controller error: ', error);
    logError(chalk.red(`Error: ${error.message}`));
  }
};


// Update Content Action
export const updateContent = async (token, filePath, domainName) => {
  try {

    // Get the content 
    const content = await readFile(filePath);

    // Update the content
    const result = await updateContentCall(token, domainName, content.name, content);

    return result;

  } catch (error) {
    logError(chalk.red(`Error: ${error.message}`));
  }

};


// Delete Content Action
export const deleteContent = async (token, filePath, domainName) => {
  try {

    // File name
    const fileName = path.basename(filePath, path.extname(filePath)).split('.')[0];

    // Update the content
    const result = await deleteContentCall(token, domainName, fileName);

    return result;

  } catch (error) {
    logError(chalk.red(`Error: ${error.message}`));
  }

};



const handleFiles = async (args={}, apiCallback) => {
    const {token, filePath, domainName} = args;

    const result = await apiCallback(token, filePath, domainName);

    if (result) {
      // Extract the relative file path by removing the cwd name
      const relativePath = path.relative(process.cwd(), filePath);

      const color = result === 'Created' ? 'greenBright' : result === 'Updated' ? 'yellowBright' : 'redBright';
  
      // Perform CRUD operations or any other actions based on the file change event
      log(chalk[color].bold(`File: ${relativePath} has been ${result.toLowerCase()}.`));
    }

};


// Content Manager Action
export const contentManager = async (token) => {
  try {

    // Get the current working directory name
    const domainName = path.basename(process.cwd());

    // Validate the domain name
    if (domainName.length < domainNameMinLength) {
      log(chalk.red(`Domain name (${domainName}) must be at least ${domainNameMinLength} characters long.`));
      return;
    }

    // Get Domain name from the databass
    const response = await getDomainCall(token, domainName);

    // If the domain doesn't exist, create it

    if (!response) {
      const spinner = ora('Creating domain...').start();
      await createDomainDecreetly(token, domainName);
      spinner.succeed(`Domain ${domainName} created successfully`);
    }
    
    
    // Define the glob pattern for the files to be tracked
    const filePattern = `${process.cwd()}/**/*.data.{js,mjs}`;

    // Initialize the Chokidar watcher
    const watcher = chokidar.watch(filePattern, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    // Event listeners for file changes
    watcher.on('add', (filePath) => handleFiles({token, filePath, domainName}, createContent));
    watcher.on('change', (filePath) => handleFiles({token, filePath, domainName}, updateContent));
    watcher.on('unlink', (filePath) => handleFiles({token, filePath, domainName}, deleteContent));

    // Read user input
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (data) => {
      const input = data.trim();
      // handleFiles(input, ''); // Pass the input as the event and empty path
      if (input === 'exit') {
        process.exit();
      } else {
        log(chalk.red(`Invalid input: ${input}. Use 'exit' to exit.`));
      }
    });

  } catch (error) {
    logError(chalk.red(`Error: ${error.message}`));
  }
};
