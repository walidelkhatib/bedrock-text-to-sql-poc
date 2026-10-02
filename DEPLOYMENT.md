# Deployment Guide

This guide walks you through deploying the Bedrock Text-to-SQL Agent POC.

## Prerequisites

1. AWS Account with appropriate permissions for:
   - CloudFormation
   - VPC, RDS, Lambda
   - API Gateway
   - Bedrock (with Claude 3.5 Sonnet access)
   - IAM, Secrets Manager

2. AWS CLI configured with credentials:
   ```bash
   aws configure
   ```

3. Node.js 18+ and npm installed

4. Python 3.11+ and pip installed

5. Request access to Claude 3.5 Sonnet in Bedrock:
   - Go to AWS Console → Bedrock → Model access
   - Request access to "Claude 3.5 Sonnet v2"

## Step 1: Build Lambda Layer

Build the Python dependencies layer:

```bash
chmod +x scripts/build-lambda-layer.sh
./scripts/build-lambda-layer.sh
```

## Step 2: Deploy Infrastructure

Install CDK dependencies and deploy:

```bash
cd infrastructure
npm install
npm run build
npm run deploy
```

This will create:
- VPC with public, private, and database subnets
- RDS PostgreSQL database
- Lambda functions
- API Gateway
- IAM roles and security groups

Save the stack outputs - you'll need them for the next steps.

## Step 3: Seed Database

Load the sample sales data:

```bash
cd infrastructure
npm run seed-database
```

This creates the schema and inserts sample customers, products, and orders.

## Step 4: Create Bedrock Agent

Run the setup script to create the Bedrock Agent:

```bash
cd scripts
chmod +x setup-bedrock-agent.sh
./setup-bedrock-agent.sh
```

This script will:
- Create the Bedrock Agent with Claude 3.5 Sonnet
- Configure the action group with Lambda integration
- Create an agent alias
- Set up permissions

Save the Agent ID and Alias ID from the output.

## Step 5: Update API Lambda

Update the API Lambda with Bedrock Agent details:

```bash
chmod +x scripts/update-lambda-env.sh
./scripts/update-lambda-env.sh <AGENT_ID> <ALIAS_ID>
```

Replace `<AGENT_ID>` and `<ALIAS_ID>` with values from Step 4.

## Step 6: Deploy Frontend

1. Get the API Gateway endpoint from the CloudFormation outputs

2. Configure the frontend:
   ```bash
   cd frontend
   npm install
   ```

3. Create `.env` file:
   ```bash
   echo "REACT_APP_API_ENDPOINT=<YOUR_API_GATEWAY_URL>" > .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The app will open at http://localhost:3000

## Step 7: Test the Application

Try these example queries:
- "Show me all customers from California"
- "What are the top 5 best-selling products?"
- "How many orders were placed in January 2024?"
- "What is the total revenue by product category?"

## Troubleshooting

### Bedrock Access Issues
- Ensure you have requested and been granted access to Claude 3.5 Sonnet in the Bedrock console
- Check that your region supports Bedrock (us-east-1, us-west-2 recommended)

### Database Connection Issues
- Verify the Lambda security group has access to RDS
- Check that the database secret is accessible
- Ensure the database was seeded successfully

### Lambda Timeout
- Increase Lambda timeout in the CDK stack if needed
- Check CloudWatch Logs for detailed error messages

### Agent Not Responding
- Verify the agent was prepared successfully
- Check that Lambda permissions allow Bedrock invocation
- Review Bedrock Agent logs in CloudWatch

## Cleanup

To remove all resources:

```bash
# Delete Bedrock Agent (manual - not in CloudFormation)
aws bedrock-agent delete-agent --agent-id <AGENT_ID>

# Delete CloudFormation stack
cd infrastructure
npm run destroy
```

## Cost Considerations

This POC will incur costs for:
- RDS PostgreSQL (t3.micro instance)
- NAT Gateway
- Lambda invocations
- Bedrock model invocations
- API Gateway requests

Estimated cost: $20-50/month for light usage.

To minimize costs:
- Stop/delete the stack when not in use
- Use RDS instance scheduling
- Consider Aurora Serverless for production
