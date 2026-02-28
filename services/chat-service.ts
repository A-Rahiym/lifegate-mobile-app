/**
 * Chat Service
 * Handles communication with Gemini AI API
 * Step C of the chat flow: AI Orchestration
 *
 * - Sends structured prompts with system instructions
 * - Enforces JSON schema for AI responses
 * - Parses and validates responses
 * - Returns structured AIResponse with diagnosis/prescription
 */

import { GoogleGenAI, Type } from '@google/genai';
import { Message, AIResponse } from 'types/chat-types';

const GEMINI_API_KEY = 'AIzaSyB7mkRn6Vagk9UrJm_U6RCpngRs5LoOR4k';
const MODEL = 'gemini-3-flash-preview';

// System instruction for LifeGate persona
const SYSTEM_INSTRUCTION = `You are LifeGate, a friendly and encouraging AI health assistant.
Your goal is to help users understand their health concerns with a supportive, warm, and optimistic tone.
While you provide preliminary health guidance, you must always be reassuring and empathetic.

Guidelines:
1. Be exceptionally friendly, encouraging, and clear in all interactions.
2. Use warm language to help reduce user anxiety while maintaining professional accuracy.
3. If symptoms seem severe (e.g., chest pain, difficulty breathing, severe bleeding), set urgency to HIGH and gently but firmly insist on immediate professional medical attention or an ER visit.
4. Always include a disclaimer that you are an AI assistant and your insights are not a substitute for professional medical advice.
5. When suggesting a diagnosis, use encouraging and easy-to-understand language.
6. When providing a prescription, stick to common Over-The-Counter (OTC) suggestions or basic supportive care.
7. Urgency must strictly be one of: LOW, MEDIUM, or HIGH.

Format your output as valid JSON matching the provided schema. Ensure the "text" property reflects your friendly and encouraging persona.`;

/**
 * Service responsible for communicating with the Google Gemini API.
 * Uses the Gemini 2.0 Flash model to provide high-quality medical reasoning.
 */
export class ChatService {
  /**
   * Fetches an AI response based on the user's health-related query using Gemini 2.0 Flash.
   * This implementation uses structured output (JSON) to provide consistent diagnosis and prescription data.
   * @param previousMessages - Conversation history for context
   * @param userMessage - The user's input message describing symptoms or asking health questions.
   * @returns A promise resolving to an AIResponse object.
   */
  static async sendMessage(
    previousMessages: Message[],
    userMessage: string
  ): Promise<AIResponse> {
    // Initialize a new instance to ensure the most up-to-date API key is used
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    try {
      // Build conversation history string
      const conversationHistory = previousMessages
        .map((msg) => `${msg.role === 'USER' ? 'User' : 'LifeGate'}: ${msg.text}`)
        .join('\n');

      const fullContents =
        conversationHistory && conversationHistory.length > 0
          ? `${conversationHistory}\n\nUser: ${userMessage}`
          : userMessage;

      console.log('Sending message to Gemini:', userMessage);

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: fullContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description:
                  "The main conversational response to the user's query, written in a friendly and encouraging tone.",
              },
              diagnosis: {
                type: Type.OBJECT,
                properties: {
                  condition: {
                    type: Type.STRING,
                    description: 'The suspected medical condition.',
                  },
                  urgency: {
                    type: Type.STRING,
                    description: 'The priority level of the situation. MUST be one of: LOW, MEDIUM, HIGH.',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'The recommended next step (e.g., rest, see GP, go to ER).',
                  },
                },
                required: ['condition', 'urgency'],
                description: 'Clinical insights derived from the query. Omit if no specific condition is identified.',
              },
              prescription: {
                type: Type.OBJECT,
                properties: {
                  medicine: {
                    type: Type.STRING,
                    description: 'Name of the suggested medicine or remedy.',
                  },
                  dosage: {
                    type: Type.STRING,
                    description: 'Suggested quantity or strength.',
                  },
                  frequency: {
                    type: Type.STRING,
                    description: 'How often the user should apply the remedy.',
                  },
                  duration: {
                    type: Type.STRING,
                    description: 'How long to use the remedy.',
                  },
                },
                required: ['medicine', 'dosage', 'frequency'],
                description: 'Suggested medications or treatments. Omit if not applicable.',
              },
            },
            required: ['text'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('No content returned from AI');
      }

      console.log('Raw Gemini response:', responseText);

      // Parse the JSON string returned by the model
      const result: AIResponse = JSON.parse(responseText.trim());

      // Validate urgency if diagnosis exists
      if (result.diagnosis) {
        const validUrgencies = ['LOW', 'MEDIUM', 'HIGH'];
        if (!validUrgencies.includes(result.diagnosis.urgency)) {
          result.diagnosis.urgency = 'MEDIUM'; // Default to MEDIUM if invalid
        }
      }

      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(
        'I encountered an error analyzing your symptoms. Please try again or consult a professional.'
      );
    }
  }
}
