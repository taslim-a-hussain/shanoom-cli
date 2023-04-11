#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import chalk from 'chalk';
import { program } from 'commander';
import {login} from './actions.js';
import {logoutCall} from './apicall.js';
import {readPackage} from 'read-pkg';
import {checkTokenFile, getToken, deleteToken} from './lib/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../');

const pkg = await readPackage({cwd: packageJsonPath});

// Check if the .shanoomrc file exists in the user's directory and if it does, read the token else create the file
checkTokenFile();

const token = await getToken();

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version, -V', 'output the current version');


program
  .command('login')
  .description('Log in with your username and password')
  .action(login);


program
  .command('logout')
  .description('Log out of your account')
  .action(async () => {
    try {
      const response = await logoutCall(token);
      deleteToken();
      console.log(chalk.green(response.message));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });


program.parse(process.argv);
