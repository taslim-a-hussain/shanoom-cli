#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import {readPackage} from 'read-pkg';

const {version} =  await readPackage();


program.version(version);

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log(`Hello, world!`);
  });

program
  .command('ask')
  .description('Ask some questions')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is your name?'
      },
      {
        type: 'list',
        name: 'color',
        message: 'What is your favorite color?',
        choices: ['red', 'green', 'blue']
      }
    ]);
    console.log(`Hello, ${chalk.green(answers.name)}! Your favorite color is ${chalk.blue(answers.color)}.`);
  });

program
  .command('spinner')
  .description('Display a spinner')
  .action(() => {
    const spinner = ora('Loading...').start();
    setTimeout(() => {
      spinner.succeed('Done!');
    }, 3000);
  });

program.parse(process.argv);
