#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import { program } from 'commander';
import {login, logout} from './actions.js';
import {readPackage} from 'read-pkg';
import {checkTokenFile, auth} from './lib/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../');

const pkg = await readPackage({cwd: packageJsonPath});

// Check if the .shanoomrc file exists in the user's directory and if it does, read the token else create the file
checkTokenFile();


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
  .action(() => auth(logout));


program.parse(process.argv);
