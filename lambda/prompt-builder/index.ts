// lambda/prompt-builder/index.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildPrompt, isPromptSafe } from './prompt-utils';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body || '{}');
  const { conversationId, userId, message } = body;

  const previousMessages = await docClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'conversationId = :cid',
      ExpressionAttributeValues: {
        ':cid': conversationId,
      },
      ScanIndexForward: false,
      Limit: 5,
    })
  );

  const prompt = buildPrompt(previousMessages.Items || [], message);

  if (!isPromptSafe(prompt)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unsafe input detected' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ prompt }),
  };
};
