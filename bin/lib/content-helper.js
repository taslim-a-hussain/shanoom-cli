import fs from "fs/promises";
import path from "path";
import { getDomainCall, createDomainCall } from "../apicall/domain.js";
import { createContentCall, getContentsCall } from "../apicall/content.js";
import { prepareAllDataFiles, removeDataFilesAsync } from "../lib/index.js";
import { ftrim } from "gokit";
import chalk from "chalk";

const domainNameMinLength = 2;

// Create Domain decreetly (without asking for domain name and description)
export const createDomainDecreetly = async (token, domainName, spinner) => {
	try {
		const packagePath = `${process.cwd()}/package.json`;

		// Read the package.json file
		const packageData = await fs.readFile(packagePath, "utf-8");

		const pkg = JSON.parse(packageData);

		// Get the description from package.json or set it to an empty string
		const description = pkg.description || "";

		const data = {
			name: ftrim(domainName).replace(/\s+/g, "-").toLowerCase(),
			description,
		};

		return await createDomainCall(token, data, spinner);
	} catch (error) {
		throw new Error(error);
	}
};

export const shutdown = async (watcher) => {
	// Read user input
	process.stdin.resume();
	process.stdin.setEncoding("utf8");

	const handleSignal = async () => {
		try {
			watcher.close();
			// Perform synchronous operations before the process exits
			await removeDataFilesAsync();
		} catch (error) {
			console.error("Error during shutdown:", error);
		} finally {
			process.exit(0);
		}
	};

	process.stdin.on("data", async (data) => {
		const input = data.toString().trim().toLowerCase(); // Convert the input to a string and remove any trailing whitespace

		if (input === "exit" || input === "quit") {
			await handleSignal();
		}
	});

	process.on("SIGINT", handleSignal);
	process.on("SIGTERM", handleSignal);
};

export const handleSignal = async (watcher) => {
	try {
		watcher.close();
		// Perform synchronous operations before the process exits
		// await removeDataFilesAsync();
	} catch (error) {
		console.error("Error during shutdown:", error);
	} finally {
		process.exit(0);
	}
};

export const handleFiles = async (args = {}, apiCallback) => {
	const { token, filePath, domainName, spinner, watcher, action } = args;
	try {
		// Extract the relative file path by removing the cwd name
		const relativePath = path.relative(process.cwd(), filePath);

		// File name
		const name = path.basename(filePath, path.extname(filePath)).split(".")[0];

		spinner.start(`${action}... file: ${relativePath}`);

		const result = await apiCallback(token, { relative: relativePath, full: filePath, name }, domainName, spinner);

		if (result?.action !== "No changes") {
			const color =
				result.action === "Created"
					? "greenBright"
					: result.action === "Updated"
					? "yellowBright"
					: "redBright";

			// Perform CRUD operations or any other actions based on the file change event
			spinner.succeed(chalk[color].bold(`File: ${relativePath} has been ${result.action.toLowerCase()}.`));
		} else {
			// Stop the spinner
			spinner.stop();
		}
	} catch (error) {
		spinner.fail(chalk.red(error.message));
		spinner.stop();
		handleSignal(watcher);
	}
};

export const packageJsonExists = async () => {
	try {
		await fs.access("./package.json");
		return true;
	} catch {
		return false;
	}
};

export const validDomainName = (domainName, spinner) => {
	// Validate the domain name
	if (domainName.length < domainNameMinLength) {
		spinner.fail(`Domain name (${domainName}) must be at least ${domainNameMinLength} characters long.`);
		return false;
	}
	return domainName;
};

export const createDomainIfNotExists = async (token, domainName, spinner) => {
	try {
		// Get Domain name from the databass
		const response = await getDomainCall(token, domainName, spinner);

		// If the domain doesn't exist, create it
		if (!response) {
			spinner.text = "Creating domain...";
			const msg = await createDomainDecreetly(token, domainName, spinner);
			if (msg === "Created") {
				spinner.succeed(`Domain "${domainName}" has been successfully created.`);
			} else {
				spinner.fail(`Operation failed: ${msg}`);
			}
		}
	} catch (error) {
		throw new Error(error.message);
	}
};

export const synchronizeDataFiles = async (token, domainName, spinner, onhand = false) => {
	try {
		const result = await getContentsCall(token, domainName, spinner);

		// If the result is empty, return
		if (!result) {
			return;
		}

		if (onhand && result.length === onhand.length) {
			return;
		}

		spinner.text = "Synchronizing data files...";

		const writePromises = result.map((item) => {
			const { path, clidata } = item;

			const content = Buffer.from(clidata, "utf-16le").toString("utf-8");

			fs.writeFile(path, content);
		});

		await Promise.all(writePromises);

		spinner.succeed(`Data files successfully synchronized.`);
	} catch (error) {
		throw new Error(error);
	}
};

export const dataFileProcessor = async (token, domainName, spinner) => {
	try {
		spinner.start("Processing data files...");

		const promises = [];
		const contents = await prepareAllDataFiles();

		for (const content of contents) {
			spinner.text = `Processing ${content.name}...`;

			promises.push(createContentCall(token, domainName, content, spinner));
		}

		spinner.text = "Processing data files...";

		const result = await Promise.all(promises);

		// Log the result
		for (const res of result) {
			if (res.action && res.action !== "No changes") {
				const color =
					res.action === "Created" ? "greenBright" : res.action === "Updated" ? "yellowBright" : "redBright";
				spinner.succeed(
					chalk[color].bold(
						`File: ${res.path} has been ${res.action.toLowerCase()}. Content name: ${res.name}.`
					)
				);
			}
		}

		return contents;
	} catch (error) {
		throw new Error(error.message);
	}
};
