import fs from "fs/promises";
import fsync from "fs";
import path from "path";
import { glob } from "glob";
import yaml from "js-yaml";
import chalk from "chalk";
import { processMedia } from "../utils/content.js";

const shanoomrcPath = path.join(process.env.HOME, ".shanoomrc");

export const getToken = async () => {
	try {
		const fileContents = await fs.readFile(shanoomrcPath, "utf-8");
		const { token } = JSON.parse(fileContents);
		return token;
	} catch (error) {
		throw new Error("Error reading .shanoomrc file:", error.message);
	}
};

// Delete the .shanoomrc file
export const deleteTokenFile = () => {
	fsync.unlinkSync(shanoomrcPath);
};

// Empty the .shanoomrc file
export const deleteToken = () => {
	fsync.writeFileSync(shanoomrcPath, JSON.stringify({ token: "" }));
};

// If the .shanoomrc file doesn't exist, create it with an empty token
export const checkTokenFile = () => {
	if (!fsync.existsSync(shanoomrcPath)) {
		fsync.writeFileSync(shanoomrcPath, JSON.stringify({ token: "" }));
	}
};

// Create a middleware function to check if the user is logged in, for authenticated operations
export const auth = async (next, options = {}) => {
	const token = await getToken();
	if (!token) {
		console.log("You are not logged in");
		process.exit();
	}
	// loader(next, token, options);
	next(token, options);
};

// Middleware to check if the user is already logged in, for unauthenticated operations
export const notAuth = async (next) => {
	const token = await getToken();
	if (token) {
		console.log("You are already logged in");
		process.exit();
	}
	next();
};

// Remove props from an object
export const removeProps = (obj, keys = []) => {
	if (keys) {
		// remove the keys from the object
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			delete obj[key];
		}
	}

	return obj;
};

// ISO Date Parser
export const isoDateParse = (isoDate) => {
	const date = new Date(isoDate);
	const humanReadableDate = date.toLocaleString();
	return humanReadableDate;
};

/**
 * Search for files matching a pattern and return an array of objects with the file name as key and the file path as value
 * @returns {Promise<Array>} Of object with file name as key and file path as value
 */
export const getDataFiles = async () => {
	const pattern = "**/*.data.{yml,yaml}"; // Pattern to match files

	const fileNameRegex = /([^/]+)\.data\.(yml|yaml)$/; // Regex to extract the file name from the file path

	const rawFiles = await glob(pattern, { ignore: "node_modules/**" }); // Get all files matching the pattern

	const names = [];

	// Create an array of objects with the file name as key and the file path as value
	const files = rawFiles.map((file) => {
		const fileName = file.match(fileNameRegex)[1];
		names.push(fileName);
		return { [fileName]: file };
	});

	return { files, names };
};

// Remove all data files from the project directory matching the pattern **/*.data.{yml,yaml}
export const removeDataFiles = () => {
	const pattern = "**/*.data.{yml,yaml}";
	const files = glob.sync(pattern, { ignore: "node_modules/**" });

	// Delete all files
	for (const file of files) {
		fsync.unlinkSync(file);
	}
};

// Remove all data files from the project directory matching the pattern **/*.data.{yml,yaml} asynchronously
export const removeDataFilesAsync = async () => {
	const pattern = "**/*.data.{yml,yaml}";
	const files = await glob(pattern, { ignore: "node_modules/**" });

	// Delete all files
	const deletePromises = files.map((file) => fs.unlink(file));

	await Promise.all(deletePromises);
};

/**
 * Returns an array of objects containing the name and data of each file in the data directory.
 * @returns {Promise<Array<{name: string, data: any}>>} An array of objects containing the name and data of each .data.[yml|yaml] file.
 */
export const dataFileContents = async () => {
	const { files, names } = await getDataFiles();

	// Check if same name appears more than once in the names array
	for (const name of names) {
		const nameExists = names.filter((n) => n === name).length > 1;
		if (nameExists) {
			throw new Error(`Duplicate data file name "${name}" found.`);
		}
	}

	const contents = [];

	// Loop through the array of objects and read file names and paths
	for (const file of files) {
		const fileName = Object.keys(file)[0];
		const filePath = Object.values(file)[0];

		// Read the file content
		let fileContent = await fs.readFile(path.resolve(filePath), "utf8");

		// trim the file content
		fileContent = fileContent.trim();

		// Parse the file content to a JS object
		const data = yaml.load(fileContent);

		contents.push({ name: fileName, path: filePath, data });
	}

	return contents;
};

export const prepareDataFile = async (fileInfo) => {
	try {
		const { relative, full, name } = fileInfo;
		// Read the file content
		let fileContent = await fs.readFile(full, "utf8");

		// trim the file content
		fileContent = fileContent.trim();

		// Parse the file content to a JS object
		const data = yaml.load(fileContent);

		// Process media
		const contents = await processMedia([{ name, path: relative, data }]);
		return contents[0];
	} catch (error) {
		throw new Error(error.message);
	}
};

export const prepareAllDataFiles = async () => {
	try {
		let contents = await dataFileContents();

		// Process media
		contents = await processMedia(contents);

		return contents;
	} catch (error) {
		throw new Error(chalk.bgWhite(chalk.red(` ${error.message} `)));
	}
};

// Get the current working directory name
export const getCwdName = () => {
	const cwd = process.cwd();
	const cwdName = cwd.split(path.sep).pop();
	return cwdName;
};
