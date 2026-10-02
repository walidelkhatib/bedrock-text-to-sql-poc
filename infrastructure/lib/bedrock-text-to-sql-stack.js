"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockTextToSqlStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const glue = __importStar(require("aws-cdk-lib/aws-glue"));
const athena = __importStar(require("aws-cdk-lib/aws-athena"));
class BedrockTextToSqlStack extends cdk.Stack {
    constructor(scope, id, props) {
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
                ATHENA_WORKGROUP: athenaWorkgroup.name,
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
            value: athenaWorkgroup.name,
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
exports.BedrockTextToSqlStack = BedrockTextToSqlStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay10ZXh0LXRvLXNxbC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJlZHJvY2stdGV4dC10by1zcWwtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLCtEQUFpRDtBQUNqRCx5REFBMkM7QUFDM0MsdUVBQXlEO0FBQ3pELHVEQUF5QztBQUN6Qyx3RUFBMEQ7QUFDMUQsMkRBQTZDO0FBQzdDLCtEQUFpRDtBQUdqRCxNQUFhLHFCQUFzQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ2xELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNkJBQTZCO1FBQzdCLE1BQU0sVUFBVSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ25ELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7U0FDM0MsQ0FBQyxDQUFDO1FBRUgscUNBQXFDO1FBQ3JDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNyRSxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLGNBQWMsRUFBRTtnQkFDZDtvQkFDRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNqQzthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgs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QUMsU0FBUyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUN6QyxLQUFLLEVBQUUsZUFBZSxDQUFDLElBQUs7WUFDNUIsV0FBVyxFQUFFLHVCQUF1QjtTQUNyQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzdDLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxPQUFPO1lBQy9CLFdBQVcsRUFBRSw0QkFBNEI7U0FDMUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUNqRCxLQUFLLEVBQUUsb0JBQW9CLENBQUMsV0FBVztZQUN2QyxXQUFXLEVBQUUsNEJBQTRCO1NBQzFDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxVQUFVO1lBQzdCLFdBQVcsRUFBRSx1Q0FBdUM7U0FDckQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBblRELHNEQW1UQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBzM2RlcGxveSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCc7XG5pbXBvcnQgKiBhcyBnbHVlIGZyb20gJ2F3cy1jZGstbGliL2F3cy1nbHVlJztcbmltcG9ydCAqIGFzIGF0aGVuYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXRoZW5hJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgQmVkcm9ja1RleHRUb1NxbFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUzMgQnVja2V0IGZvciBkYXRhIHN0b3JhZ2VcbiAgICBjb25zdCBkYXRhQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnRGF0YUJ1Y2tldCcsIHtcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgQXRoZW5hIHF1ZXJ5IHJlc3VsdHNcbiAgICBjb25zdCBhdGhlbmFSZXN1bHRzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQXRoZW5hUmVzdWx0c0J1Y2tldCcsIHtcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyg3KSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBEZXBsb3kgc2FtcGxlIGRhdGEgdG8gUzNcbiAgICBuZXcgczNkZXBsb3kuQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95U2FtcGxlRGF0YScsIHtcbiAgICAgIHNvdXJjZXM6IFtzM2RlcGxveS5Tb3VyY2UuYXNzZXQoJy4uL2RhdGEnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogZGF0YUJ1Y2tldCxcbiAgICAgIGRlc3RpbmF0aW9uS2V5UHJlZml4OiAnc2FsZXMvJyxcbiAgICB9KTtcblxuICAgIC8vIEdsdWUgRGF0YWJhc2VcbiAgICBjb25zdCBnbHVlRGF0YWJhc2UgPSBuZXcgZ2x1ZS5DZm5EYXRhYmFzZSh0aGlzLCAnU2FsZXNEYXRhYmFzZScsIHtcbiAgICAgIGNhdGFsb2dJZDogdGhpcy5hY2NvdW50LFxuICAgICAgZGF0YWJhc2VJbnB1dDoge1xuICAgICAgICBuYW1lOiAnc2FsZXNfZGInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NhbGVzIGRhdGFiYXNlIGZvciB0ZXh0LXRvLVNRTCBxdWVyaWVzJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHbHVlIFRhYmxlc1xuICAgIGNvbnN0IGN1c3RvbWVyc1RhYmxlID0gbmV3IGdsdWUuQ2ZuVGFibGUodGhpcywgJ0N1c3RvbWVyc1RhYmxlJywge1xuICAgICAgY2F0YWxvZ0lkOiB0aGlzLmFjY291bnQsXG4gICAgICBkYXRhYmFzZU5hbWU6IGdsdWVEYXRhYmFzZS5yZWYsXG4gICAgICB0YWJsZUlucHV0OiB7XG4gICAgICAgIG5hbWU6ICdjdXN0b21lcnMnLFxuICAgICAgICBzdG9yYWdlRGVzY3JpcHRvcjoge1xuICAgICAgICAgIGNvbHVtbnM6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2N1c3RvbWVyX2lkJywgdHlwZTogJ2ludCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2ZpcnN0X25hbWUnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbGFzdF9uYW1lJywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2VtYWlsJywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3Bob25lJywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2FkZHJlc3MnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnY2l0eScsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdzdGF0ZScsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICd6aXBfY29kZScsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogJ3RpbWVzdGFtcCcgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGxvY2F0aW9uOiBgczM6Ly8ke2RhdGFCdWNrZXQuYnVja2V0TmFtZX0vc2FsZXMvY3VzdG9tZXJzL2AsXG4gICAgICAgICAgaW5wdXRGb3JtYXQ6ICdvcmcuYXBhY2hlLmhhZG9vcC5tYXByZWQuVGV4dElucHV0Rm9ybWF0JyxcbiAgICAgICAgICBvdXRwdXRGb3JtYXQ6ICdvcmcuYXBhY2hlLmhhZG9vcC5oaXZlLnFsLmlvLkhpdmVJZ25vcmVLZXlUZXh0T3V0cHV0Rm9ybWF0JyxcbiAgICAgICAgICBzZXJkZUluZm86IHtcbiAgICAgICAgICAgIHNlcmlhbGl6YXRpb25MaWJyYXJ5OiAnb3JnLmFwYWNoZS5oYWRvb3AuaGl2ZS5zZXJkZTIubGF6eS5MYXp5U2ltcGxlU2VyRGUnLFxuICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAnZmllbGQuZGVsaW0nOiAnLCcsXG4gICAgICAgICAgICAgICdza2lwLmhlYWRlci5saW5lLmNvdW50JzogJzEnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB0YWJsZVR5cGU6ICdFWFRFUk5BTF9UQUJMRScsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJvZHVjdHNUYWJsZSA9IG5ldyBnbHVlLkNmblRhYmxlKHRoaXMsICdQcm9kdWN0c1RhYmxlJywge1xuICAgICAgY2F0YWxvZ0lkOiB0aGlzLmFjY291bnQsXG4gICAgICBkYXRhYmFzZU5hbWU6IGdsdWVEYXRhYmFzZS5yZWYsXG4gICAgICB0YWJsZUlucHV0OiB7XG4gICAgICAgIG5hbWU6ICdwcm9kdWN0cycsXG4gICAgICAgIHN0b3JhZ2VEZXNjcmlwdG9yOiB7XG4gICAgICAgICAgY29sdW1uczogW1xuICAgICAgICAgICAgeyBuYW1lOiAncHJvZHVjdF9pZCcsIHR5cGU6ICdpbnQnIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdwcm9kdWN0X25hbWUnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnY2F0ZWdvcnknLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAncHJpY2UnLCB0eXBlOiAnZGVjaW1hbCgxMCwyKScgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3N0b2NrX3F1YW50aXR5JywgdHlwZTogJ2ludCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2Rlc2NyaXB0aW9uJywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiAndGltZXN0YW1wJyB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgbG9jYXRpb246IGBzMzovLyR7ZGF0YUJ1Y2tldC5idWNrZXROYW1lfS9zYWxlcy9wcm9kdWN0cy9gLFxuICAgICAgICAgIGlucHV0Rm9ybWF0OiAnb3JnLmFwYWNoZS5oYWRvb3AubWFwcmVkLlRleHRJbnB1dEZvcm1hdCcsXG4gICAgICAgICAgb3V0cHV0Rm9ybWF0OiAnb3JnLmFwYWNoZS5oYWRvb3AuaGl2ZS5xbC5pby5IaXZlSWdub3JlS2V5VGV4dE91dHB1dEZvcm1hdCcsXG4gICAgICAgICAgc2VyZGVJbmZvOiB7XG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uTGlicmFyeTogJ29yZy5hcGFjaGUuaGFkb29wLmhpdmUuc2VyZGUyLmxhenkuTGF6eVNpbXBsZVNlckRlJyxcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICAgJ2ZpZWxkLmRlbGltJzogJywnLFxuICAgICAgICAgICAgICAnc2tpcC5oZWFkZXIubGluZS5jb3VudCc6ICcxJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFibGVUeXBlOiAnRVhURVJOQUxfVEFCTEUnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG9yZGVyc1RhYmxlID0gbmV3IGdsdWUuQ2ZuVGFibGUodGhpcywgJ09yZGVyc1RhYmxlJywge1xuICAgICAgY2F0YWxvZ0lkOiB0aGlzLmFjY291bnQsXG4gICAgICBkYXRhYmFzZU5hbWU6IGdsdWVEYXRhYmFzZS5yZWYsXG4gICAgICB0YWJsZUlucHV0OiB7XG4gICAgICAgIG5hbWU6ICdvcmRlcnMnLFxuICAgICAgICBzdG9yYWdlRGVzY3JpcHRvcjoge1xuICAgICAgICAgIGNvbHVtbnM6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ29yZGVyX2lkJywgdHlwZTogJ2ludCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2N1c3RvbWVyX2lkJywgdHlwZTogJ2ludCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29yZGVyX2RhdGUnLCB0eXBlOiAndGltZXN0YW1wJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAndG90YWxfYW1vdW50JywgdHlwZTogJ2RlY2ltYWwoMTAsMiknIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdzdGF0dXMnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc2hpcHBpbmdfYWRkcmVzcycsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdzaGlwcGluZ19jaXR5JywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3NoaXBwaW5nX3N0YXRlJywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3NoaXBwaW5nX3ppcCcsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICBsb2NhdGlvbjogYHMzOi8vJHtkYXRhQnVja2V0LmJ1Y2tldE5hbWV9L3NhbGVzL29yZGVycy9gLFxuICAgICAgICAgIGlucHV0Rm9ybWF0OiAnb3JnLmFwYWNoZS5oYWRvb3AubWFwcmVkLlRleHRJbnB1dEZvcm1hdCcsXG4gICAgICAgICAgb3V0cHV0Rm9ybWF0OiAnb3JnLmFwYWNoZS5oYWRvb3AuaGl2ZS5xbC5pby5IaXZlSWdub3JlS2V5VGV4dE91dHB1dEZvcm1hdCcsXG4gICAgICAgICAgc2VyZGVJbmZvOiB7XG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uTGlicmFyeTogJ29yZy5hcGFjaGUuaGFkb29wLmhpdmUuc2VyZGUyLmxhenkuTGF6eVNpbXBsZVNlckRlJyxcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICAgJ2ZpZWxkLmRlbGltJzogJywnLFxuICAgICAgICAgICAgICAnc2tpcC5oZWFkZXIubGluZS5jb3VudCc6ICcxJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFibGVUeXBlOiAnRVhURVJOQUxfVEFCTEUnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG9yZGVySXRlbXNUYWJsZSA9IG5ldyBnbHVlLkNmblRhYmxlKHRoaXMsICdPcmRlckl0ZW1zVGFibGUnLCB7XG4gICAgICBjYXRhbG9nSWQ6IHRoaXMuYWNjb3VudCxcbiAgICAgIGRhdGFiYXNlTmFtZTogZ2x1ZURhdGFiYXNlLnJlZixcbiAgICAgIHRhYmxlSW5wdXQ6IHtcbiAgICAgICAgbmFtZTogJ29yZGVyX2l0ZW1zJyxcbiAgICAgICAgc3RvcmFnZURlc2NyaXB0b3I6IHtcbiAgICAgICAgICBjb2x1bW5zOiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdvcmRlcl9pdGVtX2lkJywgdHlwZTogJ2ludCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29yZGVyX2lkJywgdHlwZTogJ2ludCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3Byb2R1Y3RfaWQnLCB0eXBlOiAnaW50JyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAncXVhbnRpdHknLCB0eXBlOiAnaW50JyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAndW5pdF9wcmljZScsIHR5cGU6ICdkZWNpbWFsKDEwLDIpJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc3VidG90YWwnLCB0eXBlOiAnZGVjaW1hbCgxMCwyKScgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGxvY2F0aW9uOiBgczM6Ly8ke2RhdGFCdWNrZXQuYnVja2V0TmFtZX0vc2FsZXMvb3JkZXJfaXRlbXMvYCxcbiAgICAgICAgICBpbnB1dEZvcm1hdDogJ29yZy5hcGFjaGUuaGFkb29wLm1hcHJlZC5UZXh0SW5wdXRGb3JtYXQnLFxuICAgICAgICAgIG91dHB1dEZvcm1hdDogJ29yZy5hcGFjaGUuaGFkb29wLmhpdmUucWwuaW8uSGl2ZUlnbm9yZUtleVRleHRPdXRwdXRGb3JtYXQnLFxuICAgICAgICAgIHNlcmRlSW5mbzoge1xuICAgICAgICAgICAgc2VyaWFsaXphdGlvbkxpYnJhcnk6ICdvcmcuYXBhY2hlLmhhZG9vcC5oaXZlLnNlcmRlMi5sYXp5LkxhenlTaW1wbGVTZXJEZScsXG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICdmaWVsZC5kZWxpbSc6ICcsJyxcbiAgICAgICAgICAgICAgJ3NraXAuaGVhZGVyLmxpbmUuY291bnQnOiAnMScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHRhYmxlVHlwZTogJ0VYVEVSTkFMX1RBQkxFJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBdGhlbmEgV29ya2dyb3VwXG4gICAgY29uc3QgYXRoZW5hV29ya2dyb3VwID0gbmV3IGF0aGVuYS5DZm5Xb3JrR3JvdXAodGhpcywgJ1NhbGVzV29ya2dyb3VwJywge1xuICAgICAgbmFtZTogJ3NhbGVzLXdvcmtncm91cCcsXG4gICAgICB3b3JrR3JvdXBDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIHJlc3VsdENvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBvdXRwdXRMb2NhdGlvbjogYHMzOi8vJHthdGhlbmFSZXN1bHRzQnVja2V0LmJ1Y2tldE5hbWV9L2AsXG4gICAgICAgIH0sXG4gICAgICAgIGVuZm9yY2VXb3JrR3JvdXBDb25maWd1cmF0aW9uOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFF1ZXJ5IEV4ZWN1dGlvbiBMYW1iZGFcbiAgICBjb25zdCBxdWVyeUV4ZWN1dGlvbkxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1F1ZXJ5RXhlY3V0aW9uRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMSxcbiAgICAgIGhhbmRsZXI6ICdhdGhlbmFfcXVlcnlfZXhlY3V0aW9uLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9sYW1iZGEvZnVuY3Rpb25zJyksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MCksXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBHTFVFX0RBVEFCQVNFOiBnbHVlRGF0YWJhc2UucmVmLFxuICAgICAgICBBVEhFTkFfV09SS0dST1VQOiBhdGhlbmFXb3JrZ3JvdXAubmFtZSEsXG4gICAgICAgIEFUSEVOQV9SRVNVTFRTX0JVQ0tFVDogYXRoZW5hUmVzdWx0c0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIHRvIExhbWJkYVxuICAgIGRhdGFCdWNrZXQuZ3JhbnRSZWFkKHF1ZXJ5RXhlY3V0aW9uTGFtYmRhKTtcbiAgICBhdGhlbmFSZXN1bHRzQnVja2V0LmdyYW50UmVhZFdyaXRlKHF1ZXJ5RXhlY3V0aW9uTGFtYmRhKTtcbiAgICBcbiAgICBxdWVyeUV4ZWN1dGlvbkxhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYXRoZW5hOlN0YXJ0UXVlcnlFeGVjdXRpb24nLFxuICAgICAgICAnYXRoZW5hOkdldFF1ZXJ5RXhlY3V0aW9uJyxcbiAgICAgICAgJ2F0aGVuYTpHZXRRdWVyeVJlc3VsdHMnLFxuICAgICAgICAnYXRoZW5hOlN0b3BRdWVyeUV4ZWN1dGlvbicsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgIGBhcm46YXdzOmF0aGVuYToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06d29ya2dyb3VwLyR7YXRoZW5hV29ya2dyb3VwLm5hbWV9YCxcbiAgICAgIF0sXG4gICAgfSkpO1xuXG4gICAgcXVlcnlFeGVjdXRpb25MYW1iZGEuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2dsdWU6R2V0RGF0YWJhc2UnLFxuICAgICAgICAnZ2x1ZTpHZXRUYWJsZScsXG4gICAgICAgICdnbHVlOkdldFRhYmxlcycsXG4gICAgICAgICdnbHVlOkdldFBhcnRpdGlvbnMnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICBgYXJuOmF3czpnbHVlOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpjYXRhbG9nYCxcbiAgICAgICAgYGFybjphd3M6Z2x1ZToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06ZGF0YWJhc2UvJHtnbHVlRGF0YWJhc2UucmVmfWAsXG4gICAgICAgIGBhcm46YXdzOmdsdWU6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OnRhYmxlLyR7Z2x1ZURhdGFiYXNlLnJlZn0vKmAsXG4gICAgICBdLFxuICAgIH0pKTtcblxuICAgIC8vIEJlZHJvY2sgQWdlbnQgRXhlY3V0aW9uIFJvbGVcbiAgICBjb25zdCBiZWRyb2NrQWdlbnRSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdCZWRyb2NrQWdlbnRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2JlZHJvY2suYW1hem9uYXdzLmNvbScpLFxuICAgICAgZGVzY3JpcHRpb246ICdSb2xlIGZvciBCZWRyb2NrIEFnZW50IHRvIGludm9rZSBMYW1iZGEnLFxuICAgIH0pO1xuXG4gICAgYmVkcm9ja0FnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbJ2JlZHJvY2s6SW52b2tlTW9kZWwnXSxcbiAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOmJlZHJvY2s6JHt0aGlzLnJlZ2lvbn06OmZvdW5kYXRpb24tbW9kZWwvYW50aHJvcGljLmNsYXVkZS0zLTUtc29ubmV0LTIwMjQxMDIyLXYyOjBgXSxcbiAgICB9KSk7XG5cbiAgICBxdWVyeUV4ZWN1dGlvbkxhbWJkYS5ncmFudEludm9rZShiZWRyb2NrQWdlbnRSb2xlKTtcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgQmVkcm9jayBBZ2VudCBhcnRpZmFjdHNcbiAgICBjb25zdCBhZ2VudEJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0JlZHJvY2tBZ2VudEJ1Y2tldCcsIHtcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IExhbWJkYVxuICAgIGNvbnN0IGFwaUxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FwaUZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTEsXG4gICAgICBoYW5kbGVyOiAnYXBpX2hhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2xhbWJkYS9mdW5jdGlvbnMnKSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDYwKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEJFRFJPQ0tfQUdFTlRfSUQ6ICdQTEFDRUhPTERFUicsIC8vIFdpbGwgYmUgdXBkYXRlZCBhZnRlciBhZ2VudCBjcmVhdGlvblxuICAgICAgICBCRURST0NLX0FHRU5UX0FMSUFTX0lEOiAnUExBQ0VIT0xERVInLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGFwaUxhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogWydiZWRyb2NrOkludm9rZUFnZW50J10sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnVGV4dFRvU3FsQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdCZWRyb2NrIFRleHQtdG8tU1FMIEFQSScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBmb3IgdGV4dC10by1TUUwgcXVlcmllcycsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBxdWVyeVJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3F1ZXJ5Jyk7XG4gICAgcXVlcnlSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhcGlMYW1iZGEpKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogYXBpLnVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgZW5kcG9pbnQgVVJMJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBkYXRhQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldCBmb3IgZGF0YSBzdG9yYWdlJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHbHVlRGF0YWJhc2UnLCB7XG4gICAgICB2YWx1ZTogZ2x1ZURhdGFiYXNlLnJlZixcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2x1ZSBkYXRhYmFzZSBuYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBdGhlbmFXb3JrZ3JvdXAnLCB7XG4gICAgICB2YWx1ZTogYXRoZW5hV29ya2dyb3VwLm5hbWUhLFxuICAgICAgZGVzY3JpcHRpb246ICdBdGhlbmEgd29ya2dyb3VwIG5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0JlZHJvY2tBZ2VudFJvbGVBcm4nLCB7XG4gICAgICB2YWx1ZTogYmVkcm9ja0FnZW50Um9sZS5yb2xlQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdCZWRyb2NrIEFnZW50IElBTSBSb2xlIEFSTicsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUXVlcnlFeGVjdXRpb25MYW1iZGFBcm4nLCB7XG4gICAgICB2YWx1ZTogcXVlcnlFeGVjdXRpb25MYW1iZGEuZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1F1ZXJ5IEV4ZWN1dGlvbiBMYW1iZGEgQVJOJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBZ2VudEJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogYWdlbnRCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0IGZvciBCZWRyb2NrIEFnZW50IGFydGlmYWN0cycsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==