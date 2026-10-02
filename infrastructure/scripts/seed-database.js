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
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function getStackOutput(stackName, outputKey) {
    const client = new client_cloudformation_1.CloudFormationClient({});
    const command = new client_cloudformation_1.DescribeStacksCommand({ StackName: stackName });
    const response = await client.send(command);
    const output = response.Stacks?.[0]?.Outputs?.find(o => o.OutputKey === outputKey);
    if (!output?.OutputValue) {
        throw new Error(`Output ${outputKey} not found in stack ${stackName}`);
    }
    return output.OutputValue;
}
async function getDatabaseCredentials(secretArn) {
    const client = new client_secrets_manager_1.SecretsManagerClient({});
    const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretArn });
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
        const client = new pg_1.Client({
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
        const schemaSQL = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
        await client.query(schemaSQL);
        console.log('Schema created!');
        // Read and execute sample data
        console.log('Inserting sample data...');
        const dataSQL = fs.readFileSync(path.join(__dirname, '../../database/sample_data.sql'), 'utf-8');
        await client.query(dataSQL);
        console.log('Sample data inserted!');
        // Verify data
        const result = await client.query('SELECT COUNT(*) FROM customers');
        console.log(`Customers count: ${result.rows[0].count}`);
        await client.end();
        console.log('✅ Database seeded successfully!');
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}
seedDatabase();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC1kYXRhYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlZWQtZGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0RUFBOEY7QUFDOUYsMEVBQTZGO0FBQzdGLDJCQUE0QjtBQUM1Qix1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLEtBQUssVUFBVSxjQUFjLENBQUMsU0FBaUIsRUFBRSxTQUFpQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLDRDQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksNkNBQXFCLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUNwRSxNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFNUMsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxDQUFDO0lBQ25GLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLFNBQVMsdUJBQXVCLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUM1QixDQUFDO0FBRUQsS0FBSyxVQUFVLHNCQUFzQixDQUFDLFNBQWlCO0lBQ3JELE1BQU0sTUFBTSxHQUFHLElBQUksNkNBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBSSw4Q0FBcUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQ25FLE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU1QyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsS0FBSyxVQUFVLFlBQVk7SUFDekIsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sU0FBUyxHQUFHLHVCQUF1QixDQUFDO1FBQzFDLE1BQU0sU0FBUyxHQUFHLE1BQU0sY0FBYyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRXZFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUMvQyxNQUFNLFdBQVcsR0FBRyxNQUFNLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTVELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUN6QyxNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQU0sQ0FBQztZQUN4QixJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUk7WUFDdEIsSUFBSSxFQUFFLFdBQVcsQ0FBQyxJQUFJO1lBQ3RCLFFBQVEsRUFBRSxTQUFTO1lBQ25CLElBQUksRUFBRSxXQUFXLENBQUMsUUFBUTtZQUMxQixRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVE7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBRXZDLDBCQUEwQjtRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsRUFDakQsT0FBTyxDQUNSLENBQUM7UUFDRixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRS9CLCtCQUErQjtRQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDeEMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsZ0NBQWdDLENBQUMsRUFDdEQsT0FBTyxDQUNSLENBQUM7UUFDRixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBRXJDLGNBQWM7UUFDZCxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUNwRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFeEQsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBRWpELENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7QUFDSCxDQUFDO0FBRUQsWUFBWSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZWNyZXRzTWFuYWdlckNsaWVudCwgR2V0U2VjcmV0VmFsdWVDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNlY3JldHMtbWFuYWdlcic7XG5pbXBvcnQgeyBDbG91ZEZvcm1hdGlvbkNsaWVudCwgRGVzY3JpYmVTdGFja3NDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNsb3VkZm9ybWF0aW9uJztcbmltcG9ydCB7IENsaWVudCB9IGZyb20gJ3BnJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFN0YWNrT3V0cHV0KHN0YWNrTmFtZTogc3RyaW5nLCBvdXRwdXRLZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGNsaWVudCA9IG5ldyBDbG91ZEZvcm1hdGlvbkNsaWVudCh7fSk7XG4gIGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVzY3JpYmVTdGFja3NDb21tYW5kKHsgU3RhY2tOYW1lOiBzdGFja05hbWUgfSk7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LnNlbmQoY29tbWFuZCk7XG4gIFxuICBjb25zdCBvdXRwdXQgPSByZXNwb25zZS5TdGFja3M/LlswXT8uT3V0cHV0cz8uZmluZChvID0+IG8uT3V0cHV0S2V5ID09PSBvdXRwdXRLZXkpO1xuICBpZiAoIW91dHB1dD8uT3V0cHV0VmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE91dHB1dCAke291dHB1dEtleX0gbm90IGZvdW5kIGluIHN0YWNrICR7c3RhY2tOYW1lfWApO1xuICB9XG4gIFxuICByZXR1cm4gb3V0cHV0Lk91dHB1dFZhbHVlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXREYXRhYmFzZUNyZWRlbnRpYWxzKHNlY3JldEFybjogc3RyaW5nKSB7XG4gIGNvbnN0IGNsaWVudCA9IG5ldyBTZWNyZXRzTWFuYWdlckNsaWVudCh7fSk7XG4gIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0U2VjcmV0VmFsdWVDb21tYW5kKHsgU2VjcmV0SWQ6IHNlY3JldEFybiB9KTtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcbiAgXG4gIGlmICghcmVzcG9uc2UuU2VjcmV0U3RyaW5nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTZWNyZXQgc3RyaW5nIG5vdCBmb3VuZCcpO1xuICB9XG4gIFxuICByZXR1cm4gSlNPTi5wYXJzZShyZXNwb25zZS5TZWNyZXRTdHJpbmcpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZWVkRGF0YWJhc2UoKSB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmcgc3RhY2sgb3V0cHV0cy4uLicpO1xuICAgIGNvbnN0IHN0YWNrTmFtZSA9ICdCZWRyb2NrVGV4dFRvU3FsU3RhY2snO1xuICAgIGNvbnN0IHNlY3JldEFybiA9IGF3YWl0IGdldFN0YWNrT3V0cHV0KHN0YWNrTmFtZSwgJ0RhdGFiYXNlU2VjcmV0QXJuJyk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ0dldHRpbmcgZGF0YWJhc2UgY3JlZGVudGlhbHMuLi4nKTtcbiAgICBjb25zdCBjcmVkZW50aWFscyA9IGF3YWl0IGdldERhdGFiYXNlQ3JlZGVudGlhbHMoc2VjcmV0QXJuKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnQ29ubmVjdGluZyB0byBkYXRhYmFzZS4uLicpO1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoe1xuICAgICAgaG9zdDogY3JlZGVudGlhbHMuaG9zdCxcbiAgICAgIHBvcnQ6IGNyZWRlbnRpYWxzLnBvcnQsXG4gICAgICBkYXRhYmFzZTogJ3NhbGVzZGInLFxuICAgICAgdXNlcjogY3JlZGVudGlhbHMudXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogY3JlZGVudGlhbHMucGFzc3dvcmQsXG4gICAgfSk7XG4gICAgXG4gICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICBjb25zb2xlLmxvZygnQ29ubmVjdGVkIHN1Y2Nlc3NmdWxseSEnKTtcbiAgICBcbiAgICAvLyBSZWFkIGFuZCBleGVjdXRlIHNjaGVtYVxuICAgIGNvbnNvbGUubG9nKCdDcmVhdGluZyBzY2hlbWEuLi4nKTtcbiAgICBjb25zdCBzY2hlbWFTUUwgPSBmcy5yZWFkRmlsZVN5bmMoXG4gICAgICBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vZGF0YWJhc2Uvc2NoZW1hLnNxbCcpLFxuICAgICAgJ3V0Zi04J1xuICAgICk7XG4gICAgYXdhaXQgY2xpZW50LnF1ZXJ5KHNjaGVtYVNRTCk7XG4gICAgY29uc29sZS5sb2coJ1NjaGVtYSBjcmVhdGVkIScpO1xuICAgIFxuICAgIC8vIFJlYWQgYW5kIGV4ZWN1dGUgc2FtcGxlIGRhdGFcbiAgICBjb25zb2xlLmxvZygnSW5zZXJ0aW5nIHNhbXBsZSBkYXRhLi4uJyk7XG4gICAgY29uc3QgZGF0YVNRTCA9IGZzLnJlYWRGaWxlU3luYyhcbiAgICAgIHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9kYXRhYmFzZS9zYW1wbGVfZGF0YS5zcWwnKSxcbiAgICAgICd1dGYtOCdcbiAgICApO1xuICAgIGF3YWl0IGNsaWVudC5xdWVyeShkYXRhU1FMKTtcbiAgICBjb25zb2xlLmxvZygnU2FtcGxlIGRhdGEgaW5zZXJ0ZWQhJyk7XG4gICAgXG4gICAgLy8gVmVyaWZ5IGRhdGFcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnkoJ1NFTEVDVCBDT1VOVCgqKSBGUk9NIGN1c3RvbWVycycpO1xuICAgIGNvbnNvbGUubG9nKGBDdXN0b21lcnMgY291bnQ6ICR7cmVzdWx0LnJvd3NbMF0uY291bnR9YCk7XG4gICAgXG4gICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgIGNvbnNvbGUubG9nKCfinIUgRGF0YWJhc2Ugc2VlZGVkIHN1Y2Nlc3NmdWxseSEnKTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZWVkaW5nIGRhdGFiYXNlOicsIGVycm9yKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH1cbn1cblxuc2VlZERhdGFiYXNlKCk7XG4iXX0=