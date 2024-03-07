import { makeAPICallWithRetries } from "../lib/util.js";

const resource = "content";

// Create content for a domain
export const createContentCall = async (token, domainName, data, spinner) => {
	const url = `${resource}/${domainName}`;
	return await makeAPICallWithRetries("post", spinner, token, url, data);
};

// Update content for a domain
export const updateContentCall = async (token, domainName, contentName, data, spinner) => {
	const url = `${resource}/${domainName}/${contentName}`;
	return await makeAPICallWithRetries("patch", spinner, token, url, data);
};

// Delete content for a domain
export const deleteContentCall = async (token, domainName, contentName, spinner) => {
	const url = `${resource}/${domainName}/${contentName}`;
	return await makeAPICallWithRetries("delete", spinner, token, url);
};

// Get content for a domain (By domain name and content name)
export const getContentCall = async (token, domainName, contentName, spinner) => {
	const url = `${resource}/${domainName}/${contentName}`;
	return await makeAPICallWithRetries("get", spinner, token, url);
};

// Get all content for a domain (By domain name)
export const getContentsCall = async (token, domainName, spinner) => {
	const url = `${resource}/cli/list/${domainName}`;
	return await makeAPICallWithRetries("get", spinner, token, url);
};
