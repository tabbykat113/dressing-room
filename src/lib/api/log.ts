/** Simple request/response logger for API calls. */

export function logRequest(tag: string, model: string, detail?: string) {
	const parts = [`[${tag}] requesting ${model}...`];
	if (detail) parts.push(detail);
	console.log(parts.join(' '));
}

export function logResponse(tag: string, response: { output: unknown[]; usage?: unknown }) {
	// Log output items by type, omitting large binary data
	const summary = (response.output as Array<{ type: string }>).map((item) => item.type);
	console.log(`[${tag}] response output types:`, summary.join(', '));
	if (response.usage) {
		console.log(`[${tag}] usage:`, JSON.stringify(response.usage));
	}
}

/**
 * Classify an error from the OAI SDK / OpenRouter into a user-friendly message.
 */
export function classifyError(e: unknown, tag: string): string {
	if (e instanceof Error) {
		// OpenAI SDK wraps HTTP errors with status codes
		const status = (e as { status?: number }).status;

		if (status === 401) {
			return `${tag}: API key is missing or invalid. Check your OPENROUTER_API_KEY in .env.local.`;
		}
		if (status === 402) {
			return `${tag}: Insufficient credits on OpenRouter.`;
		}
		if (status === 429) {
			return `${tag}: Rate limited by the API. Try again in a moment.`;
		}
		if (status === 503 || status === 502) {
			return `${tag}: The upstream model is temporarily unavailable. Try again shortly.`;
		}
		if (e.message.includes('moderation') || e.message.includes('safety')) {
			return `${tag}: The request was blocked by content moderation.`;
		}
		return `${tag}: ${e.message}`;
	}
	return `${tag}: Unknown error`;
}
