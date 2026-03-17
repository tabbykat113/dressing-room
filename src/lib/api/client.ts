import OpenAI from 'openai';
import { OPENROUTER_API_KEY } from '$env/static/private';

if (!OPENROUTER_API_KEY) {
	console.error('[config] OPENROUTER_API_KEY is not set. Create a .env.local file with your key.');
}

export const openrouter = new OpenAI({
	baseURL: 'https://openrouter.ai/api/v1',
	apiKey: OPENROUTER_API_KEY
});
