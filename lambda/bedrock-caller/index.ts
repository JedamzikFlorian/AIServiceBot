import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { invokeClaudeHaiku } from './haiku-client';
import { validateAndFormatResponse } from './response-utils';


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

        return {
            statusCode: 200,
            body: JSON.stringify({
                completion: final,
                routingFlag: route,
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
