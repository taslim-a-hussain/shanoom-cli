#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import { program } from 'commander';
import {login} from './actions.js';
import {readPackage} from 'read-pkg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../');


const {name, description, version} = await readPackage({cwd: packageJsonPath});


program
  .name(name)
  .description(description)
  .version(version, '-v, --version, -V', 'output the current version');


  program
  .command('login')
  .description('Log in with your username and password')
  .action(login);


program.parse(process.argv);
