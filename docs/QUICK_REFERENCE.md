# Quick Reference Card

Essential commands and information for the Bedrock Text-to-SQL Agent.

## 🚀 Quick Commands

### Deploy Everything
```bash
# 1. Build dependencies
./scripts/build-lambda-layer.sh

# 2. Deploy infrastructure
cd infrastructure && npm install && npm run deploy

# 3. Seed database
npm run seed-database

# 4. Create agent
cd ../scripts && ./setup-bedrock-agent.sh

# 5. Update Lambda (use IDs from step 4)
./update-lambda-env.sh <AGENT_ID> <ALIAS_ID>

# 6. Start frontend
cd ../frontend && npm install
echo "REACT_APP_API_ENDPOINT=<API_URL>" > .env
npm start
```

### Test
```bash
# Test API
./scripts/test-api.sh <API_GATEWAY_URL>

# Test Bedrock Agent
aws bedrock-agent-runtime invoke-agent \
  --agent-id <ID> --agent-alias-id <ALIAS> \
  --session-id test --input-text "How many customers?"
```

### Cleanup
```bash
./scripts/cleanup.sh <AGENT_ID>
```

## 📋 CloudFormation Outputs

After deployment, save these:
- **ApiEndpoint**: API Gateway URL
- **DatabaseSecretArn**: RDS credentials
- **QueryExecutionLambdaArn**: Lambda function ARN
- **BedrockAgentRoleArn**: IAM role ARN

## 🔑 Important ARNs/IDs

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name BedrockTextToSqlStack \
  --query 'Stacks[0].Outputs'

# Get Agent ID
aws bedrock-agent list-agents \
  --query 'agentSummaries[0].agentId'

# Get Lambda function name
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `Query`)].FunctionName'
```

## 🗄️ Database Access

```bash
# Get database credentials
aws secretsmanager get-secret-value \
  --secret-id <SECRET_ARN> \
  --query SecretString --output text | jq

# Connect with psql
psql -h <DB_ENDPOINT> -U postgres -d salesdb
```

## 📊 Monitoring

### CloudWatch Logs
```bash
# Lambda logs
aws logs tail /aws/lambda/<FUNCTION_NAME> --follow

# Recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/<FUNCTION_NAME> \
  --filter-pattern "ERROR"
```

### Metrics
```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=<NAME> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 --statistics Sum
```

## 🧪 Example Queries

### Basic
```
How many customers do we have?
Show me all products
List pending orders
```

### Analytics
```
What is the total revenue?
Top 5 best-selling products
Revenue by product category
```

### Complex
```
Which customers have spent more than $1000?
Show me monthly sales trends
Products with low stock levels
```

## 🔧 Common Tasks

### Update Agent Instructions
```bash
# Edit bedrock/agent-config.json
# Then recreate agent
./scripts/setup-bedrock-agent.sh
```

### Update Database Schema
```bash
# Edit database/schema.sql
# Then reseed
cd infrastructure && npm run seed-database
```

### Update Lambda Code
```bash
# Edit lambda/functions/*.py
# Then redeploy
cd infrastructure && npm run deploy
```

### Update Frontend
```bash
# Edit frontend/src/*
# React hot-reloads automatically
```

## 🐛 Troubleshooting

### Check Service Status
```bash
# CloudFormation
aws cloudformation describe-stacks --stack-name BedrockTextToSqlStack

# RDS
aws rds describe-db-instances

# Lambda
aws lambda list-functions

# Bedrock Agent
aws bedrock-agent list-agents
```

### Common Fixes
```bash
# Rebuild Lambda layer
./scripts/build-lambda-layer.sh

# Redeploy infrastructure
cd infrastructure && npm run deploy

# Restart frontend
cd frontend && npm start

# Clear CDK cache
cd infrastructure && rm -rf cdk.out && cdk synth
```

## 💰 Cost Tracking

```bash
# Current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Set up budget alert
aws budgets create-budget \
  --account-id <ACCOUNT_ID> \
  --budget file://budget.json
```

## 🔐 Security

### Rotate Database Password
```bash
aws secretsmanager rotate-secret \
  --secret-id <SECRET_ARN>
```

### Update Security Group
```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp --port 5432 \
  --source-group <SOURCE_SG_ID>
```

### Review IAM Policies
```bash
aws iam get-role-policy \
  --role-name <ROLE_NAME> \
  --policy-name <POLICY_NAME>
```

## 📦 Backup & Restore

### Backup Database
```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier <DB_ID> \
  --db-snapshot-identifier backup-$(date +%Y%m%d)
```

### Export Configuration
```bash
# Export stack template
aws cloudformation get-template \
  --stack-name BedrockTextToSqlStack \
  --query TemplateBody > stack-backup.json

# Export agent config
aws bedrock-agent get-agent \
  --agent-id <AGENT_ID> > agent-backup.json
```

## 🔄 Updates

### Update CDK
```bash
npm install -g aws-cdk@latest
cd infrastructure && npm update aws-cdk-lib
```

### Update Dependencies
```bash
# Infrastructure
cd infrastructure && npm update

# Frontend
cd frontend && npm update

# Lambda layer
# Edit lambda/layers/dependencies/requirements.txt
./scripts/build-lambda-layer.sh
```

## 📞 Support Resources

| Issue | Resource |
|-------|----------|
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Errors | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Testing | [TESTING.md](TESTING.md) |
| Examples | [EXAMPLE_QUERIES.md](EXAMPLE_QUERIES.md) |

## 🎯 Performance Tuning

### Lambda
```typescript
// In CDK stack
memorySize: 1024,  // Increase for better performance
timeout: cdk.Duration.seconds(60),  // Increase if needed
```

### Database
```sql
-- Add indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_products_category ON products(category);

-- Analyze tables
ANALYZE customers;
ANALYZE products;
ANALYZE orders;
```

### Caching
```python
# Add to Lambda
import functools
from datetime import datetime, timedelta

@functools.lru_cache(maxsize=100)
def get_schema_cached():
    return get_schema_info()
```

## 🌐 Multi-Region

### Deploy to Another Region
```bash
# Update region in infrastructure/bin/app.ts
region: 'us-west-2'

# Bootstrap new region
cdk bootstrap aws://<ACCOUNT>/us-west-2

# Deploy
npm run deploy
```

## 📱 API Endpoints

### Query Endpoint
```bash
POST <API_URL>/query
Content-Type: application/json

{
  "query": "How many customers?",
  "session_id": "optional-session-id"
}
```

### Response Format
```json
{
  "response": "I found 10 customers in the database...",
  "session_id": "session-123"
}
```

## 🔍 Debugging

### Enable Debug Logging
```python
# In Lambda functions
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Test Lambda Locally
```bash
# Install SAM CLI
brew install aws-sam-cli

# Test function
sam local invoke QueryExecutionFunction \
  --event test-event.json
```

### Trace Requests
```bash
# Enable X-Ray tracing in CDK
tracing: lambda.Tracing.ACTIVE
```

## 📈 Scaling

### Increase Concurrency
```bash
aws lambda put-function-concurrency \
  --function-name <NAME> \
  --reserved-concurrent-executions 10
```

### Add Read Replica
```typescript
// In CDK stack
const replica = new rds.DatabaseInstanceReadReplica(this, 'Replica', {
  sourceDatabaseInstance: database,
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
});
```

## 🎓 Learning Resources

- [Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [CDK Workshop](https://cdkworkshop.com/)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/tutorial/)
- [React Docs](https://react.dev/)

---

**Keep this handy for quick reference!** 📌
