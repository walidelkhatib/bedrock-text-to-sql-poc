import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as athena from 'aws-cdk-lib/aws-athena';
import { Construct } from 'constructs';

export class BedrockTextToSqlStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for data storage
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // S3 Bucket for Athena query results
    const athenaResultsBucket = new s3.Bucket(this, 'AthenaResultsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(7),
        },
      ],
    });

    // Deploy sample data to S3
    new s3deploy.BucketDeployment(this, 'DeploySampleData', {
      sources: [s3deploy.Source.asset('../data')],
      destinationBucket: dataBucket,
      destinationKeyPrefix: 'sales/',
    });

    // Glue Database
    const glueDatabase = new glue.CfnDatabase(this, 'SalesDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: 'sales_db',
        description: 'Sales database for text-to-SQL queries',
      },
    });

    // Glue Tables
    const customersTable = new glue.CfnTable(this, 'CustomersTable', {
      catalogId: this.account,
      databaseName: glueDatabase.ref,
      tableInput: {
        name: 'customers',
        storageDescriptor: {
          columns: [
            { name: 'customer_id', type: 'int' },
            { name: 'first_name', type: 'string' },
            { name: 'last_name', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'phone', type: 'string' },
            { name: 'address', type: 'string' },
            { name: 'city', type: 'string' },
            { name: 'state', type: 'string' },
            { name: 'zip_code', type: 'string' },
            { name: 'created_at', type: 'timestamp' },
          ],
          location: `s3://${dataBucket.bucketName}/sales/customers/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
            parameters: {
              'field.delim': ',',
              'skip.header.line.count': '1',
            },
          },
        },
        tableType: 'EXTERNAL_TABLE',
      },
    });

    const productsTable = new glue.CfnTable(this, 'ProductsTable', {
      catalogId: this.account,
      databaseName: glueDatabase.ref,
      tableInput: {
        name: 'products',
        storageDescriptor: {
          columns: [
            { name: 'product_id', type: 'int' },
            { name: 'product_name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'price', type: 'decimal(10,2)' },
            { name: 'stock_quantity', type: 'int' },
            { name: 'description', type: 'string' },
            { name: 'created_at', type: 'timestamp' },
          ],
          location: `s3://${dataBucket.bucketName}/sales/products/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
            parameters: {
              'field.delim': ',',
              'skip.header.line.count': '1',
            },
          },
        },
        tableType: 'EXTERNAL_TABLE',
      },
    });

    const ordersTable = new glue.CfnTable(this, 'OrdersTable', {
      catalogId: this.account,
      databaseName: glueDatabase.ref,
      tableInput: {
        name: 'orders',
        storageDescriptor: {
          columns: [
            { name: 'order_id', type: 'int' },
            { name: 'customer_id', type: 'int' },
            { name: 'order_date', type: 'timestamp' },
            { name: 'total_amount', type: 'decimal(10,2)' },
            { name: 'status', type: 'string' },
            { name: 'shipping_address', type: 'string' },
            { name: 'shipping_city', type: 'string' },
            { name: 'shipping_state', type: 'string' },
            { name: 'shipping_zip', type: 'string' },
          ],
          location: `s3://${dataBucket.bucketName}/sales/orders/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
            parameters: {
              'field.delim': ',',
              'skip.header.line.count': '1',
            },
          },
        },
        tableType: 'EXTERNAL_TABLE',
      },
    });

    const orderItemsTable = new glue.CfnTable(this, 'OrderItemsTable', {
      catalogId: this.account,
      databaseName: glueDatabase.ref,
      tableInput: {
        name: 'order_items',
        storageDescriptor: {
          columns: [
            { name: 'order_item_id', type: 'int' },
            { name: 'order_id', type: 'int' },
            { name: 'product_id', type: 'int' },
            { name: 'quantity', type: 'int' },
            { name: 'unit_price', type: 'decimal(10,2)' },
            { name: 'subtotal', type: 'decimal(10,2)' },
          ],
          location: `s3://${dataBucket.bucketName}/sales/order_items/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
            parameters: {
              'field.delim': ',',
              'skip.header.line.count': '1',
            },
          },
        },
        tableType: 'EXTERNAL_TABLE',
      },
    });

    // Athena Workgroup
    const athenaWorkgroup = new athena.CfnWorkGroup(this, 'SalesWorkgroup', {
      name: 'sales-workgroup',
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${athenaResultsBucket.bucketName}/`,
        },
        enforceWorkGroupConfiguration: true,
      },
    });

    // Query Execution Lambda
    const queryExecutionLambda = new lambda.Function(this, 'QueryExecutionFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'athena_query_execution.handler',
      code: lambda.Code.fromAsset('../lambda/functions'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        GLUE_DATABASE: glueDatabase.ref,
        ATHENA_WORKGROUP: athenaWorkgroup.name!,
        ATHENA_RESULTS_BUCKET: athenaResultsBucket.bucketName,
      },
    });

    // Grant permissions to Lambda
    dataBucket.grantRead(queryExecutionLambda);
    athenaResultsBucket.grantReadWrite(queryExecutionLambda);
    
    queryExecutionLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'athena:StartQueryExecution',
        'athena:GetQueryExecution',
        'athena:GetQueryResults',
        'athena:StopQueryExecution',
      ],
      resources: [
        `arn:aws:athena:${this.region}:${this.account}:workgroup/${athenaWorkgroup.name}`,
      ],
    }));

    queryExecutionLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'glue:GetDatabase',
        'glue:GetTable',
        'glue:GetTables',
        'glue:GetPartitions',
      ],
      resources: [
        `arn:aws:glue:${this.region}:${this.account}:catalog`,
        `arn:aws:glue:${this.region}:${this.account}:database/${glueDatabase.ref}`,
        `arn:aws:glue:${this.region}:${this.account}:table/${glueDatabase.ref}/*`,
      ],
    }));

    // Bedrock Agent Execution Role
    const bedrockAgentRole = new iam.Role(this, 'BedrockAgentRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock Agent to invoke Lambda',
    });

    bedrockAgentRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [`arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`],
    }));

    queryExecutionLambda.grantInvoke(bedrockAgentRole);

    // S3 Bucket for Bedrock Agent artifacts
    const agentBucket = new s3.Bucket(this, 'BedrockAgentBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // API Gateway Lambda
    const apiLambda = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'api_handler.handler',
      code: lambda.Code.fromAsset('../lambda/functions'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        BEDROCK_AGENT_ID: 'PLACEHOLDER', // Will be updated after agent creation
        BEDROCK_AGENT_ALIAS_ID: 'PLACEHOLDER',
      },
    });

    apiLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeAgent'],
      resources: ['*'],
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'TextToSqlApi', {
      restApiName: 'Bedrock Text-to-SQL API',
      description: 'API for text-to-SQL queries',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const queryResource = api.root.addResource('query');
    queryResource.addMethod('POST', new apigateway.LambdaIntegration(apiLambda));

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket for data storage',
    });

    new cdk.CfnOutput(this, 'GlueDatabase', {
      value: glueDatabase.ref,
      description: 'Glue database name',
    });

    new cdk.CfnOutput(this, 'AthenaWorkgroup', {
      value: athenaWorkgroup.name!,
      description: 'Athena workgroup name',
    });

    new cdk.CfnOutput(this, 'BedrockAgentRoleArn', {
      value: bedrockAgentRole.roleArn,
      description: 'Bedrock Agent IAM Role ARN',
    });

    new cdk.CfnOutput(this, 'QueryExecutionLambdaArn', {
      value: queryExecutionLambda.functionArn,
      description: 'Query Execution Lambda ARN',
    });

    new cdk.CfnOutput(this, 'AgentBucketName', {
      value: agentBucket.bucketName,
      description: 'S3 bucket for Bedrock Agent artifacts',
    });
  }
}
