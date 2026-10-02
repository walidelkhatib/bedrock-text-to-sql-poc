#!/bin/bash

# Cleanup script to remove all resources

set -e

echo "🧹 Cleaning up Bedrock Text-to-SQL resources..."
echo ""

# Get Agent ID if provided
if [ -z "$1" ]; then
  echo "⚠️  No Agent ID provided. Skipping Bedrock Agent deletion."
  echo "   To delete the agent, run: ./cleanup.sh <AGENT_ID>"
else
  AGENT_ID=$1
  echo "Deleting Bedrock Agent: $AGENT_ID"
  
  # Delete agent alias first
  ALIAS_ID=$(aws bedrock-agent list-agent-aliases \
    --agent-id "$AGENT_ID" \
    --query 'agentAliasSummaries[0].agentAliasId' \
    --output text 2>/dev/null || echo "")
  
  if [ ! -z "$ALIAS_ID" ] && [ "$ALIAS_ID" != "None" ]; then
    echo "Deleting agent alias: $ALIAS_ID"
    aws bedrock-agent delete-agent-alias \
      --agent-id "$AGENT_ID" \
      --agent-alias-id "$ALIAS_ID" || true
    sleep 5
  fi
  
  # Delete the agent
  aws bedrock-agent delete-agent \
    --agent-id "$AGENT_ID" \
    --skip-resource-in-use-check || true
  
  echo "✅ Bedrock Agent deleted"
fi

echo ""
echo "Deleting CloudFormation stack..."
cd ../infrastructure
npm run destroy

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Note: Some resources may take a few minutes to fully delete."
