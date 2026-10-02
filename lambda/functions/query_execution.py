import json
import os
import boto3
import psycopg2
from typing import Dict, Any, List
import re

secrets_client = boto3.client('secretsmanager')

def get_db_connection():
    """Get database connection using credentials from Secrets Manager"""
    secret_arn = os.environ['DB_SECRET_ARN']
    secret = secrets_client.get_secret_value(SecretId=secret_arn)
    credentials = json.loads(secret['SecretString'])
    
    return psycopg2.connect(
        host=credentials['host'],
        port=credentials['port'],
        database=os.environ['DB_NAME'],
        user=credentials['username'],
        password=credentials['password']
    )

def validate_sql_query(query: str) -> tuple[bool, str]:
    """Validate SQL query for safety"""
    query_upper = query.upper().strip()
    
    # Only allow SELECT statements
    if not query_upper.startswith('SELECT'):
        return False, "Only SELECT queries are allowed"
    
    # Block dangerous keywords
    dangerous_keywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE']
    for keyword in dangerous_keywords:
        if keyword in query_upper:
            return False, f"Query contains forbidden keyword: {keyword}"
    
    # Check for multiple statements
    if ';' in query[:-1]:  # Allow trailing semicolon
        return False, "Multiple statements not allowed"
    
    return True, "Valid"

def execute_query(sql_query: str) -> Dict[str, Any]:
    """Execute SQL query and return results"""
    try:
        # Validate query
        is_valid, message = validate_sql_query(sql_query)
        if not is_valid:
            return {
                'success': False,
                'error': message,
                'query': sql_query
            }
        
        # Execute query
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(sql_query)
        
        # Fetch results
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        # Convert to list of dicts
        results = []
        for row in rows:
            results.append(dict(zip(columns, row)))
        
        cursor.close()
        conn.close()
        
        return {
            'success': True,
            'data': results,
            'row_count': len(results),
            'columns': columns,
            'query': sql_query
        }
        
    except psycopg2.Error as e:
        return {
            'success': False,
            'error': f"Database error: {str(e)}",
            'query': sql_query
        }
    except Exception as e:
        return {
            'success': False,
            'error': f"Unexpected error: {str(e)}",
            'query': sql_query
        }

def get_schema_info() -> Dict[str, Any]:
    """Get database schema information"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get table information
        cursor.execute("""
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        """)
        
        schema_info = {}
        for row in cursor.fetchall():
            table_name, column_name, data_type, is_nullable = row
            if table_name not in schema_info:
                schema_info[table_name] = []
            schema_info[table_name].append({
                'column': column_name,
                'type': data_type,
                'nullable': is_nullable == 'YES'
            })
        
        cursor.close()
        conn.close()
        
        return {
            'success': True,
            'schema': schema_info
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def handler(event, context):
    """Lambda handler for Bedrock Agent action group"""
    print(f"Event: {json.dumps(event)}")
    
    # Parse Bedrock Agent event
    action = event.get('actionGroup', '')
    api_path = event.get('apiPath', '')
    parameters = event.get('parameters', [])
    
    # Convert parameters to dict
    params = {p['name']: p['value'] for p in parameters}
    
    response_body = {}
    
    if api_path == '/execute-query':
        sql_query = params.get('sql_query', '')
        response_body = execute_query(sql_query)
    elif api_path == '/get-schema':
        response_body = get_schema_info()
    else:
        response_body = {
            'success': False,
            'error': f"Unknown API path: {api_path}"
        }
    
    # Return response in Bedrock Agent format
    return {
        'messageVersion': '1.0',
        'response': {
            'actionGroup': action,
            'apiPath': api_path,
            'httpMethod': 'POST',
            'httpStatusCode': 200,
            'responseBody': {
                'application/json': {
                    'body': json.dumps(response_body)
                }
            }
        }
    }
