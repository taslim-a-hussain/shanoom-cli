import { makeAPICallWithRetries } from "../lib/util.js";

const resource = "user";

// Login
export const loginCall = async (pass) => {
	const url = `${resource}/login`;
	return await makeAPICallWithRetries("post", "", url, pass);
};

// Get user (info)
export const getUserCall = async (token) => {
	const url = resource;
	return await makeAPICallWithRetries("get", token, url);
};

// Logout
export const logoutCall = async (token) => {
	const url = `${resource}/logout`;
	return await makeAPICallWithRetries("post", token, url);
};
