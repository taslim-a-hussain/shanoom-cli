import { spinner, watchman } from "../lib/util.js";
import chalk from "chalk";
import path from "path";
import {
	packageJsonExists,
	validDomainName,
	createDomainIfNotExists,
	synchronizeDataFiles,
	dataFileProcessor,
	handleFiles,
	handleSignal
} from "../lib/content-helper.js";
import { createContent, updateContent, deleteContent } from "./content.js";

// Content Manager Action
const contentManager = async (token) => {
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
		console.error(chalk.red(error.message));
		process.exit(1);
	}
};

export default contentManager;
