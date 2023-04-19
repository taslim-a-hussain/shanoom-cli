import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {fcap} from 'gokit';
import {loginCall, getUserCall, logoutCall} from './apicall.js';
import {deleteToken, removeProps, isoDateParse} from './lib/index.js';


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
        
        console.log(chalk.green(`Logged in as ${response.name}`));
      })
      .catch((error) => {
        console.error(chalk.red(`Error: ${error.message}`));
      });
};


// Whoami Action
export const whoami = async (token) => {
  try {
    const response = await getUserCall(token);
    console.log(' Logged in as: '+chalk.bgBlueBright.whiteBright(` ${response.user.name} (${response.user.email}) `));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};


// Profile Action
export const profile = async (token) => {
  try {
    const response = await getUserCall(token);

    const user = removeProps(response.user, ['_id', '__v']);

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
    const response = await logoutCall(token);
    deleteToken();
    console.log(chalk.green(response.message));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
};
