import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

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
    const promptBuilder = new lambda.Function(this, 'PromptBuilderFunction2314', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/prompt-builder')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const bedrockCaller = new lambda.Function(this, 'BedrockCallerFunction2314', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/bedrock-caller')),
      environment: {},
    })

    // 🔐 Rechte für DynamoDB-Zugriff geben
    table.grantReadData(promptBuilder);

    // bedrock-Zugriffsrechte
    bedrockCaller.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: ['arn:aws:bedrock:eur-central-1::foundation-model/anthropic.claude-3-haiku.20240307'],
      })
    )
  }
}
