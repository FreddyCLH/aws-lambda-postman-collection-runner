# AWS Lambda Postman collection runner

An AWS Lambda function to run Postman collections using [Newman](https://github.com/postmanlabs/newman).

## Table of contents

- [General info](#general-info)
- [Pre-requisites](#pre-requisites)
- [Setup](#setup)
- [Invoking the Lambda Postman collection runner and viewing the results](#invoking-the-lambda-postman-collection-runner-and-viewing-the-results)

## General info

[Newman](https://github.com/postmanlabs/newman) is a command-line collection runner for Postman. This AWS SAM project deploys a single AWS Lambda function that uses Newman to run a Postman collection. By invoking the deployed Lambda function you can run your desired Postman collection to test APIs (and other HTTP endpoints).

The Postman environment payload can be passed as the Lambda invoke event allowing you to run your Postman collection test with your desired Postman environment values.
A successful run of the Lambda function will return the Postman test results in JUnit XML format as a base64 encoded field.

Here are some uses for this Lambda:
- Use with [Amazon Eventbridge schedule](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html) rule to periodically test an API endpoint.
- Use in a CICD pipeline (such as [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/actions-invoke-lambda-function.html)) to test your deployed API endpoint.
- Test an API endpoint in a VPC closed of subnet by deploying the Lambda in to the same VPC.

Be aware of the following considerations when running Postman collection tests from Lambda: 
- Lambda has a maximum run time of 15 minutes. You should make sure your Postman collection tests do not take longer than this.
- By default, Lambda is deployed with internet connectivity but without connectivity to any of your VPC resources. You need to configure your [Lambda networking](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html) so that it can reach where you API endpoint to test is located.

## Pre-requisites

- Node.js - [Install Node.js 18](https://nodejs.org/en/), including the npm package management tool.
- AWS SAM CLI - [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
- AWS CLI - [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

## Setup

Place your [exported Postman collection files](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/#exporting-collections) in the **collections** directory.

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build
sam deploy --guided
```

When prompted for the Parameter `postmanCollection`, enter the name of Postman collection file that you want to run (that you had placed in the **collections** directory).

Take note of the Lambda Function name in the output `lambdaFunctionName`.

## Invoking the Lambda Postman collection runner and viewing the results

Obtain your deployed Lambda Function name from the sam deploy output `lambdaFunctionName`.
Alternatively, you can retrieve the function name from the CloudFormation stack output using the following command:

_Replace `${STACK_NAME}` with your SAM deployed CloudFormation stack name._

```bash
aws cloudformation describe-stacks --stack-name ${STACK_NAME}
```

To invoke Lambda Postman collection runner without any Postman environment variables use the following command:

_Replace `${FUNCTION_NAME}` with your SAM deployed Lambda Function name._

```bash
aws lambda invoke --function-name ${FUNCTION_NAME} invoke-response.json
```

To invoke Lambda Postman collection runner with Postman environment variables, first prepare the Postman environment variables file. This can be [exported from Postman](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/#exporting-environments) (providing a `*.postman_environment.json` file). Then use the following command that references the file:

_Replace `${ENVIRONMENT_FILE}` with your Postman environment variable file._

```bash
aws lambda invoke --function-name ${FUNCTION_NAME} \
  --payload file://${ENVIRONMENT_FILE} \
  invoke-response.json \
  --cli-binary-format raw-in-base64-out
```

The Lambda invocation output containing the Postman collection run results is written to the file `invoke-response.json`.

Example `invoke-response.json`:

```json
{
    "StatusCode": 200,
    "message": "Run completed successfully!",
    "encoded": "PD94bWwgdmV...",
    "stats": {
        ...omitted for brevity...
        "requests": {
            "total": 2,
            "pending": 0,
            "failed": 0
        },
        "assertions": {
            "total": 4,
            "pending": 0,
            "failed": 1
        }
    }
}
```

The Postman collection run XML Junit output is base64 encoded in the `encoded` field. You can using the following command with [jq](https://stedolan.github.io/jq/download/) to decode it straight from the `invoke-response.json` file.

```bash
cat invoke-response.json | jq -r '.encoded' | base64 --decode
```
