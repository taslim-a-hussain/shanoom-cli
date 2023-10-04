import fs from "fs/promises";
import fsync from "fs";
import path from "path";
import { glob } from "glob";
import ora from "ora";
import { hashContent } from "./content-hash.js";
import yaml from "js-yaml";

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

// Spinner function
export const spinner = (action, options = {}) => {
	const startMessage = options.startMessage || "Wait a moment...";
	const endMessage = options.endMessage || `👍`;

	const spin = ora(startMessage).start();

	action();
	spin.succeed(endMessage);
};

const loader = (next, token, ops = {}) => {
	const startMessage = ops.startMessage || "Wait a moment...";
	const endMessage = ops.endMessage || `👍`;

	const spinner = ora(startMessage).start();

	next(token, ops.option);
	spinner.succeed(endMessage);
};

// Create a middleware function to check if the user is logged in, for authenticated operations
export const auth = async (next, ops = {}) => {
	const token = await getToken();
	if (!token) {
		console.log("You are not logged in");
		process.exit(1);
	}
	loader(next, token, ops);
};

// Middleware to check if the user is already logged in, for unauthenticated operations
export const notAuth = async (next) => {
	const token = await getToken();
	if (token) {
		console.log("You are already logged in");
		process.exit(1);
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
const getDataFiles = async () => {
	const pattern = "**/*.data.{yml,yaml}"; // Pattern to match files

	const fileNameRegex = /([^/]+)\.data\.(yml|yaml)$/; // Regex to extract the file name from the file path

	const rawFiles = await glob(pattern, { ignore: "node_modules/**" }); // Get all files matching the pattern

	// Create an array of objects with the file name as key and the file path as value
	const filesObj = rawFiles.map((file) => {
		const fileName = file.match(fileNameRegex)[1];
		return { [fileName]: file };
	});

	return filesObj;
};

/**
 * Returns an array of objects containing the name and data of each file in the data directory.
 * @returns {Promise<Array<{name: string, data: any}>>} An array of objects containing the name and data of each .data.[yml|yaml] file.
 */
export const dataFileContents = async () => {
	const files = await getDataFiles();

	const contents = [];

	// Loop through the array of objects and read file names and paths
	for (const file of files) {
		const fileName = Object.keys(file)[0];
		const filePath = Object.values(file)[0];

		// Read the file content
		const fileContent = await fs.readFile(path.resolve(filePath), "utf8");
		const data = yaml.load(fileContent);

		contents.push({ name: fileName, data });
	}

	return contents;
};

export const prepareData = async (filePath) => {
	try {
		let fileContent = await fs.readFile(filePath, "utf8");
		// trim the file content
		fileContent = fileContent.trim();
		// Get the file name
		const name = path.basename(filePath, path.extname(filePath)).split(".")[0];
		let data = {};
		let hash = hashContent(JSON.stringify(data));

		if (!fileContent) {
			return { name, hash, data };
		}

		data = yaml.load(fileContent);

		// Check if data is a valid JS object if not make data an empty object
		if (typeof data !== "object") {
			data = {};
		}

		hash = hashContent(JSON.stringify(data));

		// Return content (in JS object format)
		return { name, hash, data };
	} catch (error) {
		throw new Error("Error reading data file:", error.message);
	}
};

// Get the current working directory name
export const getCwdName = () => {
	const cwd = process.cwd();
	const cwdName = cwd.split(path.sep).pop();
	return cwdName;
};
