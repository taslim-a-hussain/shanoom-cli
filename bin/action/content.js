import fs from "fs/promises";
import yaml from "js-yaml";
import chalk from "chalk";
import path from "path";
import ora from "ora";
import { ftrim } from "gokit";
import { createDomainCall, getDomainCall } from "../apicall/domain.js";
import { createContentCall, updateContentCall, deleteContentCall, getContentCall, getContentsCall } from "../apicall/content.js";
import { dataFileContents, prepareData, getCwdName, isoDateParse, removeDataFiles, getDataFiles, watchman } from "../lib/index.js";

const spinner = ora("Working on it..."); // Initialize a single spinner instance

const domainNameMinLength = 2;

const { log, error: logError } = console;

const bgBlueShade = chalk.bgHex("#24455AFF");
const bgYellowShade = chalk.bgHex("#FFC331FF");
const blueShade = chalk.hex("#24455AFF");
const yellowShade = chalk.hex("#FFC331FF");

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

// Create Domain decreetly (without asking for domain name and description)
const createDomainDecreetly = async (token, domainName) => {
	try {
		const packagePath = `${process.cwd()}/package.json`;

		// Read the package.json file
		const packageData = await fs.readFile(packagePath, "utf-8");

		const pkg = JSON.parse(packageData);

		// Get the description from package.json or set it to an empty string
		const description = pkg.description || "";

		const data = {
			name: ftrim(domainName).replace(/\s+/g, "-").toLowerCase(),
			description
		};

		return await createDomainCall(token, data);
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

// Create Content Action
export const createContent = async (token, filePath, domainName) => {
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
		const result = await createContentCall(token, domainName, content);

		return result;
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

// Update Content Action (If content has changed since last update)
export const updateContent = async (token, filePath, domainName) => {
	try {
		// Get the content
		const content = await prepareData(filePath);

		// Get the content hash from the database
		const dbContent = await getContentCall(token, domainName, content.name);

		const dbContentHash = dbContent.hash;

		const contentHash = content.hash;

		if (dbContentHash !== contentHash) {
			// Update the content
			return await updateContentCall(token, domainName, content.name, content);
		}
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

export const deleteContent = async (token, filePath, domainName) => {
	try {
		// File name
		const contentName = path.basename(filePath, path.extname(filePath)).split(".")[0];

		// Update the content
		const result = await deleteContentCall(token, domainName, contentName);

		return result;
	} catch (error) {
		logError(chalk.red(`Error: ${error}`));
	}
};

// Get Content Action
export const getContent = async (token, options) => {
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

		const { name: contentName, more } = options;

		// Get the content by content name
		let content = await getContentCall(token, domainName, contentName);

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
		const contents = await getContentsCall(token, domainName);

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

const handleFiles = async (args = {}, apiCallback) => {
	const { token, filePath, domainName } = args;

	const result = await apiCallback(token, filePath, domainName);

	if (result && result !== "No changes") {
		// Extract the relative file path by removing the cwd name
		const relativePath = path.relative(process.cwd(), filePath);

		const color = result === "Created" ? "greenBright" : result === "Updated" ? "yellowBright" : "redBright";

		// Perform CRUD operations or any other actions based on the file change event
		spinner.succeed(chalk[color].bold(`File: ${relativePath} has been ${result.toLowerCase()}.`));
	}
};

// Content Manager Action
export const contentManager = async (token) => {
	try {
		// Set the initial text for the spinner
		spinner.start("Initializing...");

		// First check if package.json exists in the current working directory
		const packageJsonExists = await fs
			.access("./package.json")
			.then(() => true)
			.catch(() => false);

		if (!packageJsonExists) {
			spinner.info("Should run the command in the root directory of your project.");
			spinner.fail("package.json does not exist in the current working directory");
			return;
		}

		const watcher = watchman();

		// Get the current working directory name
		const domainName = path.basename(process.cwd());

		// Validate the domain name
		if (domainName.length < domainNameMinLength) {
			spinner.fail(`Domain name (${domainName}) must be at least ${domainNameMinLength} characters long.`);
			return;
		}

		// Get Domain name from the databass
		const response = await getDomainCall(token, domainName);

		// If the domain doesn't exist, create it
		if (!response) {
			spinner.text = "Creating domain...";
			const msg = await createDomainDecreetly(token, domainName);
			if (msg === "Created") {
				spinner.succeed(`Domain "${domainName}" has been successfully created.`);
			} else {
				spinner.fail(`Operation failed: ${msg}`);
			}
		}

		// Get the all contents from the database for the current domain (Synchronize the data files with the database)
		const result = await getContentsCall(token, domainName);

		for (const item of result) {
			const { path, data } = item;

			// Convert the data to YAML format
			const yamlData = yaml.dump(data);

			// Write the data to the file
			await fs.writeFile(path, yamlData);

			spinner.succeed(`Data file "${path}" successfully synchronized.`);
		}

		// Before synchronizing the data, see if there are any data files in the current directory
		const newContents = await dataFileContents();

		if (newContents.length) {
			const { names } = await getDataFiles();

			// Loop through the newContents array and create the contents in the database
			for (const item of newContents) {
				// Check if the content name appears more than once in names array
				const nameExists = names.filter((name) => name === item.name).length > 1;

				if (nameExists) {
					const name = chalk.redBright(item.name);
					spinner.fail(`Duplicate data file name "${name}" found.`);
					spinner.info(`Data file name must be unique within a project.`);
					spinner.info(`To fix this issue:`);
					spinner.info(`1. Rename the file "${item.path}" to a unique name.`);
					spinner.info(`2. Run ${chalk.yellowBright("shanoom watch")} again.`);
					spinner.stop();
					// Stop the watcher
					watcher.close();
					return;
				}

				const fullFilePath = path.resolve(item.path);

				const preparedData = await prepareData(fullFilePath);

				// Create the content
				const result = await createContentCall(token, domainName, preparedData);

				if (result && result !== "No changes") {
					// Extract the relative file path by removing the cwd name
					const relativePath = path.relative(process.cwd(), item.path);

					const color = result === "Created" ? "greenBright" : result === "Updated" ? "yellowBright" : "redBright";

					// Perform CRUD operations or any other actions based on the file change event
					spinner.succeed(chalk[color].bold(`File: ${relativePath} has been ${result.toLowerCase()}.`));
				}
			}
		}

		spinner.succeed("Initialization complete.");

		// Event listeners for file changes
		watcher.on("ready", () => spinner.info("Ready for changes."));
		watcher.on("add", (filePath) => handleFiles({ token, filePath, domainName }, createContent));
		watcher.on("change", (filePath) => handleFiles({ token, filePath, domainName }, updateContent));
		watcher.on("unlink", (filePath) => handleFiles({ token, filePath, domainName }, deleteContent));

		// Read user input
		process.stdin.resume();
		process.stdin.setEncoding("utf8");

		process.stdin.on("data", (data) => {
			const input = data.toString().trim(); // Convert the input to a string and remove any trailing whitespace

			if (input === "exit" || input === "quit") {
				watcher.close();
				// Perform synchronous operations before the process exits
				removeDataFiles();
				process.exit(0);
			}
		});

		process.on("SIGINT", () => {
			watcher.close();
			// Perform synchronous operations before the process exits
			removeDataFiles();
			process.exit(0);
		});
	} catch (error) {
		spinner.stop();
		logError(chalk.red(error.message));
		process.exit(1);
	}
};
