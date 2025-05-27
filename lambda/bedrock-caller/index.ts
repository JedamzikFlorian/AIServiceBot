import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { invokeClaudeHaiku } from './haiku-client';
import { validateAndFormatResponse } from './response-utils';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';


const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME!;


export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const body = JSON.parse(event.body || '{}');
    const { prompt } = body;

    if (!prompt) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: 'Prompt missing'}),
        };
    }

    try {
        const raw = await invokeClaudeHaiku(prompt);
        const { final, route } = validateAndFormatResponse(raw);

        const timestamp = new Date().toISOString();
        const conversationId = body.conversationId || uuidv4();

        await ddbClient.send(new PutCommand({
            TableName: tableName,
            Item: {
                conversationId,
                timestamp,
                prompt,
                response: final,
                routingFlag: route,
            },
        }));


        return {
            statusCode: 200,
            body: JSON.stringify({
                completion: final,
                routingFlag: route,
                conversationId,
            }),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to invoke Claude Haiku' }),
        };
    }
};
