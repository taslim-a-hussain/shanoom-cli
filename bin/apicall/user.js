import { makeAPICallWithRetries } from "../lib/util.js";
import { spinner } from "../lib/util.js";

const resource = "user";

// Login
export const loginCall = async (pass) => {
	spinner.start("Logging in...");
	const url = `${resource}/cli/login`;
	return await makeAPICallWithRetries("post", spinner, null, url, pass);
};

// Get user (info)
export const getUserCall = async (token) => {
	spinner.start("Getting user info...");
	const url = `${resource}/info`;
	return await makeAPICallWithRetries("get", spinner, token, url);
};

// Logout
export const logoutCall = async (token) => {
	spinner.start("Logging out...");
	const url = `${resource}/cli/logout`;
	return await makeAPICallWithRetries("post", spinner, token, url);
};
