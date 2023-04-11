import inquirer from 'inquirer';
import chalk from 'chalk';

export const login = () => {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Username:',
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
      .then((answers) => {
        console.log(chalk.green(`Logged in as ${answers.username}`));
      })
      .catch((error) => {
        console.error(chalk.red(`Error: ${error.message}`));
      });
};
