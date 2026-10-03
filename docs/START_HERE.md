# 🚀 START HERE

Welcome to the **Amazon Bedrock Text-to-SQL Agent** proof of concept!

## What Is This?

This is a complete demo system that lets you ask questions about your database in plain English and get instant answers. No SQL knowledge required!

**Example**:
- You ask: "How many customers do we have?"
- System generates: `SELECT COUNT(*) FROM customers`
- You get: "You have 10 customers in the database"

## 🎯 Quick Navigation

### New to the Project?
1. **[README.md](README.md)** - Project overview and features
2. **[PREREQUISITES.md](PREREQUISITES.md)** - Setup your environment (15 min)
3. **[QUICKSTART.md](QUICKSTART.md)** - Deploy in 20 minutes

### Ready to Deploy?
1. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
2. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Essential commands

### Want to Learn More?
1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - How it works
2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete overview
3. **[EXAMPLE_QUERIES.md](EXAMPLE_QUERIES.md)** - 100+ query examples

### Need Help?
1. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues & solutions
2. **[TESTING.md](TESTING.md)** - Testing strategies

## ⚡ Super Quick Start

If you have all prerequisites installed:

```bash
# 1. Build dependencies (2 min)
./scripts/build-lambda-layer.sh

# 2. Deploy infrastructure (15 min)
cd infrastructure
npm install && npm run deploy

# 3. Seed database (1 min)
npm run seed-database

# 4. Create Bedrock Agent (2 min)
cd ../scripts
./setup-bedrock-agent.sh
# Save the Agent ID and Alias ID!

# 5. Update API Lambda (30 sec)
./update-lambda-env.sh <AGENT_ID> <ALIAS_ID>

# 6. Start frontend (2 min)
cd ../frontend
npm install
echo "REACT_APP_API_ENDPOINT=<YOUR_API_URL>" > .env
npm start
```

**Total time**: ~20 minutes

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] Bedrock access to Claude Sonnet 4.5
- [ ] 20-30 minutes of time

**Don't have these?** → See [PREREQUISITES.md](PREREQUISITES.md)

## 🏗️ What Gets Deployed

This project creates:

### Infrastructure
- ✅ VPC with public/private subnets
- ✅ RDS PostgreSQL database
- ✅ Lambda functions (Python)
- ✅ API Gateway REST API
- ✅ Bedrock Agent with Claude Sonnet 4.5

### Application
- ✅ React web interface
- ✅ Sample sales database
- ✅ Natural language query processing
- ✅ SQL generation and execution

### Security
- ✅ VPC isolation
- ✅ Encrypted secrets
- ✅ IAM roles
- ✅ Query validation

## 💰 Cost Estimate

**Testing**: $2-5 per day
**Idle**: $1-2 per day (if left running)

Main costs:
- RDS: ~$0.50/day
- NAT Gateway: ~$1/day
- Lambda: Pay per use
- Bedrock: ~$0.003 per 1K tokens

**Important**: Run cleanup script when done to avoid charges!

## 🎓 Learning Path

### Beginner
1. Read [README.md](README.md) for overview
2. Follow [QUICKSTART.md](QUICKSTART.md) to deploy
3. Try queries from [EXAMPLE_QUERIES.md](EXAMPLE_QUERIES.md)

### Intermediate
1. Study [ARCHITECTURE.md](ARCHITECTURE.md)
2. Review Lambda code in `lambda/functions/`
3. Customize database schema
4. Add your own data

### Advanced
1. Modify Bedrock Agent instructions
2. Add authentication (Cognito)
3. Implement caching (ElastiCache)
4. Scale for production (Aurora Serverless)

## 🔍 Project Structure

```
bedrock-text-to-sql/
│
├── 📄 Documentation (you are here!)
│   ├── START_HERE.md ⭐ (this file)
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   ├── TESTING.md
│   ├── TROUBLESHOOTING.md
│   └── ... more docs
│
├── 🏗️ Infrastructure (AWS CDK)
│   └── infrastructure/
│       ├── lib/bedrock-text-to-sql-stack.ts
│       └── bin/app.ts
│
├── ⚡ Lambda Functions (Python)
│   └── lambda/
│       ├── functions/query_execution.py
│       └── functions/api_handler.py
│
├── 🎨 Frontend (React)
│   └── frontend/
│       └── src/App.js
│
├── 🗄️ Database (PostgreSQL)
│   └── database/
│       ├── schema.sql
│       └── sample_data.sql
│
├── 🤖 Bedrock Agent Config
│   └── bedrock/agent-config.json
│
└── 🛠️ Utility Scripts
    └── scripts/
        ├── build-lambda-layer.sh
        ├── setup-bedrock-agent.sh
        └── cleanup.sh
```

## 🎯 Use Cases

### Business Intelligence
Ask questions like:
- "What are our top customers?"
- "Show me sales trends"
- "Which products are underperforming?"

### Operations
- "How many pending orders?"
- "Which products need restocking?"
- "Show me recent customer signups"

### Analytics
- "Calculate revenue by region"
- "What's our average order value?"
- "Show me customer lifetime value"

## 🔒 Security Features

- ✅ Only SELECT queries allowed (no data modification)
- ✅ SQL injection protection
- ✅ Database in private subnet (no internet access)
- ✅ Encrypted credentials in Secrets Manager
- ✅ IAM roles with least privilege
- ✅ Query validation and sanitization

## 🧪 Try These Queries

Once deployed, try:

**Simple**:
- "How many customers do we have?"
- "Show me all products"
- "List pending orders"

**Analytics**:
- "What is the total revenue?"
- "Top 5 best-selling products"
- "Revenue by product category"

**Complex**:
- "Which customers have spent more than $1000?"
- "Show me products with low stock"
- "Calculate average order value by state"

[See 100+ more examples →](EXAMPLE_QUERIES.md)

## 🚨 Important Notes

### Before Deployment
1. ⚠️ Enable Bedrock access to Claude Sonnet 4.5 in AWS Console
2. ⚠️ Use a supported region (us-east-1, us-west-2, etc.)
3. ⚠️ Ensure you have admin permissions
4. ⚠️ Budget for ~$50/month if left running

### After Deployment
1. ✅ Save all CloudFormation outputs
2. ✅ Save Agent ID and Alias ID
3. ✅ Test with example queries
4. ✅ Set up billing alerts

### When Done Testing
1. 🧹 Run cleanup script to avoid charges
2. 🧹 Verify all resources deleted
3. 🧹 Check for orphaned resources

## 🆘 Getting Help

### Something Not Working?

1. **Check Prerequisites**: [PREREQUISITES.md](PREREQUISITES.md)
2. **Review Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. **Common Issues**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. **CloudWatch Logs**: Check for detailed errors

### Common Issues

| Issue | Solution |
|-------|----------|
| Bedrock model not found | Enable Claude Sonnet 4.5 in console |
| Database connection failed | Wait 2-3 min after deployment |
| CORS error | Check API endpoint in .env |
| Agent not responding | Check CloudWatch logs |

## 📚 Documentation Index

| Document | Purpose | Time |
|----------|---------|------|
| [START_HERE.md](START_HERE.md) | You are here! | 5 min |
| [README.md](README.md) | Project overview | 5 min |
| [PREREQUISITES.md](PREREQUISITES.md) | Environment setup | 15 min |
| [QUICKSTART.md](QUICKSTART.md) | Fast deployment | 20 min |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Detailed deployment | 30 min |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Step-by-step checklist | - |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design | 15 min |
| [TESTING.md](TESTING.md) | Testing guide | 10 min |
| [EXAMPLE_QUERIES.md](EXAMPLE_QUERIES.md) | Query examples | 10 min |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problem solving | As needed |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command reference | As needed |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Complete overview | 20 min |

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ Frontend loads at http://localhost:3000
2. ✅ You can ask "How many customers?"
3. ✅ System responds with "10 customers"
4. ✅ No errors in browser console
5. ✅ Response time < 10 seconds

## 🚀 Next Steps

### Right Now
1. Read [PREREQUISITES.md](PREREQUISITES.md)
2. Set up your environment
3. Follow [QUICKSTART.md](QUICKSTART.md)

### After Deployment
1. Try example queries
2. Explore the architecture
3. Customize for your data

### For Production
1. Add authentication
2. Implement caching
3. Set up monitoring
4. Scale infrastructure

## 💡 Pro Tips

1. **Save Everything**: Keep all IDs, ARNs, and URLs in a text file
2. **Use Checklist**: Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) exactly
3. **Check Logs**: CloudWatch Logs are your friend
4. **Start Simple**: Deploy first, customize later
5. **Clean Up**: Run cleanup script when done testing

## 🎓 What You'll Learn

By deploying this project, you'll learn:

- ✅ Amazon Bedrock and AI agents
- ✅ AWS CDK for infrastructure
- ✅ Lambda functions and API Gateway
- ✅ RDS PostgreSQL setup
- ✅ VPC networking and security
- ✅ React frontend development
- ✅ Natural language processing
- ✅ SQL query generation

## 🌟 Key Features

- **Natural Language**: Ask questions in plain English
- **Secure**: Only SELECT queries, SQL injection protection
- **Fast**: Responses in < 10 seconds
- **Smart**: Claude Sonnet 4.5 understands context
- **Complete**: Full stack from database to UI
- **Security patterns**: S3 encryption, scoped IAM roles, SELECT-only validation

## 📞 Support

- **Documentation**: Check the docs above
- **Logs**: CloudWatch Logs for debugging
- **AWS**: AWS Support for service issues
- **Community**: AWS forums and Stack Overflow

## 🎯 Your Journey

```
1. Read this file (5 min) ✓
   ↓
2. Check prerequisites (15 min)
   ↓
3. Deploy infrastructure (20 min)
   ↓
4. Test with queries (10 min)
   ↓
5. Customize for your needs
   ↓
6. Deploy to production
```

## 🏁 Ready to Start?

**Choose your path**:

- **Fast Track** → [QUICKSTART.md](QUICKSTART.md)
- **Detailed** → [DEPLOYMENT.md](DEPLOYMENT.md)
- **Learn First** → [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Let's build something amazing!** 🚀

Questions? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or review the docs above.

**Good luck!** 🎉
