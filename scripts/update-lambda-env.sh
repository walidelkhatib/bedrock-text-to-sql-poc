#!/bin/bash

# Script to update API Lambda environment variables with Bedrock Agent details

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./update-lambda-env.sh <AGENT_ID> <ALIAS_ID>"
  exit 1
fi

AGENT_ID=$1
ALIAS_ID=$2
STACK_NAME="BedrockTextToSqlStack"

# Get API Lambda function name
LAMBDA_NAME=$(aws cloudformation describe-stack-resources \
  --stack-name $STACK_NAME \
  --query "StackResources[?LogicalResourceId=='ApiFunction'].PhysicalResourceId" \
  --output text)

echo "Updating Lambda function: $LAMBDA_NAME"

# Update environment variables
aws lambda update-function-configuration \
  --function-name "$LAMBDA_NAME" \
  --environment "Variables={BEDROCK_AGENT_ID=$AGENT_ID,BEDROCK_AGENT_ALIAS_ID=$ALIAS_ID}"

echo "✅ Lambda environment variables updated!"
