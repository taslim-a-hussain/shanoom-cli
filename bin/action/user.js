import inquirer from "inquirer";
import os from "os";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { loginCall, getUserCall, logoutCall } from "../apicall/user.js";
import { deleteToken, removeProps, isoDateParse } from "../lib/index.js";
import { fcap } from "gokit";

// Login Action
export const login = () => {
	inquirer
		.prompt([
			{
				type: "input",
				name: "email",
				message: "Email:",
				validate: (input) => input.length > 0,
			},
			{
				type: "password",
				name: "password",
				message: "Password:",
				mask: "*",
				validate: (input) => input.length > 0,
			},
		])
		.then(async (answers) => {
			const homedir = os.homedir();
			const shanoomrcPath = path.join(homedir, ".shanoomrc");

			const response = await loginCall(answers);

			const config = {
				token: response.token,
			};

			// Write the config to the .shanoomrc file
			fs.writeFileSync(shanoomrcPath, JSON.stringify(config));

			console.log(chalk.green(`Logged in successfully`));
		})
		.catch((error) => {
			console.error(chalk.red(`Error: ${error.message}`));
		});
};

// Whoami Action
export const whoami = async (token) => {
	try {
		const response = await getUserCall(token);
		console.log(chalk.bgWhite.blueBright(" Logged in as: ") + chalk.bgBlueBright.whiteBright(` ${response.name} (${response.email}) `));
	} catch (error) {
		console.error(chalk.red(`Error: ${error.message}`));
	}
};

// Profile Action
export const profile = async (token) => {
	try {
		const response = await getUserCall(token);

		const user = removeProps(response, ["_id", "folderId", "__v"]);

		const keys = Object.keys(user);

		for (const key of keys) {
			const value = user[key];
			let output;
			switch (key) {
				case "name":
					output = `${key}: ${fcap(value)}`;
					break;
				case "createdAt":
				case "updatedAt":
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
