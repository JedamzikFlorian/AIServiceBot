import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { invokeClaudeHaiku } from './haiku-client';


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
        const completion = await invokeClaudeHaiku(prompt);
        return {
            statusCode: 200,
            body: JSON.stringify({completion}),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to invoke Cluade Haiku' }),
        };
    }
};
