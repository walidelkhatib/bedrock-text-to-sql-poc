# Architecture Overview

## System Architecture

```
┌─────────────┐
│   React     │
│  Frontend   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│ API Lambda  │─────▶│   Bedrock    │
│  Function   │      │    Agent     │
└─────────────┘      │ (Claude 3.5) │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │Query Exec    │
                     │Lambda        │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │     RDS      │
                     │  PostgreSQL  │
                     └──────────────┘
```

## Components

### 1. React Frontend
- Simple chat interface
- Sends natural language queries
- Displays formatted results
- Session management

### 2. API Gateway
- REST API endpoint
- CORS enabled
- Routes requests to API Lambda

### 3. API Lambda Function
- Receives user queries
- Invokes Bedrock Agent
- Handles streaming responses
- Returns formatted results

### 4. Bedrock Agent (Claude 3.5 Sonnet)
- Natural language understanding
- SQL query generation
- Action orchestration
- Response formatting

### 5. Query Execution Lambda
- Receives SQL from Bedrock Agent
- Validates queries (SELECT only)
- Executes against RDS
- Returns results to agent
- Provides schema information

### 6. RDS PostgreSQL
- Sales database
- Sample data (customers, products, orders)
- Isolated in private subnet
- Encrypted at rest

## Security Features

### Network Security
- VPC with isolated subnets
- RDS in private subnet (no internet access)
- Lambda in private subnet with NAT Gateway
- Security groups restrict access

### Query Validation
- Only SELECT statements allowed
- Blocks dangerous keywords (DROP, DELETE, etc.)
- Prevents SQL injection
- Single statement enforcement

### IAM & Secrets
- Least privilege IAM roles
- Database credentials in Secrets Manager
- Bedrock agent execution role
- Lambda execution roles

### Data Protection
- RDS encryption at rest
- Secrets Manager encryption
- HTTPS for API calls
- VPC endpoint support

## Data Flow

### Query Execution Flow

1. User enters natural language query in React app
2. Frontend sends POST to API Gateway
3. API Gateway invokes API Lambda
4. API Lambda calls Bedrock Agent with query
5. Bedrock Agent:
   - Analyzes the question
   - Calls get-schema action if needed
   - Generates SQL query
   - Calls execute-query action
6. Query Execution Lambda:
   - Validates SQL query
   - Connects to RDS via Secrets Manager
   - Executes query
   - Returns results
7. Bedrock Agent formats results naturally
8. API Lambda returns response to frontend
9. Frontend displays results to user

## Database Schema

### Tables
- **customers**: Customer information
- **products**: Product catalog
- **orders**: Order headers
- **order_items**: Order line items

### Views
- **sales_summary**: Denormalized view for analytics

## Bedrock Agent Configuration

### Foundation Model
- Claude 3.5 Sonnet v2 (anthropic.claude-3-5-sonnet-20241022-v2:0)

### Action Group: DatabaseActions
- **get-schema**: Returns database schema
- **execute-query**: Executes SQL and returns results

### Instructions
The agent is instructed to:
1. Get schema first to understand tables
2. Generate safe SELECT queries
3. Execute queries
4. Format results naturally
5. Handle errors gracefully

## Scalability Considerations

### Current Design (POC)
- Single RDS instance (t3.micro)
- Lambda with modest memory
- No caching layer

### Production Enhancements
- RDS read replicas
- Aurora Serverless v2
- ElastiCache for query results
- Lambda reserved concurrency
- CloudFront for frontend
- WAF for API protection
- Query result pagination
- Rate limiting

## Monitoring & Logging

### CloudWatch Logs
- Lambda execution logs
- API Gateway access logs
- RDS query logs

### Metrics
- Lambda invocations and duration
- API Gateway requests
- RDS connections and queries
- Bedrock token usage

### Alarms (Recommended)
- Lambda errors
- API Gateway 5xx errors
- RDS CPU/connections
- Bedrock throttling

## Cost Optimization

### Current Costs
- RDS: ~$15/month (t3.micro)
- NAT Gateway: ~$30/month
- Lambda: Pay per invocation
- Bedrock: Pay per token
- API Gateway: Pay per request

### Optimization Strategies
- Use VPC endpoints instead of NAT Gateway
- RDS instance scheduling
- Lambda memory optimization
- Query result caching
- Aurora Serverless for variable load
