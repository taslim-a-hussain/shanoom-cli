import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {loginCall, logoutCall} from './apicall.js';
import {deleteToken} from './lib/index.js';



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



export const logout = async (token) => {
  try {
    const response = await logoutCall(token);
    deleteToken();
    console.log(chalk.green(response.message));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    console.log(error);
  }
};
