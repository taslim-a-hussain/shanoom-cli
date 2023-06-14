import chalk from 'chalk';
import path from 'path';
import ora from 'ora';
import { ftrim } from 'gokit';
import { createDomainCall, getDomainCall } from '../apicall/domain.js';
import { createContentCall, getContentCall } from '../apicall/content.js';
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
    // Get the content from the package.json file
    const content = await readFile(filePath);

    return;

    // First Check if content already exists in the database
    const contentExists = await getContentCall(token, domainName, content.name);

    // If content already exists, return
    if (contentExists) {
      // Log info message ('Watching content.name')
      log(chalk.greenBright.bold(`Watching content ${content.name} in ${domainName} domain.`));
      return;
    }

    // Create the content
    await createContentCall(token, domainName, content);

  } catch (error) {
    logError(chalk.red(`Error: ${error.message}`));
  }
};


const handleFileChanges = async (event, args={}, apiCallback) => {
  try {
    if (event === 'exit') {
      process.exit(); // Exit the process when "exit" command is received
    } else if (event === 'added' || event === 'changed' || event === 'deleted') {
      const {token, filePath, domainName} = args;
      await apiCallback(token, filePath, domainName);
    
      // Extract the relative file path by removing the cwd name
      const relativePath = path.relative(process.cwd(), filePath);
  
      // Perform CRUD operations or any other actions based on the file change event
      log(chalk.blueBright.bold(`File ${relativePath} in ${domainName} has been ${event}`));
    } else {
      const suggestedCommand = 'exit';
      const errorMessage = chalk.red(`Error: ${event} is not a valid event. Did you mean to use "${suggestedCommand}" command?`);
      logError(errorMessage);
    }

  } catch (error) {
    log(chalk.red(`Error: ${error.message}`));
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
    watcher.on('add', (filePath) => handleFileChanges('added', {token, filePath, domainName}, createContent));
    watcher.on('change', (filePath) => handleFileChanges('changed', filePath, domainName));
    watcher.on('unlink', (filePath) => handleFileChanges('deleted', filePath, domainName));

    // Read user input
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (data) => {
      const input = data.trim();
      handleFileChanges(input, ''); // Pass the input as the event and empty path
    });

  } catch (error) {
    logError(chalk.red(`Error: ${error.message}`));
  }
};

