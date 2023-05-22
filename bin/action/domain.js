import inquirer from 'inquirer';
import chalk from 'chalk';
import { ftrim } from 'gokit';
import { isoDateParse } from '../lib/index.js';
import { createDomainCall, getDomainsCall, getDomainCall } from '../apicall/domain.js';


// Valid constants
const domainNameMinLength = 2;


// Create Domain Action (Ask for domain name, and description. Description is optional)
export const createDomain = async (token) => {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Domain name:',
        validate: (input) => {
          if (input.length < domainNameMinLength) {
            return chalk.red(`Domain name must be at least ${domainNameMinLength} characters long`);
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):',
      },
    ]);

    const data = {
      ...answers,
      name: ftrim(answers.name).replace(/\s+/g, '-').toLowerCase()
    };
    
    await createDomainCall(token, data);

    console.log(chalk.green(`Domain ${data.name} created successfully`));

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};


// List Domains Action
export const listDomains = async (token) => {
  try {
    const response = await getDomainsCall(token);

    // Print out the total number of domains
    console.log(chalk.green(` Total: ${response.length} domains \n`));

    // Loop through the data and print it if createdAt and updatedAt format it (output = `${key}: ${isoDateParse(value)}`;)
    for (const domain of response) {
      const {name, description, createdAt, updatedAt} = domain;


      console.log(chalk.bgWhite.blueBright(' Domain:  ') + chalk.bgBlueBright.whiteBright(` ${name} `));
      description ? console.log(description + '\n') : console.log('No description\n');
      console.log('Created At: ' + isoDateParse(createdAt));
      console.log('Updated At: ' + isoDateParse(updatedAt));

      console.log(chalk.green('='.repeat(80)) + '\n');
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};


// Get Domain Action
export const getDomain = async (token, domainName) => {
  try {

    const response = await getDomainCall(token, domainName);

    if (!response) {
      console.log(chalk.red(`Domain ${domainName} not found`));
      return;
    }

    const {name, description, createdAt, updatedAt} = response;

    console.log(chalk.bgWhite.blueBright(' Domain:  ') + chalk.bgBlueBright.whiteBright(` ${name} `));
    description ? console.log(description + '\n') : console.log('No description\n');
    console.log('Created At: ' + isoDateParse(createdAt));
    console.log('Updated At: ' + isoDateParse(updatedAt));

  } catch (error) {

    console.error(chalk.red(`${error.message}`));
  }
};
