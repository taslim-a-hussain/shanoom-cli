import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import JSON5 from "json5";
import { hashContent } from "./content-hash.js";

/**
 * Search for files matching a pattern and return an array of objects with the file name as key and the file path as value
 * @returns {Promise<Array>} Of object with file name as key and file path as value
 */
const getFiles = async () => {
	const pattern = "**/*.data.{js,mjs}"; // Pattern to match files

	const fileNameRegex = /([^/]+)\.data\.(js|mjs)$/; // Regex to extract the file name from the file path

	const rawFiles = await glob(pattern, { ignore: "node_modules/**" }); // Get all files matching the pattern

	// Create an array of objects with the file name as key and the file path as value
	const filesObj = rawFiles.map((file) => {
		const fileName = file.match(fileNameRegex)[1];
		return { [fileName]: file };
	});

	return filesObj;
};

/**
 * From an array of objects with the file name as key and the file path as value, * return an object with the file name as key and the file content as value
 * @param {Array} filesObj Array of objects with the file name as key and the file * * * path as value
 * @returns {Promise<Object>} Object with the file name as key and the file content as * value
 */
export const filesContent = async () => {
	const files = await getFiles();

	const data = [];

	// Loop through the array of objects and read file names and paths
	for (const file of files) {
		const fileName = Object.keys(file)[0];
		const filePath = Object.values(file)[0];

		// Read the file content
		const fileContent = await fs.readFile(path.resolve(filePath), "utf8");

		const regex = /{([^}]+)}/gm; // Match everything between curly brackets
		const matches = regex.exec(fileContent); // Execute the regex on the file content

		if (matches && matches.length > 1) {
			// If there is a match
			const textBetweenCurlyBrackets = matches[0]; // Get the first match
			const sanitizedText = textBetweenCurlyBrackets.replace(/'/g, '"'); // Replace single quotes with double quotes (JSON5 requires double quotes)
			const json5Data = new Function(`return ${sanitizedText}`)(); // Evaluate the string as JavaScript code (using function constructor instead of eval to avoid security issues)

			data.push({ name: fileName, data: json5Data });
		}
	}

	return data;
};

/* 
1. `readFile`:
   - Reads the file using `fs.readFile` and parses the data using regular expressions and JSON5 library.
   - It performs string manipulations to remove the `export default` or `module.exports` statement and the trailing semicolon.
   - Then it uses `JSON5.parse` to parse the resulting JSON-like data.
   - This approach relies on string manipulations and regex, which can have some performance impact for larger files.
   - Suitable for scenarios where the file structure is known to be JSON-like and doesn't involve complex JavaScript logic.
*/
export const readFile = async (filePath) => {
	// Get contents from filePath
	const rawData = await fs.readFile(filePath, "utf8");

	const name = path.basename(filePath, path.extname(filePath)).split(".")[0];
	let data = {};
	let hash = hashContent(JSON.stringify(data));

	if (!rawData) {
		return { name, hash, data };
	}

	// Remove export default or module.exports statement
	let trimmedData = rawData.replace(/(module\.exports\s*=\s*|export\s+default\s*)/, "");
	// Remove semicolon from the end of the file
	trimmedData = trimmedData.replace(/;\s*$/, "");

	try {
		// Parse the JSON5 data
		data = JSON5.parse(trimmedData);
	} catch (error) {
		throw new Error("Invalid JS Object in file: " + filePath);
	}

	// Hash
	hash = hashContent(JSON.stringify(data));

	// Return content (in JS object format)
	return { name, hash, data };
};
