#!/usr/bin/env node

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { program } from "commander";
import { login, whoami, profile, logout } from "./action/user.js";
import { raw, contentManager, getContent, getContents, getAllData } from "./action/content.js";
import { checkTokenFile, auth, notAuth, spinner } from "./lib/index.js";
import chalk from "chalk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
const pkg = JSON.parse(packageJsonContent);

// Check if the .shanoomrc file exists in the user's directory and if it does, read the token else create the file
checkTokenFile();

// Package info and commands (shanoom)
program.name(pkg.name).description(pkg.description).version(pkg.version, "-v, --version, -V", "output the current version");

// Raw data command (shanoom raw) to view the raw data of the current directory
program
	.command("raw")
	.description("View the contents (from <filename>.data.shanoom.js) of the current directory")
	.action(() => {
		spinner(raw);
	});

// Login command
program
	.command("login")
	.description("Log in with your username and password")
	.action(async () => {
		await notAuth(login);
	});

// Whoami command
program
	.command("whoami")
	.description("Check who you are logged in as")
	.action(async () => {
		await auth(whoami);
	});

// Profile command
program
	.command("profile")
	.description("View your profile")
	.action(async () => {
		await auth(profile);
	});

// Get content command (shanoom getContent or shanoom get-content)
program
	.command("getContent")
	.alias("get-content")
	.description(`Get a content by a content's name`)
	.option("-n, --name <name>", "Get a content by content name")
	.action(async (options) => {
		if (options.name) {
			const option = options.name;
			await auth(getContent, { option });
		} else {
			// Print to user: option -n <name> is required
			console.log(chalk.yellowBright("Option -n <name> is required" + "\n"));

			// Run: shanoom getDomain -h programmaticaly
			program.parse(["node", "shanoom.js", "get-content", "-h"]);
		}
	});

// Get all content command (shanoom getContents or shanoom get-contents)
program
	.command("getContents")
	.alias("get-contents")
	.description("Get all the contents under current domain")
	.action(async () => {
		await auth(getContents);
	});

// Get all data command (shanoom getAllData or shanoom get-all-data)
program
	.command("getAllData")
	.alias("get-all-data")
	.description("Get all the data under current domain")
	.action(async () => {
		await auth(getAllData);
	});

// Content Manager command (shanoom contentManager)
program
	.command("watch")
	.description("Will watch for changes and will update, delete, and create content into your account")
	.action(async () => {
		await auth(contentManager, { endMessage: "Watching for changes..." });
	});

// Logout command
program
	.command("logout")
	.description("Log out of your account")
	.action(async () => {
		await auth(logout);
	});

// Parse the arguments
program.parse(process.argv);
