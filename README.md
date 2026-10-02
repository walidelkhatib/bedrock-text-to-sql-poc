# Amazon Bedrock Text-to-SQL Agent POC

A production-ready proof of concept demonstrating natural language to SQL conversion using Amazon Bedrock Agent with Claude 3.5 Sonnet, connected to RDS PostgreSQL with sample sales data.

> **👉 New to this project? Start here: [START_HERE.md](docs/START_HERE.md)**

## 🎯 What This Does

Ask questions in plain English, get SQL results instantly:
- "How many customers do we have?"
- "What are the top 5 best-selling products?"
- "Show me total revenue by category"

The system automatically:
1. Converts your question to SQL
2. Validates the query for safety
3. Executes against PostgreSQL
4. Returns formatted results

## ✨ Features

- **Natural Language Processing**: Powered by Claude 3.5 Sonnet
- **Secure Query Execution**: Only SELECT queries allowed, SQL injection protection
- **Real-time Results**: Fast query execution with error handling
- **Modern UI**: Clean React interface with example queries
- **Production-Ready**: VPC isolation, encrypted secrets, IAM roles
- **Sample Data**: Pre-loaded sales database with customers, products, orders

## 🏗️ Architecture

```
React Frontend → API Gateway → Lambda → Bedrock Agent → Query Lambda → RDS PostgreSQL
```

**Key Components**:
- **Bedrock Agent**: Claude 3.5 Sonnet for NL understanding
- **RDS PostgreSQL**: Sample sales database in private subnet
- **Lambda Functions**: Query execution and API handling
- **React Frontend**: Simple chat interface
- **CDK**: Infrastructure as Code

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
# 1. Build Lambda dependencies
./scripts/build-lambda-layer.sh

# 2. Deploy infrastructure (10-15 min)
cd infrastructure
npm install && npm run deploy

# 3. Seed database
npm run seed-database

# 4. Create Bedrock Agent
cd ../scripts
./setup-bedrock-agent.sh

# 5. Update API Lambda with Agent ID
./update-lambda-env.sh <AGENT_ID> <ALIAS_ID>

# 6. Launch frontend
cd ../frontend
npm install
echo "REACT_APP_API_ENDPOINT=<API_URL>" > .env
npm start
```

## 📚 Documentation

- **[QUICKSTART.md](docs/QUICKSTART.md)** - Get started in 20 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and components
- **[TESTING.md](docs/TESTING.md)** - Testing strategies and examples
- **[EXAMPLE_QUERIES.md](docs/EXAMPLE_QUERIES.md)** - 100+ example queries to try
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🔒 Security Features

- **Query Validation**: Only SELECT statements allowed
- **SQL Injection Protection**: Parameterized queries and keyword blocking
- **Network Isolation**: RDS in private subnet, no internet access
- **Encrypted Secrets**: Database credentials in Secrets Manager
- **IAM Roles**: Least privilege access for all components
- **VPC Security Groups**: Restricted network access

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

**Development/Testing**: $2-5 per day
**Idle**: $1-2 per day

Main costs:
- RDS t3.micro: ~$0.50/day
- NAT Gateway: ~$1/day  
- Lambda: Pay per use
- Bedrock: ~$0.003 per 1K tokens

**Tip**: Run `./scripts/cleanup.sh` when not in use!

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

**Tables**:
- `customers` - Customer information (10 sample records)
- `products` - Product catalog (10 sample records)
- `orders` - Order headers (10 sample records)
- `order_items` - Order line items
- `sales_summary` - Denormalized view for analytics

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
