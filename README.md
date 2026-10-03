# Amazon Bedrock Text-to-SQL Agent POC

A proof of concept demonstrating natural language to SQL conversion using an Amazon Bedrock Agent (Claude 3.5 Sonnet), querying sample sales data in S3 via Amazon Athena.

> **👉 New to this project? Start here: [START_HERE.md](docs/START_HERE.md)**

## 🎯 What This Does

Ask questions in plain English, get SQL results instantly:
- "How many customers do we have?"
- "What are the top 5 best-selling products?"
- "Show me total revenue by category"

The system automatically:
1. Converts your question to SQL
2. Validates the query for safety (SELECT-only)
3. Executes against the sales data via Athena
4. Returns formatted results

## ✨ Features

- **Natural Language Processing**: Powered by Claude 3.5 Sonnet
- **Secure Query Execution**: Only SELECT queries allowed, dangerous-keyword blocking
- **Serverless Analytics**: Athena over S3 — no database server to run or patch
- **Modern UI**: Clean React interface with example queries
- **Security Patterns**: Scoped IAM roles, S3 encryption, SELECT-only validation
- **Sample Data**: Pre-loaded sales dataset (customers, products, orders, order_items)

## 🏗️ Architecture

```
React Frontend → API Gateway → API Lambda → Bedrock Agent → Query Lambda → Athena → S3 (Glue tables)
```

**Key Components**:
- **Bedrock Agent**: Claude 3.5 Sonnet for NL understanding and SQL generation
- **Amazon Athena + AWS Glue**: Serverless SQL over CSV sample data in S3 (4 external tables)
- **Lambda Functions**: Athena query execution and API handling
- **React Frontend**: Simple chat interface
- **CDK**: Infrastructure as Code (TypeScript)

> **Note**: This POC uses Athena/Glue over S3 as the query engine. The repo also
> includes an alternate RDS PostgreSQL query handler (`lambda/functions/query_execution.py`)
> as a reference implementation — it is **not** wired into the deployed CDK stack.

[See detailed architecture →](ARCHITECTURE.md)

## 📁 Project Structure

```
bedrock-text-to-sql/
├── infrastructure/          # CDK infrastructure code
│   ├── lib/                # Stack definitions
│   ├── bin/                # CDK app entry point
│   └── scripts/            # Database seeding scripts
├── lambda/                 # Lambda function handlers
│   ├── functions/          # Python Lambda code
│   └── layers/             # Dependencies layer
├── frontend/               # React web application
│   └── src/                # React components
├── database/               # Database schema and sample data
├── bedrock/                # Bedrock Agent configuration
├── scripts/                # Deployment and utility scripts
└── docs/                   # Documentation
```

## 🚀 Quick Start

**Get running in 20 minutes** → [QUICKSTART.md](docs/QUICKSTART.md)

### Prerequisites

- AWS Account with Bedrock access
- AWS CLI configured
- Node.js 18+ and Python 3.11+
- Claude 3.5 Sonnet enabled in Bedrock

### Installation

```bash
# 1. Build Lambda dependencies (if needed)
./scripts/build-lambda-layer.sh

# 2. Deploy infrastructure (S3, Glue tables, Athena, Lambdas, API Gateway)
#    Sample CSV data is uploaded to S3 automatically by the stack.
cd infrastructure
npm install && npm run deploy

# 3. Create Bedrock Agent and point it at the Query Lambda
cd ../scripts
./setup-bedrock-agent.sh

# 4. Update API Lambda with the Agent ID + Alias ID
./update-lambda-env.sh <AGENT_ID> <ALIAS_ID>

# 5. Launch frontend
cd ../frontend
npm install
echo "REACT_APP_API_ENDPOINT=<API_URL>" > .env
npm start
```

> **Heads up**: Steps 3–4 are manual — the Bedrock Agent is created out-of-band
> (not by the CDK stack), and the API Lambda ships with placeholder Agent IDs
> until you run `update-lambda-env.sh`. This is a POC, not a one-command deploy.

## 📚 Documentation

- **[QUICKSTART.md](docs/QUICKSTART.md)** - Get started in 20 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and components
- **[TESTING.md](docs/TESTING.md)** - Testing strategies and examples
- **[EXAMPLE_QUERIES.md](docs/EXAMPLE_QUERIES.md)** - 100+ example queries to try
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🔒 Security Features

- **Query Validation**: Only SELECT statements allowed
- **Dangerous-Keyword Blocking**: DROP/DELETE/INSERT/UPDATE/ALTER/etc. rejected
- **Single-Statement Enforcement**: Multiple statements blocked
- **Encrypted Storage**: S3 data and Athena results encrypted (SSE-S3)
- **IAM Roles**: Scoped least-privilege access for all components (Athena, Glue, S3)
- **No Public Data Store**: Data lives in a private S3 bucket, queried only via Athena

## 💡 Example Queries

Try these in the web interface:

**Basic Queries**:
- "How many customers do we have?"
- "Show me all products in Electronics"
- "List pending orders"

**Analytics**:
- "What is the total revenue?"
- "Top 5 best-selling products"
- "Revenue by product category"

**Complex**:
- "Which customers have spent more than $1000?"
- "Show me monthly sales trends"
- "Products with low stock levels"

[See 100+ more examples →](docs/EXAMPLE_QUERIES.md)

## 🧪 Testing

```bash
# Test API endpoint
./scripts/test-api.sh <API_GATEWAY_URL>

# Test Bedrock Agent directly
aws bedrock-agent-runtime invoke-agent \
  --agent-id <AGENT_ID> \
  --agent-alias-id <ALIAS_ID> \
  --session-id test \
  --input-text "How many customers?"
```

[Full testing guide →](docs/TESTING.md)

## 💰 Cost Estimate

This is a serverless, pay-per-use stack with **no always-on compute** (no RDS, no NAT Gateway):

- **Athena**: ~$5 per TB scanned (sample data is tiny — fractions of a cent per query)
- **S3**: Negligible for the small sample dataset
- **Lambda**: Pay per invocation
- **Bedrock**: ~$0.003 per 1K tokens
- **API Gateway**: Pay per request

Idle cost is effectively **$0** — you only pay when you query.

**Tip**: Run `./scripts/cleanup.sh` to tear down the stack when done.

## 🧹 Cleanup

```bash
# Delete all resources
./scripts/cleanup.sh <AGENT_ID>
```

## 🛠️ Troubleshooting

**Common Issues**:
- Bedrock model not found → Enable Claude 3.5 Sonnet access
- Database connection failed → Wait 2-3 min after deployment
- CORS error → Check API endpoint in `.env`

[Full troubleshooting guide →](docs/TROUBLESHOOTING.md)

## 📊 Database Schema

Sample data is stored as CSV in S3 and exposed as AWS Glue external tables, queried via Athena:

**Tables**:
- `customers` - Customer information
- `products` - Product catalog
- `orders` - Order headers
- `order_items` - Order line items

## 🔧 Customization

**Add Your Own Data**:
1. Modify `database/schema.sql` with your schema
2. Update `database/sample_data.sql` with your data
3. Run `npm run seed-database`

**Change Model**:
1. Update `foundationModel` in `bedrock/agent-config.json`
2. Redeploy Bedrock Agent

**Adjust Resources**:
1. Edit `infrastructure/lib/bedrock-text-to-sql-stack.ts`
2. Run `npm run deploy`

## 🤝 Contributing

This is a POC for demonstration purposes. Feel free to fork and customize for your needs!

## 📝 License

MIT License - feel free to use this for your projects!

## 🙋 Support

- Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues
- Review CloudWatch Logs for detailed errors
- Verify all prerequisites are met
- Ensure Bedrock model access is enabled

## 🎓 Learn More

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Agents Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Claude 3.5 Sonnet](https://www.anthropic.com/claude)
