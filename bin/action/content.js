import chalk from "chalk";
import path from "path";
import { spinner } from "../lib/util.js";
import { getDomainCall } from "../apicall/domain.js";
import { createContentCall, updateContentCall, deleteContentCall, getContentCall, getContentsCall } from "../apicall/content.js";
import { dataFileContents, prepareData, getCwdName, isoDateParse, getDataFiles } from "../lib/index.js";
import colors from "../lib/colors.js";

const { bgBlueShade, bgYellowShade, blueShade, yellowShade } = colors;

// ----------------------------------------------------------------------------------------------

// Create Content Action
export const createContent = async (token, filePath, domainName, spinner) => {
	try {
		// Get the content
		const content = await prepareData(filePath);

		// If not content (Because of an error thrown by the readFile function), return
		if (!content) {
			return;
		}

		const { names } = await getDataFiles();

		// Check if the content name appears more than once in names array
		const nameExists = names.filter((name) => name === content.name).length > 1;

		if (nameExists) {
			const name = chalk.redBright(content.name);
			spinner.fail(`Duplicate data file name "${name}" found.`);
			spinner.info(`Data file name must be unique within a project.`);
			spinner.info(`To fix this issue:`);
			spinner.info(`1. Rename the file "${content.path}" to a unique name.`);
			spinner.info(`2. Run ${chalk.yellowBright("shanoom watch")} again.`);
			spinner.stop();

			// Exit the process
			process.exit(1); // 1 means error
		}

		// Create the content
		const result = await createContentCall(token, domainName, content, spinner);

		return result;
	} catch (error) {
		throw new Error(error.message);
	}
};

// ----------------------------------------------------------------------------------------------

// Update Content Action (If content has changed since last update)
export const updateContent = async (token, filePath, domainName, spinner) => {
	try {
		// Get the content
		const content = await prepareData(filePath);

		// Update the content
		return await updateContentCall(token, domainName, content.name, content, spinner);
	} catch (error) {
		throw new Error(error.message);
	}
};

// ----------------------------------------------------------------------------------------------

export const deleteContent = async (token, filePath, domainName, spinner) => {
	try {
		// File name
		const contentName = path.basename(filePath, path.extname(filePath)).split(".")[0];

		// Update the content
		const result = await deleteContentCall(token, domainName, contentName, spinner);

		return result;
	} catch (error) {
		throw new Error(error.message);
	}
};

// ----------------------------------------------------------------------------------------------

// Raw Action
export const raw = async () => {
	try {
		spinner.start("Fetching data...");
		const data = await dataFileContents();

		const cwdName = getCwdName();

		spinner.info(bgBlueShade(yellowShade("Domain: ")) + bgYellowShade(blueShade(` ${cwdName} `)));

		spinner.succeed(`Total: ${data.length} content(s)`);

		// Loop through the data and print it if createdAt and updatedAt format it (output = `${key}: ${isoDateParse(value)}`;)
		for (const item of data) {
			// log(JSON.stringify(item, null, 4) + "\n");

			// Print out the content name
			spinner.info(chalk.bgWhite.blueBright(" Content: ") + chalk.bgBlueBright.whiteBright(` ${item.name} `));

			// Print out the data
			console.log(item.data);

			// Print a full horizental separator
			console.log(chalk.green("=".repeat(80)) + "\n");
		}
	} catch (error) {
		spinner.stop();
		console.error(chalk.red(`Error: ${error.message}`));
	}
};

// ----------------------------------------------------------------------------------------------

// Get Content Action
export const getContent = async (token, options) => {
	try {
		spinner.start();

		// Get domain name
		const domainName = path.basename(process.cwd());

		// Check if domain exists in the database
		const domainExist = await getDomainCall(token, domainName, spinner);

		if (!domainExist) {
			spinner.fail(`Domain ${domainName} does not exist.`);
			spinner.info(`Run ${chalk.yellowBright("shanoom watch")} to create a domain.`);
			return;
		}

		const { name: contentName, more } = options;

		// Get the content by content name
		let content = await getContentCall(token, domainName, contentName, spinner);
		spinner.succeed(`Done!`);

		console.log(chalk.bgWhite.blueBright(" Content: ") + chalk.bgBlueBright.whiteBright(` ${content.name} `));

		if (more) {
			console.log(chalk.whiteBright(` CreatedAt: `) + isoDateParse(content.createdAt));
			console.log(chalk.whiteBright(` UpdatedAt: `) + isoDateParse(content.updatedAt));
		}
		console.log(content.data || "");
	} catch (error) {
		console.logError(chalk.red(`Error: ${error.message}`));
		spinner.stop();
	}
};

// ----------------------------------------------------------------------------------------------

// Get all Content Action
export const getContents = async (token, options) => {
	try {
		spinner.start();

		// Get domain name
		const domainName = path.basename(process.cwd());

		// Check if domain exists in the database
		const domainExist = await getDomainCall(token, domainName);

		if (!domainExist) {
			spinner.fail(`Domain ${domainName} does not exist.`);
			spinner.info(`Run ${chalk.yellowBright("shanoom watch")} to create a domain.`);
			return;
		}

		const { more } = options;

		// Get the content by content name
		const contents = await getContentsCall(token, domainName, spinner);

		spinner.succeed(`Total: ${contents.length} content(s)`);

		// Loop through the contents and print contents.name and contents.data
		for (const content of contents) {
			console.log(chalk.bgWhite.blueBright(" Content: ") + chalk.bgBlueBright.whiteBright(` ${content.name} `));
			if (more) {
				console.log(chalk.whiteBright(` CreatedAt: `) + isoDateParse(content.createdAt));
				console.log(chalk.whiteBright(` UpdatedAt: `) + isoDateParse(content.updatedAt));
			}
			console.log(content.data || "");
			console.log(chalk.green("=".repeat(80)) + "\n");
		}
	} catch (error) {
		console.error(chalk.red(`Error: ${error.message}`));
		spinner.stop();
	}
};
