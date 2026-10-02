# Deployment Checklist

Use this checklist to ensure a smooth deployment of the Bedrock Text-to-SQL Agent.

## Pre-Deployment

### Prerequisites
- [ ] AWS Account created
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS CLI configured (`aws sts get-caller-identity`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.11+ installed (`python3 --version`)
- [ ] AWS CDK installed (`cdk --version`)
- [ ] Git installed (optional)

### AWS Setup
- [ ] Bedrock access enabled in AWS Console
- [ ] Claude 3.5 Sonnet v2 access granted
- [ ] Using supported region (us-east-1, us-west-2, etc.)
- [ ] IAM permissions verified (AdministratorAccess or equivalent)
- [ ] CDK bootstrapped (`cdk bootstrap`)

### Project Setup
- [ ] Project downloaded/cloned
- [ ] Scripts made executable (`chmod +x scripts/*.sh`)
- [ ] Reviewed documentation (README.md, QUICKSTART.md)

## Deployment Steps

### Step 1: Build Lambda Layer
- [ ] Run `./scripts/build-lambda-layer.sh`
- [ ] Verify `lambda/layers/dependencies/python/` directory created
- [ ] Check for any error messages

**Expected time**: 2 minutes

### Step 2: Deploy Infrastructure
- [ ] Navigate to `infrastructure/` directory
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run deploy`
- [ ] Wait for deployment to complete (10-15 minutes)
- [ ] Save CloudFormation outputs:
  - [ ] ApiEndpoint
  - [ ] DatabaseSecretArn
  - [ ] DatabaseEndpoint
  - [ ] QueryExecutionLambdaArn
  - [ ] BedrockAgentRoleArn

**Expected time**: 15 minutes

**Troubleshooting**:
- If CDK bootstrap error: Run `cdk bootstrap`
- If permission error: Check IAM permissions
- If timeout: Check AWS Console for actual status

### Step 3: Seed Database
- [ ] Still in `infrastructure/` directory
- [ ] Run `npm run seed-database`
- [ ] Verify success message
- [ ] Check customer count (should be 10)

**Expected time**: 1 minute

**Troubleshooting**:
- If connection timeout: Wait 2-3 minutes for RDS to initialize
- If secret not found: Check CloudFormation outputs
- If SQL error: Check database/schema.sql syntax

### Step 4: Create Bedrock Agent
- [ ] Navigate to `scripts/` directory
- [ ] Run `./setup-bedrock-agent.sh`
- [ ] Wait for agent creation
- [ ] Save from output:
  - [ ] Agent ID
  - [ ] Alias ID
- [ ] Verify agent status is "PREPARED"

**Expected time**: 2 minutes

**Troubleshooting**:
- If model not found: Enable Claude 3.5 Sonnet in Bedrock console
- If permission error: Check Bedrock IAM permissions
- If agent exists: Delete old agent first

### Step 5: Update API Lambda
- [ ] Still in `scripts/` directory
- [ ] Run `./update-lambda-env.sh <AGENT_ID> <ALIAS_ID>`
- [ ] Replace placeholders with actual values
- [ ] Verify success message

**Expected time**: 30 seconds

**Troubleshooting**:
- If Lambda not found: Check CloudFormation stack deployed
- If permission error: Check Lambda IAM permissions

### Step 6: Deploy Frontend
- [ ] Navigate to `frontend/` directory
- [ ] Run `npm install`
- [ ] Create `.env` file:
  ```bash
  echo "REACT_APP_API_ENDPOINT=<YOUR_API_URL>" > .env
  ```
- [ ] Replace `<YOUR_API_URL>` with ApiEndpoint from Step 2
- [ ] Run `npm start`
- [ ] Browser opens to http://localhost:3000

**Expected time**: 2 minutes

**Troubleshooting**:
- If npm install fails: Clear npm cache
- If port 3000 in use: Kill process or use different port
- If API error: Check .env file has correct URL

## Post-Deployment

### Verification
- [ ] Frontend loads successfully
- [ ] API endpoint configured
- [ ] Test query: "How many customers do we have?"
- [ ] Verify response (should be 10)
- [ ] Test query: "Show me all products"
- [ ] Verify products listed
- [ ] Test query: "What is the total revenue?"
- [ ] Verify calculation returned

### Testing
- [ ] Run `./scripts/test-api.sh <API_URL>`
- [ ] All tests pass
- [ ] No error messages
- [ ] Response times < 10 seconds

### Monitoring
- [ ] Check CloudWatch Logs for Lambda
- [ ] Verify no errors in logs
- [ ] Check RDS connections
- [ ] Monitor Bedrock token usage

## Configuration

### Save Important Values
Create a file `deployment-info.txt` with:
```
Deployment Date: [DATE]
AWS Region: [REGION]
Stack Name: BedrockTextToSqlStack

API Gateway URL: [URL]
Agent ID: [ID]
Agent Alias ID: [ALIAS_ID]
Database Endpoint: [ENDPOINT]
Database Secret ARN: [ARN]

Frontend URL: http://localhost:3000
```

### Environment Variables
- [ ] Frontend `.env` file created
- [ ] API Lambda environment variables set
- [ ] All secrets in Secrets Manager

## Security Review

### Network
- [ ] RDS in private subnet ✓
- [ ] Lambda in private subnet ✓
- [ ] Security groups configured ✓
- [ ] No public database access ✓

### Access Control
- [ ] IAM roles use least privilege ✓
- [ ] No hardcoded credentials ✓
- [ ] Secrets in Secrets Manager ✓
- [ ] API Gateway CORS configured ✓

### Query Validation
- [ ] Only SELECT queries allowed ✓
- [ ] Dangerous keywords blocked ✓
- [ ] SQL injection protection ✓
- [ ] Error messages sanitized ✓

## Documentation

### Review
- [ ] Read ARCHITECTURE.md
- [ ] Review EXAMPLE_QUERIES.md
- [ ] Bookmark TROUBLESHOOTING.md
- [ ] Understand cost implications

### Team Sharing
- [ ] Share API endpoint URL
- [ ] Document custom queries
- [ ] Set up monitoring alerts
- [ ] Plan backup strategy

## Cost Management

### Initial Setup
- [ ] Understand cost breakdown (~$50/month)
- [ ] Set up billing alerts
- [ ] Configure budget in AWS
- [ ] Plan for cleanup when not in use

### Optimization
- [ ] Consider VPC endpoints (save $30/month)
- [ ] Plan RDS scheduling
- [ ] Implement query caching
- [ ] Monitor token usage

## Cleanup (When Done)

### Temporary Shutdown
- [ ] Stop RDS instance (save $15/day)
- [ ] Keep infrastructure for later

### Complete Removal
- [ ] Run `./scripts/cleanup.sh <AGENT_ID>`
- [ ] Verify all resources deleted
- [ ] Check for orphaned resources
- [ ] Verify no ongoing charges

## Troubleshooting

If anything fails, check:
1. [ ] CloudWatch Logs for detailed errors
2. [ ] AWS Console for resource status
3. [ ] TROUBLESHOOTING.md for common issues
4. [ ] Prerequisites are all met
5. [ ] Region supports all services

## Success Criteria

Deployment is successful when:
- [ ] All infrastructure deployed
- [ ] Database seeded with sample data
- [ ] Bedrock Agent created and prepared
- [ ] Frontend loads and connects to API
- [ ] Test queries return correct results
- [ ] No errors in CloudWatch Logs
- [ ] Response times acceptable (< 10s)

## Next Steps

After successful deployment:
1. [ ] Try example queries from EXAMPLE_QUERIES.md
2. [ ] Customize database schema for your data
3. [ ] Add authentication if needed
4. [ ] Implement monitoring and alerts
5. [ ] Plan for production deployment

## Notes

Use this space for deployment-specific notes:

```
Date: _______________
Deployed by: _______________
Region: _______________
Issues encountered: _______________
_______________________________________________
_______________________________________________
_______________________________________________
```

---

**Estimated Total Time**: 30-40 minutes
**Difficulty**: Intermediate
**Cost**: ~$2-5 for testing, ~$50/month if left running

Good luck with your deployment! 🚀
