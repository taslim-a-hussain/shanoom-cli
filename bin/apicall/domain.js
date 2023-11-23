import { makeAPICallWithRetries } from "../lib/util.js";

const resource = "domain";

// Create a domain
export const createDomainCall = async (token, data, spinner) => {
	const url = `${resource}`;
	return await makeAPICallWithRetries("post", spinner, token, url, data);
};

// Get all domains
export const getDomainsCall = async (token) => {
	const url = `${resource}/list`;
	return await makeAPICallWithRetries("get", token, url);
};

// Get domain by name
export const getDomainCall = async (token, domainName, spinner) => {
	const url = `${resource}/${domainName}`;
	return await makeAPICallWithRetries("get", spinner, token, url);
};

// Update domain
export const updateDomainCall = async (token, domainName, data) => {
	const url = `${resource}/${domainName}`;
	return await makeAPICallWithRetries("patch", token, url, data);
};

// Delete domain by name
export const deleteDomainCall = async (token, domainName) => {
	const url = `${resource}/${domainName}`;
	return await makeAPICallWithRetries("delete", token, url);
};

// Delete all domains
export const deleteDomainsCall = async (token) => {
	const url = resource;
	return await makeAPICallWithRetries("delete", token, url);
};
