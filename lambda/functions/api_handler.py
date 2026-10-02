import json
import os
import boto3
from typing import Dict, Any

bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')

def handler(event, context):
    """API Gateway handler for user queries"""
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        user_query = body.get('query', '')
        session_id = body.get('session_id', context.request_id)
        
        if not user_query:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Query is required'})
            }
        
        # Invoke Bedrock Agent
        agent_id = os.environ['BEDROCK_AGENT_ID']
        agent_alias_id = os.environ['BEDROCK_AGENT_ALIAS_ID']
        
        response = bedrock_agent_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=user_query
        )
        
        # Parse streaming response
        result_text = ''
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result_text += chunk['bytes'].decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'response': result_text,
                'session_id': session_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
