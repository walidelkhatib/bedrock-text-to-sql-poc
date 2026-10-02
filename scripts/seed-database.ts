import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function getStackOutput(stackName: string, outputKey: string): Promise<string> {
  const client = new CloudFormationClient({});
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await client.send(command);
  
  const output = response.Stacks?.[0]?.Outputs?.find(o => o.OutputKey === outputKey);
  if (!output?.OutputValue) {
    throw new Error(`Output ${outputKey} not found in stack ${stackName}`);
  }
  
  return output.OutputValue;
}

async function getDatabaseCredentials(secretArn: string) {
  const client = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);
  
  if (!response.SecretString) {
    throw new Error('Secret string not found');
  }
  
  return JSON.parse(response.SecretString);
}

async function seedDatabase() {
  try {
    console.log('Getting stack outputs...');
    const stackName = 'BedrockTextToSqlStack';
    const secretArn = await getStackOutput(stackName, 'DatabaseSecretArn');
    
    console.log('Getting database credentials...');
    const credentials = await getDatabaseCredentials(secretArn);
    
    console.log('Connecting to database...');
    const client = new Client({
      host: credentials.host,
      port: credentials.port,
      database: 'salesdb',
      user: credentials.username,
      password: credentials.password,
    });
    
    await client.connect();
    console.log('Connected successfully!');
    
    // Read and execute schema
    console.log('Creating schema...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../database/schema.sql'),
      'utf-8'
    );
    await client.query(schemaSQL);
    console.log('Schema created!');
    
    // Read and execute sample data
    console.log('Inserting sample data...');
    const dataSQL = fs.readFileSync(
      path.join(__dirname, '../database/sample_data.sql'),
      'utf-8'
    );
    await client.query(dataSQL);
    console.log('Sample data inserted!');
    
    // Verify data
    const result = await client.query('SELECT COUNT(*) FROM customers');
    console.log(`Customers count: ${result.rows[0].count}`);
    
    await client.end();
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
