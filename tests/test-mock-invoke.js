const fs = require("fs");
const lambda = require("../src/handlers/index");
const environmentFile = "tests/mock.postman_environment.json";

async function callLambda() {
  const environmentFp = fs.readFileSync(environmentFile);
  const environmentAsEvent = JSON.parse(environmentFp);

  const response = await lambda.handler(environmentAsEvent);
  console.log("Response:");
  console.log(response);
}

callLambda();
