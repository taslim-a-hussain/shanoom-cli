import chalk from 'chalk';
import ora from 'ora';
import { ftrim } from 'gokit';
import { createDomainCall, getDomainCall } from '../apicall/domain.js';
import { createContentCall } from '../apicall/content.js';
import { filesContent, getCwdName } from '../lib/index.js';
import { readPackage } from "read-pkg";


const domainNameMinLength = 2;

// Raw Action
export const raw = async () => {
    try {
      const data = await filesContent();
  
      const cwdName = getCwdName();
  
      console.log(chalk.bgWhite.blueBright(' domainName: ') + chalk.bgBlueBright.whiteBright(` ${cwdName} `));
  
      // Print out the total number of files
      console.log(chalk.green(` Total: ${data.length} content(s) \n`));
  
      // Loop through the data and print it if createdAt and updatedAt format it (output = `${key}: ${isoDateParse(value)}`;)
      for (const item of data) {
          console.log(JSON.stringify(item, null, 4) + '\n');
          
          // Print a full horizental separator
          console.log(chalk.green('='.repeat(80)) + '\n');
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
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
      console.error(chalk.red(`Error: ${error.message}`));
    }
};


// Create Content Action
export const createContent = async (token) => {
    let contentSpinner;
    
    try {
      const data = await filesContent();
      const domainName = getCwdName();
  
      // Validate the domain name
      if (domainName.length < domainNameMinLength) {
        console.log(chalk.red(`Domain name (${domainName}) must be at least ${domainNameMinLength} characters long.`));
        return;
      }
  
      const response = await getDomainCall(token, domainName);
  
      if (!response) {
        const spinner = ora(`Creating domain ${domainName}...`).start();
        await createDomainDecreetly(token, domainName);
        spinner.succeed(`Domain ${domainName} created successfully`);
      }
  
      for (const content of data) {
        const contentName = content.name; // Keep track of the current content name
        contentSpinner = ora(`Creating content ${contentName}...`).start();
        await createContentCall(token, domainName, content);
        contentSpinner.succeed(`Content ${contentName} created successfully`);
      }
  
    } catch (error) {
      // Stop the spinner and print the error
      if (contentSpinner) {
        const contentName = contentSpinner.text.replace('Creating content ', '').replace('...', '');
        contentSpinner.fail(`${contentName} - ${error.message}`);
      } else {
        console.error(`Error: ${error.message}`);
      }
    }
};
