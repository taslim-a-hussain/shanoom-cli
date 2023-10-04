import crc32 from "crc-32";

export const hashContent = (content) => {
	try {
		const hashedContent = crc32.str(content);
		return hashedContent.toString();
	} catch (error) {
		throw new Error("Error while hashing content");
	}
};
