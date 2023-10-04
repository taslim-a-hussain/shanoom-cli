import fs from "fs/promises";
import yaml from "js-yaml";
import chalk from "chalk";
import path from "path";
import ora from "ora";
import { ftrim } from "gokit";
import { createDomainCall, getDomainCall } from "../apicall/domain.js";
import { createContentCall, updateContentCall, deleteContentCall, getContentCall, getContentsCall } from "../apicall/content.js";
import { dataFileContents, prepareData, getCwdName, isoDateParse } from "../lib/index.js";
import chokidar from "chokidar";

const domainNameMinLength = 2;

const { log, error: logError } = console;

const bgBlueShade = chalk.bgHex("#24455AFF");
const bgYellowShade = chalk.bgHex("#FFC331FF");
const blueShade = chalk.hex("#24455AFF");
const yellowShade = chalk.hex("#FFC331FF");

// Raw Action
export const raw = async () => {
	try {
		const data = await dataFileContents();

		const cwdName = getCwdName();

		log("\n" + bgBlueShade(yellowShade(" Domain: ")) + bgYellowShade(blueShade(` ${cwdName} `)));

		// Print out the total number of files
		log(chalk.green(` Total: ${data.length} content(s) \n`));

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

		await createDomainCall(token, data);
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

		// First Check if content already exists in the database
		const contentExists = await getContentCall(token, domainName, content.name);

		// If content already exists, Check for changes
		if (contentExists) {
			// Check content hash against existing content hash (if they are the same, do nothing else update)
			if (contentExists.hash === content.hash) {
				log(chalk.greenBright.bold(`Watching content ${content.name} in ${domainName} domain.`));
				return;
			} else {
				// Update the content
				const result = await updateContentCall(token, domainName, content.name, content);
				return result;
			}
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

// Delete Content Action
export const deleteContent = async (token, filePath, domainName) => {
	try {
		// File name
		const fileName = path.basename(filePath, path.extname(filePath)).split(".")[0];

		// Update the content
		const result = await deleteContentCall(token, domainName, fileName);

		return result;
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

// Get Content Action
export const getContent = async (token, contentName) => {
	try {
		// Get domain name
		const domainName = path.basename(process.cwd());

		// Get the content by content name
		const result = await getContentCall(token, domainName, contentName);
		log("content: ", result.name);
		log(result.data);
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

// Get all Content Action
export const getContents = async (token) => {
	try {
		// Get domain name
		const domainName = path.basename(process.cwd());

		// Get the content by content name
		const result = await getContentsCall(token, domainName);

		// Loop through the contents and print result.name and result.data
		for (const item of result) {
			log(chalk.bgWhite.blueBright(" Content: ") + chalk.bgBlueBright.whiteBright(` ${item.name} `));
			log(chalk.whiteBright(` CreatedAt: `) + isoDateParse(item.createdAt));
			log(chalk.whiteBright(` UpdatedAt: `) + isoDateParse(item.updatedAt));
			log(item.data);
			log(chalk.green("=".repeat(80)) + "\n");
		}
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

// Get all data content Action
export const getAllData = async (token) => {
	try {
		// Get domain name
		const domainName = path.basename(process.cwd());

		// Get the content by content name
		const result = await getContentsCall(token, domainName);

		// Loop through the contents and print result.name and result.data
		for (const item of result) {
			const { name, data } = item;
			// filename is the name of the content (e.g. user.data.js)
			const filename = `${name}.data.yml`;
			// Get the file path
			const filePath = `${process.cwd()}/${filename}`;

			// Convert the data to YAML format
			const yamlData = yaml.dump(data);

			// Write the data to the file
			await fs.writeFile(filePath, yamlData);

			console.log(chalk.greenBright.bold(`File: ${filename} created successfully.`));
		}
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};

const handleFiles = async (args = {}, apiCallback) => {
	const { token, filePath, domainName } = args;

	const result = await apiCallback(token, filePath, domainName);

	if (result) {
		// Extract the relative file path by removing the cwd name
		const relativePath = path.relative(process.cwd(), filePath);

		const color = result === "Created" ? "greenBright" : result === "Updated" ? "yellowBright" : "redBright";

		// Perform CRUD operations or any other actions based on the file change event
		log(chalk[color].bold(`File: ${relativePath} has been ${result.toLowerCase()}.`));
	}
};

// Content Manager Action
export const contentManager = async (token) => {
	try {
		// Get the current working directory name
		const domainName = path.basename(process.cwd());

		// Validate the domain name
		if (domainName.length < domainNameMinLength) {
			log(chalk.red(`Domain name (${domainName}) must be at least ${domainNameMinLength} characters long.`));
			return;
		}

		// Get Domain name from the databass
		const response = await getDomainCall(token, domainName);

		// If the domain doesn't exist, create it

		if (!response) {
			const spinner = ora("Creating domain...").start();
			await createDomainDecreetly(token, domainName);
			spinner.succeed(`Domain ${domainName} created successfully`);
		}

		// Define the glob pattern for the files to be tracked
		const filePattern = `${process.cwd()}/**/*.data.{yml,yaml}`;

		// Initialize the Chokidar watcher
		const watcher = chokidar.watch(filePattern, {
			ignored: /(^|[\\/])\../, // ignore dotfiles
			persistent: true
		});

		// Event listeners for file changes
		watcher.on("add", (filePath) => handleFiles({ token, filePath, domainName }, createContent));
		watcher.on("change", (filePath) => handleFiles({ token, filePath, domainName }, updateContent));
		watcher.on("unlink", (filePath) => handleFiles({ token, filePath, domainName }, deleteContent));

		// Read user input
		process.stdin.resume();
		process.stdin.setEncoding("utf8");

		process.stdin.on("data", (data) => {
			const input = data.trim();
			// handleFiles(input, ''); // Pass the input as the event and empty path
			if (input === "exit") {
				process.exit();
			} else {
				log(chalk.red(`Invalid input: ${input}. Use 'exit' to exit.`));
			}
		});
	} catch (error) {
		logError(chalk.red(`Error: ${error.message}`));
	}
};
