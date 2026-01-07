/**
 * OpenRouter Client
 */

import { OPENROUTER_CONFIG } from "./config";
import type { ChatCompletionMessage } from "./types";

interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

interface ChatOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Send a chat completion request to OpenRouter
 */
export async function chat(
    messages: ChatCompletionMessage[],
    options: ChatOptions = {}
): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    const {
        model = OPENROUTER_CONFIG.model,
        temperature = 0.3,
        maxTokens = 1024,
    } = options;

    try {
        const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "RAG Chatbot",
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data = (await response.json()) as OpenRouterResponse;

        if (!data.choices || data.choices.length === 0) {
            throw new Error("No response from OpenRouter");
        }

        return data.choices[0].message.content;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`OpenRouter chat failed: ${error.message}`);
        }
        throw new Error("OpenRouter chat failed: Unknown error");
    }
}

/**
 * Convenience function for single-turn chat with system prompt
 */
export async function chatWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options: ChatOptions = {}
): Promise<string> {
    const messages: ChatCompletionMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ];

    return chat(messages, options);
}
