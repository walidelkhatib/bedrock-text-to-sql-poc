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
└─────────────┘      │ (Sonnet 4.5) │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │Query Exec    │
                     │Lambda        │
                     └──────┬───────┘
                            │ Athena SQL
                            ▼
                     ┌──────────────┐
                     │ Amazon Athena│
                     │  + AWS Glue  │
                     └──────┬───────┘
                            │ reads
                            ▼
                     ┌──────────────┐
                     │   S3 Bucket  │
                     │ (CSV tables) │
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

### 4. Bedrock Agent (Claude Sonnet 4.5)
- Natural language understanding
- SQL query generation
- Action orchestration
- Response formatting

### 5. Query Execution Lambda
- Receives SQL from Bedrock Agent
- Validates queries (SELECT only)
- Runs the query through Athena
- Returns results to the agent
- Provides schema information from the Glue Data Catalog

### 6. Amazon Athena + AWS Glue + S3
- Serverless SQL engine (Athena) over CSV sample data in S3
- Glue Data Catalog defines 4 external tables (customers, products, orders, order_items)
- No database server to provision, patch, or pay for while idle
- Athena query results written to a separate encrypted S3 bucket (7-day lifecycle)

> **Alternate reference path**: `lambda/functions/query_execution.py` is an RDS
> PostgreSQL handler kept as a reference implementation. It is **not** deployed by
> the current CDK stack, which wires `athena_query_execution.py` instead.

## Security Features

### Query Validation
- Only SELECT statements allowed
- Blocks dangerous keywords (DROP, DELETE, etc.)
- Single statement enforcement

### IAM
- Least privilege IAM roles (Athena, Glue, S3 scoped to this stack's resources)
- Separate roles for the Bedrock Agent, Query Lambda, and API Lambda

### Data Protection
- S3 encryption at rest (SSE-S3) for data and Athena results
- HTTPS for API calls
- Data lives in a private S3 bucket, reachable only through Athena

## Data Flow

### Query Execution Flow

1. User enters natural language query in React app
2. Frontend sends POST to API Gateway
3. API Gateway invokes API Lambda
4. API Lambda calls Bedrock Agent with query
5. Bedrock Agent:
   - Analyzes the question
   - Calls get-schema action if needed (reads Glue Data Catalog)
   - Generates SQL query
   - Calls execute-query action
6. Query Execution Lambda:
   - Validates SQL query
   - Submits it to Athena against the Glue database
   - Polls for completion and fetches results from S3
   - Returns results to the agent
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
- Claude Sonnet 4.5 (us.anthropic.claude-sonnet-4-5-20250929-v1:0)

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

### Current Costs (serverless, pay-per-use)
- Athena: ~$5 per TB scanned (sample data is tiny — effectively free per query)
- S3: negligible for the small sample dataset
- Lambda: pay per invocation
- Bedrock: pay per token
- API Gateway: pay per request

Idle cost is effectively $0 — there is no always-on RDS or NAT Gateway.

### Optimization Strategies
- Convert CSV to columnar Parquet to cut Athena bytes-scanned
- Partition large tables to prune scans
- Cache frequent query results
- Right-size Lambda memory
