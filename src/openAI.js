import { Configuration, OpenAIApi } from 'openai';
import config from 'config';
import { createReadStream } from 'fs';

class OpenAI {
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system'
    }

    constructor(apiKey) {
        const config = new Configuration({
            apiKey
        });
        this.openai = new OpenAIApi(config);
    }

    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages
            });
            return response.data.choices[0].message;
        } catch (e) {
            console.log('Error occured while getting answer from ChatGPT.', e.message);
        }
    }

    async transcription(filepath) {
        try {
            const response = await this.openai.createTranscription(
                createReadStream(filepath),
                'whisper-1'
            );
            return response.data.text;
        } catch (e) {
            console.log('Error occured while getting transcription.', e.message);
        }
    }
}

export const openAI = new OpenAI(config.get('OPENAI_KEY'));