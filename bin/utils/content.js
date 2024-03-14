import fs from "fs/promises";
import path from "path";

export const processMedia = async (contents) => {
	const stack = [...contents];

	let relativePath = "";

	while (stack.length > 0) {
		const current = stack.pop();

		if (current.path) {
			relativePath = current.path;
		}

		for (const key of Object.keys(current)) {
			if (typeof current[key] === "object" && current[key] !== null) {
				stack.push(current[key]);
			} else if (key === "src") {
				const fileLink = current[key].startsWith("/") ? current[key].slice(1) : current[key];

				try {
					// Use try-catch for error handling
					const buf = await fs.readFile(path.resolve(fileLink));
					current.ext = path.extname(fileLink);
					current.src = buf.toString("binary");
				} catch (error) {
					throw new Error(`File not found: ${current[key]} in the ${relativePath} file. ${error.message}`);
				}
			}
		}
	}

	return contents;
};
