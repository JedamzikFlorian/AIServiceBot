import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'eu-central-1' });

export async function invokeClaudeHaiku(prompt: string): Promise<string> {
    const input = {
        modelId: 'anthropic.claude-3-haiku-20240307',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
            max_tokens_to_sample: 300,
            temperature: 0.7,
        }),
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(responseBody);
    
    return parsed.completion;

}