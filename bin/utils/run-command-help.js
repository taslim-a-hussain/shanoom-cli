import { getDataFiles, getToken, getCwdName, prepareAllDataFiles } from "../lib/index.js";
import chalk from "chalk";
import ora from "ora";
import { getContentCountCall, createContentCall } from "../apicall/content.js";

const spinner = ora();

export const smartSync = async (callback) => {
	const { names } = await getDataFiles();

	const token = await getToken();
	const domainName = getCwdName();

	const { count } = await getContentCountCall(token, domainName, spinner);

	if (names.length < count) {
		callback();
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
			if (res.action === "No changes") {
				spinner.info(`No changes detected for ${res.name}.`);
			} else {
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
