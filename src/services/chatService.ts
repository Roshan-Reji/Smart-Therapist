const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export const chatWithAI = async (messages: ChatMessage[], apiKey: string) => {
	try {
		const response = await fetch(GROQ_API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'llama-3.3-70b-versatile',
				messages: messages,
				temperature: 0.7,
				max_tokens: 1000,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('Groq API Error:', error);
			throw new Error(error.error?.message || 'Failed to get response from Groq AI');
		}

		const result = await response.json();
		return result.choices[0]?.message?.content || 'No response from AI';
	} catch (error) {
		console.error('Error in chatWithAI:', error);
		throw error;
	}
};

export const summarizeChat = async (currentSummary: string, newMessages: ChatMessage[], apiKey: string): Promise<string> => {
	if (newMessages.length === 0) return currentSummary;

	const messagesForSummary: ChatMessage[] = [
		{
			role: 'system',
			content: `You are an expert clinical summarizer. Your goal is to update the patient's long-term memory summary. 
            You will be given the "Current Summary" (which might be empty) and "New Conversation". 
            Merge the meaningful details from the new conversation into the summary. 
            Focus on: 
            1. User's personal details, struggles, or goals mentioned.
            2. Therapeutic advice given that should be reinforced.
            3. Progress made.
			4. Make sure that the response in easily redable not too long.
			5. Make sure that the response is not too complex.
			6. Keep the responses in simple language and maybe make it in bullet points.
			7. Make sure only max of 3-4 points and make sure its simple comforatable.

			Keep the output concise (under 200 words) but comprehensive. 
			Do not output typical conversational filler. Just the summary.`
		},
		{
			role: 'user',
			content: `Current Summary:\n${currentSummary || "None"}\n\nNew Conversation:\n${newMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`
		}
	];

	return await chatWithAI(messagesForSummary, apiKey);
};
