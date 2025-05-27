import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

export class AIServiceBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🗃️ DynamoDB-Tabelle zur Speicherung der Konversationshistorie
    const table = new dynamodb.Table(this, 'ConversationHistory', {
      tableName: 'ConversationHistory2314',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Nur für DEV! In PROD: RETAIN
    });

    // 🧠 Lambda zur Prompt-Erstellung inkl. Kontext-Abruf
    const promptBuilder = new lambda.Function(this, 'PromptBuilderFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/prompt-builder')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // 🔐 Rechte für DynamoDB-Zugriff geben
    table.grantReadData(promptBuilder);
  }
}
