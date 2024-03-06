import chalk from "chalk";
import path from "path";
import { spinner } from "../lib/util.js";
import { getDomainCall } from "../apicall/domain.js";
import {
	createContentCall,
	updateContentCall,
	deleteContentCall,
	getContentCall,
	getContentsCall,
} from "../apicall/content.js";
import {
	dataFileContents,
	getCwdName,
	isoDateParse,
	getDataFiles,
	removeDataFilesAsync,
	prepareDataFile,
} from "../lib/index.js";
import colors from "../lib/colors.js";

const { bgBlueShade, bgYellowShade, blueShade, yellowShade } = colors;

// ----------------------------------------------------------------------------------------------

// Create Content Action
export const createContent = async (token, fileInfo, domainName, spinner) => {
	try {
		// Get the content
		const content = await prepareDataFile(fileInfo);

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
		return await createContentCall(token, domainName, content, spinner);
	} catch (error) {
		throw new Error(error.message);
	}
};

// ----------------------------------------------------------------------------------------------

// Update Content Action (If content has changed since last update)
export const updateContent = async (token, fileInfo, domainName, spinner) => {
	try {
		// Get the content
		const content = await prepareDataFile(fileInfo);

		// Update the content
		return await updateContentCall(token, domainName, content.name, content, spinner);
	} catch (error) {
		throw new Error(error.message);
	}
};

// ----------------------------------------------------------------------------------------------

export const deleteContent = async (token, { name }, domainName, spinner) => {
	try {
		// Update the content
		const result = await deleteContentCall(token, domainName, name, spinner);

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
			console.log(JSON.stringify(item.data, null, 4));

			// Print a full horizental separator
			console.log("=".repeat(80) + "\n");
		}
	} catch (error) {
		spinner.stop();
		console.error(chalk.red(`Error: ${error.message}`));
	}
};

// ----------------------------------------------------------------------------------------------

// Remove data files (shanoom removeData)
export const removeData = async () => {
	try {
		spinner.start("Removing data files...");

		await removeDataFilesAsync();

		spinner.succeed("Data files successfully removed.");
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
			console.log(` CreatedAt: ` + isoDateParse(content.createdAt));
			console.log(` UpdatedAt: ` + isoDateParse(content.updatedAt));
		}
		console.log(JSON.stringify(content.data, null, 4) || "");
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
		const domainExist = await getDomainCall(token, domainName, spinner);

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
				console.log(` CreatedAt: ` + isoDateParse(content.createdAt));
				console.log(` UpdatedAt: ` + isoDateParse(content.updatedAt));
			}
			console.log(JSON.stringify(content.data, null, 4) || "");
			console.log(blueShade("=".repeat(80)) + "\n");
		}
	} catch (error) {
		console.error(chalk.red(`Error: ${error.message}`));
		spinner.stop();
	}
};
