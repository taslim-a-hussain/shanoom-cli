import axios from "axios";
import isOnline from "is-online";
import ora from "ora";
import chokidar from "chokidar";
import { deleteTokenFile } from "./index.js";

const baseURL = "http://localhost:4000/api/v1/";

const MAX_RETRIES = 20;
const RETRY_DELAY_MS = 1000; // 1 second delay between retries

export const spinner = ora("Working on it..."); // Initialize a single spinner instance

// Export watchman function
export const watchman = () => {
	// Define the glob pattern for the files to be tracked
	const filePattern = `${process.cwd()}/**/*.data.{yml,yaml}`;

	// Initialize the Chokidar watchman
	const watchman = chokidar.watch(filePattern, {
		ignored: /(^|[\\/])\../, // ignore dotfiles
		persistent: true,
	});

	return watchman;
};

export const makeAPICallWithRetries = async (method, spinner, token, endPoint, data = null, retries = 0) => {
	try {
		// Check for internet connection
		if (!(await isOnline())) {
			throw new Error("No internet connection");
		}

		const response = await axios({
			method,
			url: `${baseURL}${endPoint}`,
			// If data is present then add it to the request else ignore it
			...(data && { data }),
			headers: {
				// If token then add it to the headers
				...(token && { Authorization: `Bearer ${token}` }),
				"Content-Type": "application/json",
			},
		});

		spinner.stop();
		return response.data;
	} catch (error) {
		// Retry logic for temporary network issues
		if (retries < MAX_RETRIES && error.message === "No internet connection") {
			spinner.text = `Retrying internet connection... (Attempt ${retries + 1} of ${MAX_RETRIES})`;
			await new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, RETRY_DELAY_MS);
			});
			return makeAPICallWithRetries(method, spinner, token, endPoint, data, retries + 1);
		}

		// Check if status code is 401
		if (error.response && error.response.status === 401) {
			// Remove the .shanoomrc file
			deleteTokenFile();
			spinner.fail("Please login again.");
			throw new Error("Unauthorized");
		}

		// if ECONNREFUSED, then the server is not running
		if (error.code === "ECONNREFUSED") {
			spinner.fail("Unable to connect to the server.");
			throw new Error("Please try again later.");
		}

		spinner.fail("Max retries exceeded. Unable to connect to the internet.");
		throw new Error("Please check your internet connection and try again.");
	}
};
