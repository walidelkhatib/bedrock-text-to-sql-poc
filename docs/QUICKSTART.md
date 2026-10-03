# Quick Start Guide

Get the Bedrock Text-to-SQL Agent running in under 30 minutes.

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.11+ installed (`python3 --version`)
- [ ] Bedrock access to Claude Sonnet 4.5 (see below)

### Enable Bedrock Model Access

1. Go to AWS Console → Amazon Bedrock → Model access
2. Click "Manage model access"
3. Select "Claude Sonnet 4.5"
4. Click "Request model access"
5. Wait for approval (usually instant)

## Installation Steps

### 1. Build Lambda Dependencies (2 minutes)

```bash
chmod +x scripts/build-lambda-layer.sh
./scripts/build-lambda-layer.sh
```

### 2. Deploy Infrastructure (10-15 minutes)

```bash
cd infrastructure
npm install
npm run build
cdk bootstrap  # Only needed first time
npm run deploy
```

**Save the outputs!** You'll need:
- ApiEndpoint
- DatabaseSecretArn
- QueryExecutionLambdaArn
- BedrockAgentRoleArn

### 3. Seed Database (1 minute)

```bash
# Still in infrastructure directory
npm run seed-database
```

### 4. Create Bedrock Agent (2 minutes)

```bash
cd ../scripts
chmod +x setup-bedrock-agent.sh
./setup-bedrock-agent.sh
```

**Save the Agent ID and Alias ID from the output!**

### 5. Update API Lambda (30 seconds)

```bash
chmod +x update-lambda-env.sh
./update-lambda-env.sh <AGENT_ID> <ALIAS_ID>
```

Replace `<AGENT_ID>` and `<ALIAS_ID>` with values from step 4.

### 6. Launch Frontend (2 minutes)

```bash
cd ../frontend
npm install

# Create .env file with your API endpoint
echo "REACT_APP_API_ENDPOINT=<YOUR_API_GATEWAY_URL>" > .env

npm start
```

The app opens at http://localhost:3000

## First Test

Try these queries in the web interface:

1. "How many customers do we have?"
2. "Show me all products in the Electronics category"
3. "What is the total revenue?"

## Troubleshooting

### "Bedrock model not found"
→ Enable Claude Sonnet 4.5 access in Bedrock console

### "Database connection failed"
→ Wait 2-3 minutes for RDS to fully initialize after deployment

### "Agent not responding"
→ Check CloudWatch logs: `/aws/lambda/<QueryExecutionLambdaArn>`

### "CORS error in frontend"
→ Verify API endpoint URL in `.env` file

## What's Next?

- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
- See [TESTING.md](TESTING.md) for testing strategies
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production considerations

## Cleanup

When you're done testing:

```bash
# Delete Bedrock Agent
aws bedrock-agent delete-agent --agent-id <AGENT_ID>

# Delete infrastructure
cd infrastructure
npm run destroy
```

## Cost Estimate

Running this POC costs approximately:
- **Development/Testing**: $2-5 per day
- **Idle (not in use)**: $1-2 per day (RDS + NAT Gateway)

Main costs:
- RDS t3.micro: ~$0.50/day
- NAT Gateway: ~$1/day
- Lambda: Pay per use
- Bedrock: Pay per token (~$0.003 per 1K tokens)

**Tip**: Destroy the stack when not in use to minimize costs!
