#!/bin/bash

# Script to create Bedrock Agent using AWS CLI
# This script should be run after CDK deployment

set -e

echo "Setting up Bedrock Agent..."

# Get stack outputs
STACK_NAME="BedrockTextToSqlStack"
LAMBDA_ARN=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='QueryExecutionLambdaArn'].OutputValue" --output text)
ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='BedrockAgentRoleArn'].OutputValue" --output text)
REGION=$(aws configure get region)

echo "Lambda ARN: $LAMBDA_ARN"
echo "Role ARN: $ROLE_ARN"
echo "Region: $REGION"

# Update agent config with Lambda ARN
sed "s|LAMBDA_ARN_PLACEHOLDER|$LAMBDA_ARN|g" ../bedrock/agent-config.json > /tmp/agent-config.json

# Create the agent
echo "Creating Bedrock Agent..."
AGENT_ID=$(aws bedrock-agent create-agent \
  --agent-name "TextToSqlAgent" \
  --foundation-model "us.anthropic.claude-sonnet-4-5-20250929-v1:0" \
  --instruction "You are a helpful SQL assistant that converts natural language questions into SQL queries and executes them against a sales database. The database contains information about customers, products, orders, and order items. When a user asks a question: 1. First, get the database schema using the get-schema action to understand the available tables and columns 2. Convert the natural language question into a valid SQL SELECT query 3. Execute the query using the execute-query action 4. Present the results in a clear, human-readable format 5. If there's an error, explain what went wrong and suggest corrections. Always validate that your SQL queries are safe and only use SELECT statements. Never generate queries that modify data (INSERT, UPDATE, DELETE, DROP, etc.). Be conversational and helpful. If the user's question is ambiguous, ask for clarification." \
  --agent-resource-role-arn "$ROLE_ARN" \
  --idle-session-ttl-in-seconds 600 \
  --region $REGION \
  --query 'agent.agentId' \
  --output text)

echo "Agent ID: $AGENT_ID"

# Wait for agent to be ready
echo "Waiting for agent to be ready..."
sleep 5

# Create action group
echo "Creating action group..."
aws bedrock-agent create-agent-action-group \
  --agent-id "$AGENT_ID" \
  --agent-version "DRAFT" \
  --action-group-name "DatabaseActions" \
  --action-group-executor lambda="$LAMBDA_ARN" \
  --api-schema file:///tmp/agent-config.json \
  --region $REGION

# Prepare the agent
echo "Preparing agent..."
aws bedrock-agent prepare-agent \
  --agent-id "$AGENT_ID" \
  --region $REGION

# Wait for preparation
echo "Waiting for agent preparation..."
sleep 10

# Create agent alias
echo "Creating agent alias..."
ALIAS_ID=$(aws bedrock-agent create-agent-alias \
  --agent-id "$AGENT_ID" \
  --agent-alias-name "prod" \
  --region $REGION \
  --query 'agentAlias.agentAliasId' \
  --output text)

echo "Alias ID: $ALIAS_ID"

# Grant Lambda permission to be invoked by Bedrock
echo "Granting Lambda permissions..."
aws lambda add-permission \
  --function-name "$LAMBDA_ARN" \
  --statement-id "AllowBedrockInvoke" \
  --action "lambda:InvokeFunction" \
  --principal "bedrock.amazonaws.com" \
  --source-arn "arn:aws:bedrock:$REGION:$(aws sts get-caller-identity --query Account --output text):agent/$AGENT_ID" \
  --region $REGION || echo "Permission may already exist"

echo ""
echo "✅ Bedrock Agent setup complete!"
echo ""
echo "Agent ID: $AGENT_ID"
echo "Alias ID: $ALIAS_ID"
echo ""
echo "Update your API Lambda environment variables with:"
echo "  BEDROCK_AGENT_ID=$AGENT_ID"
echo "  BEDROCK_AGENT_ALIAS_ID=$ALIAS_ID"
