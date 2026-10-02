import json
import os
import boto3
import time
from typing import Dict, Any

athena_client = boto3.client('athena')
glue_client = boto3.client('glue')

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

def execute_athena_query(sql_query: str) -> Dict[str, Any]:
    """Execute SQL query via Athena and return results"""
    try:
        # Validate query
        is_valid, message = validate_sql_query(sql_query)
        if not is_valid:
            return {
                'success': False,
                'error': message,
                'query': sql_query
            }
        
        # Start query execution
        response = athena_client.start_query_execution(
            QueryString=sql_query,
            QueryExecutionContext={
                'Database': os.environ['GLUE_DATABASE']
            },
            WorkGroup=os.environ['ATHENA_WORKGROUP']
        )
        
        query_execution_id = response['QueryExecutionId']
        
        # Wait for query to complete
        max_attempts = 30
        attempt = 0
        while attempt < max_attempts:
            query_status = athena_client.get_query_execution(
                QueryExecutionId=query_execution_id
            )
            
            status = query_status['QueryExecution']['Status']['State']
            
            if status == 'SUCCEEDED':
                break
            elif status in ['FAILED', 'CANCELLED']:
                error_message = query_status['QueryExecution']['Status'].get('StateChangeReason', 'Unknown error')
                return {
                    'success': False,
                    'error': f"Query {status.lower()}: {error_message}",
                    'query': sql_query
                }
            
            time.sleep(1)
            attempt += 1
        
        if attempt >= max_attempts:
            return {
                'success': False,
                'error': 'Query execution timeout',
                'query': sql_query
            }
        
        # Get query results
        results_response = athena_client.get_query_results(
            QueryExecutionId=query_execution_id,
            MaxResults=1000
        )
        
        # Parse results
        rows = results_response['ResultSet']['Rows']
        
        if len(rows) == 0:
            return {
                'success': True,
                'data': [],
                'row_count': 0,
                'columns': [],
                'query': sql_query
            }
        
        # Extract column names from first row
        columns = [col['VarCharValue'] for col in rows[0]['Data']]
        
        # Extract data rows
        data = []
        for row in rows[1:]:  # Skip header row
            row_data = {}
            for i, col in enumerate(row['Data']):
                row_data[columns[i]] = col.get('VarCharValue', None)
            data.append(row_data)
        
        return {
            'success': True,
            'data': data,
            'row_count': len(data),
            'columns': columns,
            'query': sql_query
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f"Athena error: {str(e)}",
            'query': sql_query
        }

def get_schema_info() -> Dict[str, Any]:
    """Get database schema information from Glue"""
    try:
        database_name = os.environ['GLUE_DATABASE']
        
        # Get all tables
        tables_response = glue_client.get_tables(
            DatabaseName=database_name
        )
        
        schema_info = {}
        
        for table in tables_response['TableList']:
            table_name = table['Name']
            schema_info[table_name] = []
            
            for column in table['StorageDescriptor']['Columns']:
                schema_info[table_name].append({
                    'column': column['Name'],
                    'type': column['Type'],
                    'comment': column.get('Comment', '')
                })
        
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
        response_body = execute_athena_query(sql_query)
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
