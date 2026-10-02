# Testing Guide

## Manual Testing

### 1. Test Database Connection

After seeding the database, verify the data:

```bash
# Get database endpoint and secret from CloudFormation outputs
aws secretsmanager get-secret-value --secret-id <SECRET_ARN>

# Connect using psql (if available)
psql -h <DB_ENDPOINT> -U postgres -d salesdb

# Run test queries
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
```

### 2. Test Lambda Functions Directly

Test the Query Execution Lambda:

```bash
aws lambda invoke \
  --function-name <QUERY_EXECUTION_LAMBDA_NAME> \
  --payload '{
    "actionGroup": "DatabaseActions",
    "apiPath": "/get-schema",
    "parameters": []
  }' \
  response.json

cat response.json
```

Test query execution:

```bash
aws lambda invoke \
  --function-name <QUERY_EXECUTION_LAMBDA_NAME> \
  --payload '{
    "actionGroup": "DatabaseActions",
    "apiPath": "/execute-query",
    "parameters": [
      {
        "name": "sql_query",
        "value": "SELECT * FROM customers LIMIT 5"
      }
    ]
  }' \
  response.json

cat response.json
```

### 3. Test Bedrock Agent

Test the agent directly:

```bash
aws bedrock-agent-runtime invoke-agent \
  --agent-id <AGENT_ID> \
  --agent-alias-id <ALIAS_ID> \
  --session-id test-session-1 \
  --input-text "Show me all customers" \
  output.txt

cat output.txt
```

### 4. Test API Gateway

Test the full API:

```bash
curl -X POST <API_GATEWAY_URL>/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many customers do we have?",
    "session_id": "test-123"
  }'
```

## Example Test Queries

### Basic Queries
- "How many customers do we have?"
- "Show me all products"
- "List the first 5 orders"

### Aggregation Queries
- "What is the total revenue?"
- "How many orders were placed in January 2024?"
- "What is the average order value?"

### Join Queries
- "Show me customers from California with their orders"
- "What are the top 5 best-selling products?"
- "List all orders with customer names"

### Complex Queries
- "What is the total revenue by product category?"
- "Which customers have spent more than $1000?"
- "Show me the monthly sales trend"

### Error Cases
- "Delete all customers" (should be blocked)
- "Drop the orders table" (should be blocked)
- "Show me data from nonexistent_table" (should error gracefully)

## Query Validation Tests

The system should block these dangerous queries:

```sql
-- Should be blocked
DELETE FROM customers;
DROP TABLE orders;
INSERT INTO products VALUES (...);
UPDATE customers SET email = 'hacked';
ALTER TABLE orders ADD COLUMN malicious;
```

The system should allow these safe queries:

```sql
-- Should work
SELECT * FROM customers;
SELECT COUNT(*) FROM orders;
SELECT * FROM products WHERE category = 'Electronics';
```

## Performance Testing

### Load Testing with Artillery

Install Artillery:
```bash
npm install -g artillery
```

Create `load-test.yml`:
```yaml
config:
  target: "<API_GATEWAY_URL>"
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Query API"
    flow:
      - post:
          url: "/query"
          json:
            query: "How many customers do we have?"
            session_id: "load-test-{{ $randomString() }}"
```

Run the test:
```bash
artillery run load-test.yml
```

## Monitoring During Tests

### CloudWatch Logs

View Lambda logs:
```bash
aws logs tail /aws/lambda/<FUNCTION_NAME> --follow
```

### CloudWatch Metrics

Check Lambda metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=<FUNCTION_NAME> \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Troubleshooting Common Issues

### Issue: Agent returns empty response
- Check CloudWatch logs for Lambda errors
- Verify agent was prepared successfully
- Ensure Lambda has Bedrock invoke permissions

### Issue: Database connection timeout
- Check security group rules
- Verify Lambda is in correct VPC subnets
- Check RDS is running and accessible

### Issue: SQL validation errors
- Review the query being generated
- Check if query contains forbidden keywords
- Verify query syntax is valid PostgreSQL

### Issue: Bedrock throttling
- Check Bedrock service quotas
- Implement exponential backoff
- Consider request rate limiting

## Integration Tests

Create a test script `test-integration.sh`:

```bash
#!/bin/bash

API_URL="<YOUR_API_GATEWAY_URL>"

echo "Test 1: Basic query"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How many customers?", "session_id": "test-1"}'

echo -e "\n\nTest 2: Aggregation"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the total revenue?", "session_id": "test-2"}'

echo -e "\n\nTest 3: Complex query"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Top 5 products by sales", "session_id": "test-3"}'

echo -e "\n\nTest 4: Error handling"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Delete all data", "session_id": "test-4"}'
```

## Expected Results

All queries should:
1. Return within 5-10 seconds
2. Provide clear, formatted responses
3. Handle errors gracefully
4. Block dangerous SQL operations
5. Maintain session context
