import { toast } from "sonner";

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_KEY;

export const generateFeedback = async (pitchDescription: string) => {
	if (!OPENROUTER_API_KEY) {
		toast("AI service key is missing. Please configure the OpenRouter API key.");
		return null;
	}

	const modelName = "google/gemma-3n-e4b-it:free";

	const systemPrompt = `You are an expert venture capitalist analyst. Your task is to provide 
concise, actionable feedback on a startup pitch. You must analyse the pitch and 
assign an overall RAG status based on its investment readiness: RED (high risk/major flaws), 
AMBER (minor flaws/needs work), or GREEN (ready to pitch). After that, you must describe what 
to change about the pitch to make it more suitable for investment.

Your entire output MUST be in the following exact format:
[RAG_RATING:COLOR]
[FEEDBACK_START]
* Bulleted, actionable feedback focusing on weaknesses.
* Each point should be clear and concise.
...
[FEEDBACK_END]
Replace COLOR with RED, AMBER, or GREEN.`;

	const combinedPrompt = `${systemPrompt}\n\nReview this pitch:\n\n${pitchDescription}`;

	const payload = {
		model: modelName,
		messages: [
			{
				role: "user",
				content: combinedPrompt
			}
		],
		temperature: 0.5,
		max_tokens: 2048,
	};

	try {
		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${OPENROUTER_API_KEY}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://pitch-management-app.com",
				"X-Title": "Pitch Management App"
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			let errorData: any = {};
			try {
				errorData = await response.json();
			} catch (e) {
			}

			const apiMessage = errorData.error?.message || errorData.message;

			const errorMessage = `AI Service Error: ${response.status} - ${apiMessage || response.statusText}`;
			toast.error(errorMessage);
			console.error("OpenRouter API Error:", errorData);
			return null;
		}

		const data = await response.json();
		const fullAiOutput = data.choices[0].message.content;

		const ragMatch = fullAiOutput.match(/\[RAG_RATING:(\w+)\]/);

		let ragRating = 'UNKNOWN';
		if (ragMatch && ragMatch[1]) {
			ragRating = ragMatch[1].toUpperCase();
		}

		const feedbackStartTag = '[FEEDBACK_START]';
		const feedbackEndTag = '[FEEDBACK_END]';

		let detailedFeedback = "Could not parse detailed feedback from the AI response.";

		const startIndex = fullAiOutput.indexOf(feedbackStartTag);
		const endIndex = fullAiOutput.indexOf(feedbackEndTag);

		if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
			detailedFeedback = fullAiOutput
				.substring(startIndex + feedbackStartTag.length, endIndex)
				.trim();
		} else if (ragMatch) {
			detailedFeedback = fullAiOutput.replace(/\[RAG_RATING:(\w+)\]/g, '').trim();
		}

		toast("AI feedback and RAG rating received!");

		return {
			ragRating: ragRating,
			feedback: detailedFeedback
		};

	} catch (error) {
		console.error("Fetch API Error:", error);
		toast("An unexpected error occurred while connecting to the AI service.");
		return null;
	}
};
