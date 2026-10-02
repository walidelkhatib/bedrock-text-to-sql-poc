# Prerequisites Setup Guide

Complete guide to setting up your environment before deploying the Bedrock Text-to-SQL Agent.

## Required Tools

### 1. AWS Account

You need an AWS account with:
- Administrator access (or equivalent permissions)
- Access to these services:
  - Amazon Bedrock
  - RDS (PostgreSQL)
  - Lambda
  - VPC
  - API Gateway
  - CloudFormation
  - IAM
  - Secrets Manager

**Create an account**: https://aws.amazon.com/

### 2. AWS CLI

**Check if installed**:
```bash
aws --version
# Should show: aws-cli/2.x.x or higher
```

**Install**:

**macOS**:
```bash
brew install awscli
```

**Linux**:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows**:
Download from: https://aws.amazon.com/cli/

**Configure**:
```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

**Verify**:
```bash
aws sts get-caller-identity
# Should show your account details
```

### 3. Node.js and npm

**Check if installed**:
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

**Install**:

**macOS**:
```bash
brew install node@18
```

**Linux**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows**:
Download from: https://nodejs.org/

**Verify**:
```bash
node --version
npm --version
```

### 4. Python 3.11+

**Check if installed**:
```bash
python3 --version  # Should be 3.11 or higher
pip3 --version
```

**Install**:

**macOS**:
```bash
brew install python@3.11
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install python3.11 python3-pip
```

**Windows**:
Download from: https://www.python.org/downloads/

**Verify**:
```bash
python3 --version
pip3 --version
```

### 5. AWS CDK

**Install**:
```bash
npm install -g aws-cdk
```

**Verify**:
```bash
cdk --version
# Should show: 2.x.x or higher
```

**Bootstrap CDK** (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
# Replace ACCOUNT-ID with your AWS account ID
# Replace REGION with your preferred region (e.g., us-east-1)
```

### 6. Git (Optional but Recommended)

**Check if installed**:
```bash
git --version
```

**Install**:

**macOS**:
```bash
brew install git
```

**Linux**:
```bash
sudo apt install git
```

**Windows**:
Download from: https://git-scm.com/

## AWS Bedrock Setup

### Enable Claude 3.5 Sonnet Access

This is **REQUIRED** before deployment!

1. **Log in to AWS Console**
2. **Navigate to Amazon Bedrock**:
   - Search for "Bedrock" in the AWS Console
   - Or go to: https://console.aws.amazon.com/bedrock/
3. **Go to Model Access**:
   - Click "Model access" in the left sidebar
4. **Request Access**:
   - Click "Manage model access"
   - Find "Anthropic" section
   - Check "Claude 3.5 Sonnet v2"
   - Click "Request model access"
5. **Wait for Approval**:
   - Usually instant
   - Status should change to "Access granted"

**Verify Access**:
```bash
aws bedrock list-foundation-models \
  --region us-east-1 \
  --query "modelSummaries[?contains(modelId, 'claude-3-5-sonnet')]"
```

### Supported Regions

Bedrock with Claude 3.5 Sonnet is available in:
- `us-east-1` (US East - N. Virginia) ✅ Recommended
- `us-west-2` (US West - Oregon)
- `eu-west-1` (Europe - Ireland)
- `ap-southeast-1` (Asia Pacific - Singapore)
- `ap-northeast-1` (Asia Pacific - Tokyo)

**Note**: Use one of these regions for deployment!

## IAM Permissions

Your AWS user/role needs these permissions:

### Required Services
- CloudFormation (full access)
- VPC (create/modify)
- RDS (create/modify)
- Lambda (create/modify)
- API Gateway (create/modify)
- IAM (create roles/policies)
- Secrets Manager (create/read secrets)
- Bedrock (invoke model, create agent)
- S3 (for CDK assets)
- CloudWatch Logs (create/read)

### Recommended Policy

Attach these managed policies to your user:
- `AdministratorAccess` (easiest for POC)

Or create a custom policy with:
- `AmazonBedrockFullAccess`
- `AWSCloudFormationFullAccess`
- `AmazonVPCFullAccess`
- `AmazonRDSFullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `IAMFullAccess`
- `SecretsManagerReadWrite`

## Optional Tools

### PostgreSQL Client (for testing)

**macOS**:
```bash
brew install postgresql
```

**Linux**:
```bash
sudo apt install postgresql-client
```

**Windows**:
Download from: https://www.postgresql.org/download/windows/

### jq (for JSON parsing)

**macOS**:
```bash
brew install jq
```

**Linux**:
```bash
sudo apt install jq
```

**Windows**:
Download from: https://stedolan.github.io/jq/download/

### curl (usually pre-installed)

**Verify**:
```bash
curl --version
```

## Verification Checklist

Before proceeding with deployment, verify:

- [ ] AWS CLI installed and configured
- [ ] AWS credentials working (`aws sts get-caller-identity`)
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] AWS CDK installed globally
- [ ] CDK bootstrapped in your account/region
- [ ] Bedrock access to Claude 3.5 Sonnet enabled
- [ ] Using a supported region (us-east-1 recommended)
- [ ] IAM permissions sufficient

## Quick Verification Script

Run this to check your setup:

```bash
#!/bin/bash

echo "Checking prerequisites..."
echo ""

# AWS CLI
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI: $(aws --version)"
else
    echo "❌ AWS CLI not found"
fi

# Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
else
    echo "❌ Python not found"
fi

# CDK
if command -v cdk &> /dev/null; then
    echo "✅ CDK: $(cdk --version)"
else
    echo "❌ CDK not found"
fi

# AWS Credentials
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials configured"
else
    echo "❌ AWS credentials not configured"
fi

echo ""
echo "Verification complete!"
```

Save as `check-prerequisites.sh`, make executable, and run:
```bash
chmod +x check-prerequisites.sh
./check-prerequisites.sh
```

## Next Steps

Once all prerequisites are met:

1. **Clone or download this project**
2. **Follow the [QUICKSTART.md](QUICKSTART.md)** guide
3. **Deploy the infrastructure**

## Troubleshooting

### AWS CLI not configured
```bash
aws configure
# Enter your credentials
```

### CDK bootstrap failed
```bash
# Ensure you have admin permissions
# Try with explicit account/region
cdk bootstrap aws://123456789012/us-east-1
```

### Bedrock access denied
- Go to Bedrock console
- Request model access
- Wait for approval (usually instant)

### Wrong Node.js version
```bash
# Use nvm to manage versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## Getting Help

If you encounter issues:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Verify all prerequisites are met
3. Check AWS service quotas
4. Review IAM permissions
5. Try in a different region

## Estimated Setup Time

- **First time**: 30-45 minutes
- **With tools installed**: 10-15 minutes
- **Experienced users**: 5 minutes
