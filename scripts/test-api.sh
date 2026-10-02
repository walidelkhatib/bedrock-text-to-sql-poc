#!/bin/bash

# Simple script to test the API endpoint

if [ -z "$1" ]; then
  echo "Usage: ./test-api.sh <API_GATEWAY_URL>"
  echo "Example: ./test-api.sh https://abc123.execute-api.us-east-1.amazonaws.com/prod"
  exit 1
fi

API_URL=$1

echo "Testing API endpoint: $API_URL"
echo ""

echo "Test 1: Simple count query"
echo "Query: How many customers do we have?"
curl -X POST "$API_URL/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many customers do we have?",
    "session_id": "test-session-1"
  }' | jq '.'

echo -e "\n\n"

echo "Test 2: Product listing"
echo "Query: Show me all products in the Electronics category"
curl -X POST "$API_URL/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me all products in the Electronics category",
    "session_id": "test-session-2"
  }' | jq '.'

echo -e "\n\n"

echo "Test 3: Revenue calculation"
echo "Query: What is the total revenue?"
curl -X POST "$API_URL/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the total revenue?",
    "session_id": "test-session-3"
  }' | jq '.'

echo -e "\n\nTests complete!"
