import inquirer from "inquirer";
import chalk from "chalk";
import { spinner } from "../lib/util.js";
import { isoDateParse } from "../lib/index.js";
import { getDomainsCall, getDomainCall, deleteDomainCall, deleteDomainsCall } from "../apicall/domain.js";

// List Domains Action
export const listDomains = async (token) => {
	try {
		const response = await getDomainsCall(token);

		// Print out the total number of domains
		console.log(chalk.green(` Total: ${response.length} domains \n`));

		// Loop through the data and print it if createdAt and updatedAt format it (output = `${key}: ${isoDateParse(value)}`;)
		for (const domain of response) {
			const { name, description, createdAt, updatedAt } = domain;

			console.log(chalk.bgWhite.blueBright(" Domain:  ") + chalk.bgBlueBright.whiteBright(` ${name} `));
			description ? console.log(description + "\n") : console.log("No description\n");
			console.log("Created At: " + isoDateParse(createdAt));
			console.log("Updated At: " + isoDateParse(updatedAt));

			console.log(chalk.green("=".repeat(80)) + "\n");
		}
	} catch (error) {
		console.error(chalk.red(`Error: ${error.message}`));
	}
};

// Get Domain Action
export const getDomain = async (token, domainName) => {
	spinner.start();
	try {
		const response = await getDomainCall(token, domainName, spinner);

		if (!response) {
			console.log(chalk.red(`Domain ${domainName} not found`));
			return;
		}

		const { name, description, createdAt, updatedAt } = response;

		console.log(chalk.bgWhite.blueBright(" Domain:  ") + chalk.bgBlueBright.whiteBright(` ${name} `));
		description ? console.log(description + "\n") : console.log("No description\n");
		console.log("Created At: " + isoDateParse(createdAt));
		console.log("Updated At: " + isoDateParse(updatedAt));
	} catch (error) {
		spinner.stop();
		throw new Error(error);
	}
};

// Delete Domain by name Action
export const deleteDomain = async (token, domainName) => {
	try {
		const response = await getDomainCall(token, domainName);

		if (!response) {
			console.log(chalk.red(`Domain ${domainName} not found`));
			return;
		}

		const { name } = response;

		const answers = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirm",
				message: `Are you sure you want to delete domain ${name}?`,
				default: false
			}
		]);

		if (answers.confirm) {
			// Delete domain
			await deleteDomainCall(token, name);

			console.log(chalk.green(`Domain ${name} deleted successfully`));
		} else {
			console.log(chalk.red(`Domain ${name} not deleted`));
		}
	} catch (error) {
		console.error(chalk.red(`${error.message}`));
	}
};

// Delete all Domains Action
export const deleteDomains = async (token) => {
	try {
		const response = await getDomainsCall(token);

		if (response.length === 0) {
			console.log(chalk.red(`No domains found`));
			return;
		}

		const answers = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirm",
				message: `Are you sure you want to delete all domains?`,
				default: false
			}
		]);

		if (answers.confirm) {
			// Delete all domains
			await deleteDomainsCall(token);

			console.log(chalk.green(`All domains deleted successfully`));
		} else {
			console.log(chalk.red(`All domains not deleted`));
		}
	} catch (error) {
		console.error(chalk.red(`${error.message}`));
	}
};
