# Troubleshooting Guide

Common issues and their solutions.

## Deployment Issues

### Issue: CDK Bootstrap Failed

**Error**: "This stack uses assets, so the toolkit stack must be deployed"

**Solution**:
```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Issue: Insufficient Permissions

**Error**: "User is not authorized to perform: cloudformation:CreateStack"

**Solution**:
- Ensure your AWS user has AdministratorAccess or equivalent permissions
- Required permissions: CloudFormation, VPC, RDS, Lambda, IAM, Bedrock, API Gateway

### Issue: RDS Creation Timeout

**Error**: "Resource creation cancelled" or timeout during RDS creation

**Solution**:
- RDS can take 10-15 minutes to create
- Check AWS Console → RDS to see actual status
- If failed, check CloudFormation events for specific error
- May need to increase allocated storage or change instance type

## Bedrock Issues

### Issue: Model Not Found

**Error**: "Could not resolve foundation model"

**Solution**:
1. Go to AWS Console → Bedrock → Model access
2. Request access to "Claude 3.5 Sonnet v2"
3. Wait for approval (usually instant)
4. Verify model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`

### Issue: Bedrock Not Available in Region

**Error**: "Bedrock is not available in this region"

**Solution**:
- Use a supported region: us-east-1, us-west-2, eu-west-1, ap-southeast-1
- Update CDK stack region in `bin/app.ts`
- Redeploy: `npm run deploy`

### Issue: Agent Creation Failed

**Error**: "Failed to create agent"

**Solution**:
```bash
# Check if agent already exists
aws bedrock-agent list-agents

# Delete existing agent if needed
aws bedrock-agent delete-agent --agent-id <AGENT_ID>

# Retry creation
./scripts/setup-bedrock-agent.sh
```

### Issue: Agent Not Responding

**Error**: Agent returns empty or error responses

**Solution**:
1. Verify agent was prepared:
   ```bash
   aws bedrock-agent get-agent --agent-id <AGENT_ID>
   ```
2. Check agent status is "PREPARED"
3. Verify Lambda permissions:
   ```bash
   aws lambda get-policy --function-name <LAMBDA_NAME>
   ```
4. Check CloudWatch logs for Lambda errors

## Database Issues

### Issue: Database Connection Failed

**Error**: "Could not connect to database" or timeout

**Solution**:
1. Wait 2-3 minutes after deployment for RDS to initialize
2. Check security group rules:
   ```bash
   aws ec2 describe-security-groups --group-ids <SG_ID>
   ```
3. Verify Lambda is in correct VPC subnets
4. Check RDS status in AWS Console

### Issue: Database Seeding Failed

**Error**: "Error seeding database" or "relation does not exist"

**Solution**:
```bash
# Check if database is accessible
aws rds describe-db-instances --db-instance-identifier <DB_ID>

# Verify secret exists
aws secretsmanager get-secret-value --secret-id <SECRET_ARN>

# Retry seeding
cd infrastructure
npm run seed-database
```

### Issue: SQL Syntax Error

**Error**: "syntax error at or near..."

**Solution**:
- Check the generated SQL in CloudWatch logs
- Verify PostgreSQL syntax compatibility
- Ensure table and column names are correct
- Check for reserved keywords

## Lambda Issues

### Issue: Lambda Timeout

**Error**: "Task timed out after 30.00 seconds"

**Solution**:
1. Increase timeout in CDK stack:
   ```typescript
   timeout: cdk.Duration.seconds(60)
   ```
2. Check database query performance
3. Add indexes to frequently queried columns
4. Optimize SQL queries

### Issue: Lambda Out of Memory

**Error**: "Runtime exited with error: signal: killed"

**Solution**:
1. Increase memory in CDK stack:
   ```typescript
   memorySize: 1024
   ```
2. Check for memory leaks in Lambda code
3. Optimize data processing

### Issue: Lambda Can't Access RDS

**Error**: "Connection timeout" or "Network unreachable"

**Solution**:
1. Verify Lambda is in private subnet with NAT Gateway
2. Check security group allows Lambda → RDS on port 5432
3. Verify RDS is in database subnet
4. Check VPC route tables

### Issue: Missing Dependencies

**Error**: "No module named 'psycopg2'" or similar

**Solution**:
```bash
# Rebuild Lambda layer
./scripts/build-lambda-layer.sh

# Redeploy
cd infrastructure
npm run deploy
```

## API Gateway Issues

### Issue: CORS Error

**Error**: "Access-Control-Allow-Origin header is missing"

**Solution**:
- Verify CORS is enabled in API Gateway
- Check Lambda returns proper CORS headers
- Clear browser cache
- Try in incognito mode

### Issue: 403 Forbidden

**Error**: "Missing Authentication Token" or 403 error

**Solution**:
- Verify API Gateway URL is correct
- Check API Gateway resource and method exist
- Verify Lambda integration is configured
- Check IAM permissions for API Gateway

### Issue: 502 Bad Gateway

**Error**: "Internal server error"

**Solution**:
1. Check Lambda logs in CloudWatch
2. Verify Lambda returns proper response format
3. Check Lambda execution role permissions
4. Test Lambda directly to isolate issue

## Frontend Issues

### Issue: API Endpoint Not Set

**Error**: "Please configure API endpoint"

**Solution**:
```bash
cd frontend
echo "REACT_APP_API_ENDPOINT=<YOUR_API_URL>" > .env
npm start
```

### Issue: Network Error

**Error**: "Network Error" or "Failed to fetch"

**Solution**:
1. Verify API Gateway URL is correct
2. Check API is deployed and accessible
3. Test API with curl:
   ```bash
   curl -X POST <API_URL>/query \
     -H "Content-Type: application/json" \
     -d '{"query": "test", "session_id": "test"}'
   ```
4. Check browser console for detailed errors

### Issue: Empty Responses

**Error**: Agent returns empty or "undefined"

**Solution**:
1. Check Bedrock Agent is working:
   ```bash
   aws bedrock-agent-runtime invoke-agent \
     --agent-id <AGENT_ID> \
     --agent-alias-id <ALIAS_ID> \
     --session-id test \
     --input-text "test query"
   ```
2. Verify Lambda environment variables are set
3. Check CloudWatch logs for errors

## Query Validation Issues

### Issue: Query Blocked

**Error**: "Query contains forbidden keyword"

**Solution**:
- This is expected for dangerous operations (DELETE, DROP, etc.)
- Only SELECT queries are allowed
- Rephrase query to use SELECT
- This is a security feature, not a bug

### Issue: SQL Generation Error

**Error**: "Failed to generate SQL" or invalid SQL

**Solution**:
1. Rephrase query more clearly
2. Provide more context in the question
3. Check database schema is accessible
4. Try simpler query first
5. Review agent instructions in `bedrock/agent-config.json`

## Performance Issues

### Issue: Slow Response Times

**Symptoms**: Queries take >10 seconds

**Solution**:
1. Add database indexes:
   ```sql
   CREATE INDEX idx_orders_date ON orders(order_date);
   ```
2. Optimize SQL queries
3. Increase Lambda memory
4. Use RDS read replicas for read-heavy workloads
5. Implement query result caching

### Issue: High Costs

**Symptoms**: Unexpected AWS bills

**Solution**:
1. Check Bedrock token usage in CloudWatch
2. Verify NAT Gateway data transfer
3. Monitor RDS instance hours
4. Implement request throttling
5. Use VPC endpoints instead of NAT Gateway
6. Stop/delete stack when not in use

## Debugging Tips

### Enable Detailed Logging

Add to Lambda functions:
```python
import logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
```

### View CloudWatch Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/<FUNCTION_NAME> --follow

# API Gateway logs
aws logs tail /aws/apigateway/<API_ID> --follow
```

### Test Components Individually

1. Test database directly:
   ```bash
   psql -h <DB_ENDPOINT> -U postgres -d salesdb
   ```

2. Test Lambda directly:
   ```bash
   aws lambda invoke --function-name <NAME> --payload '{}' output.json
   ```

3. Test Bedrock Agent directly:
   ```bash
   aws bedrock-agent-runtime invoke-agent \
     --agent-id <ID> --agent-alias-id <ALIAS> \
     --session-id test --input-text "test"
   ```

4. Test API Gateway:
   ```bash
   curl -X POST <API_URL>/query -d '{"query":"test"}'
   ```

### Check Resource Status

```bash
# CloudFormation stack
aws cloudformation describe-stacks --stack-name BedrockTextToSqlStack

# RDS instance
aws rds describe-db-instances

# Lambda functions
aws lambda list-functions

# Bedrock agents
aws bedrock-agent list-agents
```

## Getting Help

If you're still stuck:

1. Check CloudWatch Logs for detailed error messages
2. Review AWS service quotas and limits
3. Verify all prerequisites are met
4. Try deploying in a different region
5. Check AWS Service Health Dashboard
6. Review the ARCHITECTURE.md for system design

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| "Access Denied" | IAM permissions | Check IAM roles and policies |
| "Timeout" | Network or performance | Check security groups, increase timeout |
| "Not Found" | Wrong resource ID | Verify resource exists and ID is correct |
| "Throttling" | Rate limits | Implement backoff, request quota increase |
| "Invalid Parameter" | Wrong input format | Check API documentation, validate inputs |
