#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import { program } from 'commander';
import {raw, login, whoami, profile, createDomain, logout, createContent} from './actions.js';
import {readPackage} from 'read-pkg';
import {checkTokenFile, auth, notAuth, spinner} from './lib/index.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../');

const pkg = await readPackage({cwd: packageJsonPath});

// Check if the .shanoomrc file exists in the user's directory and if it does, read the token else create the file
checkTokenFile();




// Package info and commands (shanoom)
program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version, -V', 'output the current version');


// Raw data command (shanoom raw) to view the raw data of the current directory
program
  .command('raw')
  .description('View the raw data of the current directory')
  .action(() => {
    spinner(raw);
  });


// Login command
program
  .command('login')
  .description('Log in with your username and password')
  .action(() => spinner(async () => {
    await notAuth(login);
  }));

// Whoami command
program
  .command('whoami')
  .description('Check who you are logged in as')
  .action(() => {
     spinner(async () => {
      await auth(whoami);
     });
  });


// Profile command
program
  .command('profile')
  .description('View your profile')
  .action(() => spinner(async () => {
    await auth(profile);
  }));



program
  .command('create')
  .description('Create a domain or content for a domain')
  .option('-d, --domain', 'Create a domain')
  .option('-c, --content', 'Create content for a domain')
  .action((options) => {
    if (options.domain) {
      spinner(async () => {
        await auth(createDomain);
      });
    } else if (options.content) {
      spinner(async () => {
        await auth(createContent);
      });
    } else {
      // Run: shanoom create -h programmaticaly
      program.parse(['node', 'shanoom.js', 'create', '-h']);
    }
});


// Logout command
program
  .command('logout')
  .description('Log out of your account')
  .action(() => spinner(async () => {
    await auth(logout);
  }));


// Parse the arguments
program.parse(process.argv);
