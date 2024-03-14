#!/usr/bin/env node

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { program } from "commander";
import { login, whoami, profile, logout } from "./action/user.js";
import { raw, removeData, getContent, getContents, getDataFilesFromDB, deleteAllContent } from "./action/content.js";
import contentManager from "./action/content-manager.js";
import run from "./action/run-command.js";
import { checkTokenFile, auth, notAuth } from "./lib/index.js";
import chalk from "chalk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
const pkg = JSON.parse(packageJsonContent);

// Check if the .shanoomrc file exists in the user's directory and if it does, read the token else create the file
checkTokenFile();

// Package info and commands (shanoom)
program
	.name(pkg.name)
	.description(pkg.description)
	.version(pkg.version, "-v, --version, -V", "output the current version");

// Raw data command (shanoom raw) to view the raw data of the current directory
program
	.command("raw")
	.description("View the contents (from <filename>.data.[yml|yaml]) of the current directory")
	.action(raw);

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

// Run command (shanoom run)
program
	.command("run")
	.description("Will update, delete, and create content into your account")
	.action(async () => {
		await auth(run);
	});

// Profile command
program
	.command("profile")
	.description("View your profile")
	.action(async () => {
		await auth(profile);
	});

// Removes all data files command (shanoom removeDataFiles or shanoom rdf)
program
	.command("removeDataFiles")
	.alias("rdf")
	.description("Removes all the data files under the current domain only and not from the database.")
	.action(async () => {
		await auth(removeData);
	});

// Get all data files command (shanoom getDataFiles or shanoom gdf)
program
	.command("getDataFiles")
	.alias("gdf")
	.description("Get all the data files under the current domain")
	.action(async () => {
		await auth(getDataFilesFromDB);
	});

// Delete all content command (shanoom deleteAllContent or shanoom dac)
program
	.command("deleteAllContent")
	.alias("dac")
	.description("Delete all the content under the current domain")
	.action(async () => {
		await auth(deleteAllContent);
	});

// Get content command (shanoom getContent or shanoom get-content)
program
	.command("getContent")
	.alias("gc")
	.description(`Get a content by a content's name`)
	.option("-n, --name <name>", "Get a content by content name")
	// add option -m --more to get extra data like createdAt and updatedAt, default is false
	.option("-m, --more", "Get more data like createdAt and updatedAt")
	.action(async (options) => {
		if (options.name) {
			const name = options.name;
			const more = options.more || false;
			await auth(getContent, { name, more });
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
	.alias("gcs")
	.description("Get all the contents under current domain")
	// add option -m --more to get extra data like createdAt and updatedAt, default is false
	.option("-m, --more", "Get more data like createdAt and updatedAt")
	.action(async (options) => {
		const more = options.more || false;
		await auth(getContents, { more });
	});

// Content Manager command (shanoom contentManager)
program
	.command("watch")
	.description("Will watch for changes and will update, delete, and create content into your account")
	.action(async () => {
		await auth(contentManager);
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
