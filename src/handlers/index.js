const newman = require("newman");
const fs = require("fs");
const path = require("path");

const defaultPostmanCollection = "default.postman_collection.json";

/**
 * Lambda function that uses Newman to run a Postman collection
 * @param {*} event Postman environment as loaded from a Postman environment file JSON
 * @returns {Object} Postman collection run response. Includes the following:
 * - StatusCode: 200 | 500
 * - message: "Run completed successfully!" | "Run Failed!"
 * - encoded: Base64 encoded jUnit XML test result
 * - stats: Details of the run results total, failed, and pending counts for pre request scripts, tests, assertions, requests, and more
 */
exports.handler = async (event) => {
  const postmanCollection = path.join(
    __dirname,
    "../../collections",
    (process.env.POSTMAN_COLLECTION || defaultPostmanCollection)
  );
  const outpath = "/tmp/apitestsuites_xmlresults.xml";
  let response = { StatusCode: 500, message: "Run Failed!", encoded: "", stats: {} };
  let newmanResult;

  console.log(
    "Begining API Tests with Postman collection " + postmanCollection
  );
  console.log("Output path: " + outpath);

  try {
    // Trigger Newman, then encode the resulting XML file to be returned
    newmanResult = await newmanRun(outpath, postmanCollection, event);
    const message = await encodeResults(outpath);
    response = {
      StatusCode: 200,
      message: "Run completed successfully!",
      encoded: message,
      stats: newmanResult.run.stats,
    };
  } catch (e) {
    console.log(e);
  }
  return response;
};

/**
 * Runs newman using a input postmanCollection file.
 * @param {String} outpath System file path to write the output JUnit file
 * @param {String} postmanCollection Postman collection file path
 * @param {Object} postmanEnvironment Postman environment object
 * @returns
 */
function newmanRun(outpath, postmanCollection, postmanEnvironment) {
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection: require(postmanCollection),
        reporters: ["cli", "junit"],
        reporter: {
          junit: {
            export: outpath,
          },
        },
        environment: postmanEnvironment,
        // envVar: []
      },
      function (err, summary) {
        if (err) {
          console.log("Run Failed!");
          reject(err);
        } else {
          console.log("Run Successful!");
          resolve(summary);
        }
      }
    );
  });
}

/**
 * This function handles the Base64 encoding of the Postman run results JUnit file
 * @param {String} path System file path of the JUnit file
 * @returns 
 */
function encodeResults(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, function (err, data) {
      console.log("Attempting to encode the file: " + path);
      if (err) {
        reject(err);
      } else {
        resolve(Buffer.from(data).toString("base64"));
      }
    });
  });
}
