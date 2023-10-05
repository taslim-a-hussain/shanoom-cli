import { assert } from "chai";
import { describe, it } from "mocha";
import { hashContent } from "../../bin/lib/content-hash.js";

describe("content-hash", () => {
	describe("content-hash", () => {
		it("should return a hash for a given string or json object", () => {
			const hash = hashContent("test");
			assert.strictEqual(hash, "-662733300");
		});

		// should return type string
		it("should return type string", () => {
			const hash = hashContent("test");
			assert.typeOf(hash, "string");
		});

		// what will it return for a json object
		it("should return a hash for a json object", () => {
			const obj = { name: "test" };
			const toJSON = JSON.stringify(obj);
			const hash = hashContent(toJSON);
			assert.strictEqual(hash, "1243668434");
		});

		// should return hash 0 if no string is passed. Eg object, array, number
		it("should return a hash of 0 for an empty string, or for any invalid string types (eg. js object, number and etc)", () => {
			const hash = hashContent(2);
			assert.strictEqual(hash, "0");
		});

		// what if no content is passed throw an error
		it("should throw an error if no content is passed", () => {
			assert.throws(() => hashContent(), Error, "Error while hashing content");
		});
	});
});
