#!/usr/bin/env node

import { program } from 'commander';
import { readPackage } from 'read-pkg';

import {login} from './actions.js';

const { name, description, version } = await readPackage();

program
  .name(name)
  .description(description)
  .version(version, '-v, --version, -V', 'output the current version');


  program
  .command('login')
  .description('Log in with your username and password')
  .action(login);


program.parse(process.argv);
