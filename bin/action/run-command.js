import { spinner } from "../lib/util.js";
import chalk from "chalk";
import path from "path";
import {
	packageJsonExists,
	validDomainName,
	createDomainIfNotExists,
	synchronizeDataFiles,
} from "../lib/content-helper.js";
import { dataFileProcessor } from "../utils/run-command-help.js";

// Run Action
const run = async (token) => {
	try {
		// Set the initial text for the spinner
		spinner.start("Processing...");

		// Check if package.json exists
		const packageJsonPresent = await packageJsonExists();

		if (!packageJsonPresent) {
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

		// Process data files
		const onhand = await dataFileProcessor(token, domainName, spinner);

		// Synchronize data files
		await synchronizeDataFiles(token, domainName, spinner, onhand);

		// Stop the spinner
		spinner.succeed("Data files successfully processed.");
	} catch (error) {
		spinner.stop();
		console.error(chalk.red(`- ${error.message}`));
		process.exit(1);
	}
};

export default run;
