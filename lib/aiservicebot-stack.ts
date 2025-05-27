import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class AIServiceBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🗃️ DynamoDB-Tabelle zur Speicherung der Konversationshistorie
    const table = new dynamodb.Table(this, 'ConversationHistory', {
      tableName: 'ConversationHistory',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Nur für Entwicklung!
    });

    // 🧠 PromptBuilder Lambda – lädt History + erstellt Prompt
    const promptBuilder = new lambda.Function(this, 'PromptBuilderFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/prompt-builder')),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadData(promptBuilder);

    // 🤖 BedrockCaller Lambda – sendet Prompt an Claude 3 Haiku
    const bedrockCaller = new NodejsFunction(this, 'BedrockCallerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/bedrock-caller/index.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      bundling: {
        externalModules: ['@aws-sdk/client-bedrock-runtime'],
      },
    });

    // 🌐 API Gateway REST API mit /chat POST-Route
    const api = new apigateway.RestApi(this, 'ChatApi', {
      restApiName: 'ChatBotApi',
      description: 'API Gateway für AI Kundenservice Bot',
      deployOptions: {
        stageName: 'prod',
      }
    });

    // 🔐 Bedrock Zugriff erlauben (Claude 3 Haiku)
    bedrockCaller.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          'arn:aws:bedrock:eu-central-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
        ],
      })
    );

    // POST chat
    const chat = api.root.addResource('chat');
    chat.addMethod('POST', new apigateway.LambdaIntegration(bedrockCaller), {
      operationName: 'PostChatPrompt',
    });
  }
}