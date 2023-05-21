import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {fcap, ftrim} from 'gokit';
import {loginCall, getUserCall, logoutCall, createDomainCall, getDomainsCall} from './apicall.js';
import {deleteToken, removeProps, isoDateParse, filesContent} from './lib/index.js';


// Login Action
export const login = () => {

    inquirer
      .prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Email:',
          validate: (input) => input.length > 0,
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password:',
          mask: '*',
          validate: (input) => input.length > 0,
        },
      ])
      .then(async (answers) => {

        const homedir = os.homedir();
        const shanoomrcPath = path.join(homedir, '.shanoomrc');
        
        const response = await loginCall(answers);

        const config = {
            token: response.token
        };

        // Write the config to the .shanoomrc file
        fs.writeFileSync(shanoomrcPath, JSON.stringify(config));
        
        console.log(chalk.green(`Logged in successfully`));
      })
      .catch((error) => {
        console.error(chalk.red(`Error: ${error.message}`));
      });
};


// Create Domain Action (Ask for domain name, and description. Description is optional)
export const createDomain = async (token) => {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Domain name:',
        validate: (input) => {
          if (input.length < 3) {
            return chalk.red('Domain name must be at least 3 characters long');
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



// Create Content Action
export const createContent = async (token) => {
  try {
    console.log(chalk.green('Create Content'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};


// Raw Action
export const raw = async () => {
  try {
    const data = await filesContent();

    // Print out the current working directory (Just the directory name)
    const cwd = process.cwd();
    const cwdArr = cwd.split('/');
    const cwdName = cwdArr[cwdArr.length - 1];
    console.log(chalk.bgWhite.blueBright(' Directory: ') + chalk.bgBlueBright.whiteBright(` ${cwdName} `));

    // Print out the total number of files
    console.log(chalk.green(` Total: ${data.length} domain(s) \n`));

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


// Whoami Action
export const whoami = async (token) => {
  try {
    const response = await getUserCall(token);
    console.log(chalk.bgWhite.blueBright(' Logged in as: ') + chalk.bgBlueBright.whiteBright(` ${response.name} (${response.email}) `));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};


// Profile Action
export const profile = async (token) => {
  try {
    const response = await getUserCall(token);

    const user = removeProps(response, ['_id', '__v']);

    const keys = Object.keys(user);

    for (const key of keys) {
        const value = user[key];
        let output;
        switch (key) {
            case 'name':
                output = `${key}: ${fcap(value)}`;
                break;
            case 'createdAt':
            case 'updatedAt':
                output = `${key}: ${isoDateParse(value)}`;
                break;
            default:
                output = `${key}: ${value}`;
        }
        console.log(output);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};


// Logout Action
export const logout = async (token) => {
  try {
    await logoutCall(token);
    deleteToken();
    console.log(chalk.green(`Logged out successfully`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};
