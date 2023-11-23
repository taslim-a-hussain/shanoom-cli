import chalk from "chalk";
import path from "path";
import { spinner } from "../lib/util.js";
import { getDomainCall } from "../apicall/domain.js";
import { createContentCall, updateContentCall, deleteContentCall, getContentCall, getContentsCall } from "../apicall/content.js";
import { dataFileContents, prepareData, getCwdName, isoDateParse, getDataFiles, watchman } from "../lib/index.js";
import {
	packageJsonExists,
	validDomainName,
	createDomainIfNotExists,
	synchronizeDataFiles,
	dataFileProcessor,
	handleFiles,
	handleSignal
} from "../lib/content-helper.js";
import colors from "../lib/colors.js";

const { log, error: logError } = console;

const { bgBlueShade, bgYellowShade, blueShade, yellowShade } = colors;

// Raw Action
export const raw = async () => {
	try {
		spinner.start();

		const data = await dataFileContents();

		const cwdName = getCwdName();

		spinner.info(bgBlueShade(yellowShade("Domain: ")) + bgYellowShade(blueShade(` ${cwdName} `)));

		spinner.succeed(`Total: ${data.length} content(s)`);

		// Loop through the data and print it if createdAt and updatedAt format it (output = `${key}: ${isoDateParse(value)}`;)
		for (const item of data) {
			// log(JSON.stringify(item, null, 4) + "\n");

			// Print out the content name
			log(chalk.bgWhite.blueBright(" Content: ") + chalk.bgBlueBright.whiteBright(` ${item.name} `));

			// Print out the data
			log(item.data);

			// Print a full horizental separator
			log(chalk.green("=".repeat(80)) + "\n");
		}
		spinner.stop();
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

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

			return;
		}

		// Create the content
		const result = await createContentCall(token, domainName, content, spinner);

		return result;
	} catch (error) {
		throw new Error(`creating content - ${error}`);
	}
};

// Update Content Action (If content has changed since last update)
export const updateContent = async (token, filePath, domainName, spinner) => {
	try {
		// Get the content
		const content = await prepareData(filePath);

		// Update the content
		return await updateContentCall(token, domainName, content.name, content, spinner);
	} catch (error) {
		throw new Error(`Updating content - ${error}`);
	}
};

export const deleteContent = async (token, filePath, domainName, spinner) => {
	try {
		// File name
		const contentName = path.basename(filePath, path.extname(filePath)).split(".")[0];

		// Update the content
		const result = await deleteContentCall(token, domainName, contentName, spinner);

		return result;
	} catch (error) {
		throw new Error(`Deleting content - ${error.message}`);
	}
};

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

		log(chalk.bgWhite.blueBright(" Content: ") + chalk.bgBlueBright.whiteBright(` ${content.name} `));

		if (more) {
			log(chalk.whiteBright(` CreatedAt: `) + isoDateParse(content.createdAt));
			log(chalk.whiteBright(` UpdatedAt: `) + isoDateParse(content.updatedAt));
		}
		log(content.data || "");

		spinner.succeed(`Done!`);
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

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

		// Loop through the contents and print contents.name and contents.data
		for (const content of contents) {
			log(chalk.bgWhite.blueBright(" Content: ") + chalk.bgBlueBright.whiteBright(` ${content.name} `));
			if (more) {
				log(chalk.whiteBright(` CreatedAt: `) + isoDateParse(content.createdAt));
				log(chalk.whiteBright(` UpdatedAt: `) + isoDateParse(content.updatedAt));
			}
			log(content.data || "");
			log(chalk.green("=".repeat(80)) + "\n");
		}

		spinner.succeed(`Total: ${contents.length} content(s)`);
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

// Content Manager Action
export const contentManager = async (token) => {
	try {
		// Set the initial text for the spinner
		spinner.start("Initializing...");

		if (!(await packageJsonExists)) {
			spinner.info("Should run the command in the root directory of your project.");
			spinner.fail("package.json does not exist in the current working directory");
			return;
		}

		// If the domain name is not valid, return
		const domainName = validDomainName(path.basename(process.cwd()), spinner);
		if (!domainName) {
			return;
		}

		// Create the domain if it doesn't exist
		await createDomainIfNotExists(token, domainName, spinner);

		// Synchronize data files
		await synchronizeDataFiles(token, domainName, spinner);

		// Process data files
		await dataFileProcessor(token, domainName, spinner);

		// Stop the spinner
		spinner.succeed("Initialization complete.");

		// Create a watcher
		const watcher = watchman();

		// Start the spinner
		spinner.start("Setting up...");

		// Event listeners for file changes
		watcher.on("ready", async () => {
			spinner.info("Ready for changes.");
			// Now that the watcher is ready, you can call your content handling functions
			watcher.on("add", (filePath) => handleFiles({ token, filePath, domainName, spinner, action: "Creating" }, createContent));
			watcher.on("change", (filePath) => handleFiles({ token, filePath, domainName, spinner, action: "Updating" }, updateContent));
			watcher.on("unlink", (filePath) => handleFiles({ token, filePath, domainName, spinner, action: "Deleting" }, deleteContent));
		});

		process.on("SIGINT", () => handleSignal(watcher));
		process.on("SIGTERM", () => handleSignal(watcher));
	} catch (error) {
		spinner.stop();
		logError(chalk.red(error.message));
		process.exit(1);
	}
};
