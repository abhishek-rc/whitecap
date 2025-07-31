import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Define the SearchFilters interface
interface SearchFilters {
    category?: string[];
    brand?: string[];
    priceRange?: {
        min?: number;
        max?: number;
    };
    allergens?: string[];
}

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Enhanced system prompt for WhiteCap product search assistant
        const systemPrompt = `You are an expert AI assistant for WhiteCap, a construction and industrial supply marketplace. Your primary role is to help users find the RIGHT products with precision and context awareness.

            CORE RESPONSIBILITIES:
            1. Understand user intent with construction/industrial context
            2. Generate precise, targeted search queries that avoid irrelevant results
            3. Handle dimensions, measurements, and technical specifications accurately
            4. Prioritize specific products over generic keyword matches
            5. Consider location and availability when relevant

            SEARCH QUERY OPTIMIZATION RULES:

            **Specific Product Priority:**
            - For "water" queries: Distinguish between specific products (Water Stop, Water Cooler, Water Heater) vs general water-related items
            - For "bolt" queries: Match exact types (carriage bolt, hex bolt, eye bolt) rather than generic "bolt" searches
            - For chemical/specialty products: Use exact product names when identifiable

            **Dimension & Measurement Handling:**
            - Convert colloquial measurements: "quarter inch" → "1/4 inch", "three quarter" → "3/4 inch"
            - Handle fractional formats: "1 quarter" → "1-1/4 inch" or "1.25 inch"
            - Include common variations: "3/4" AND "0.75" AND "three quarter"
            - For bolts/screws: Include both fractional and decimal equivalents

            **Construction Context Understanding:**
            - "lite bolt" likely means "light duty bolt" not "carriage bolt"
            - "water leak" → prioritize "pipe repair", "sealants", "emergency repair kits"
            - "hammer" + location → prioritize in-stock hammers at nearby stores

            **Search Query Structure:**
            - Use specific product names when identifiable
            - Include measurement variations and synonyms
            - Add relevant category hints (e.g., "plumbing supplies", "fasteners")
            - Consider brand preferences and quality levels

            RESPONSE GUIDELINES:
            - Be direct and solution-focused
            - Acknowledge the user's specific need
            - Explain why you're suggesting certain products
            - Mention when location/availability matters
            - Keep responses concise but informative

            EXAMPLES:
            
            User: "show me water products"
            Response: "I'll help you find water-related products! Are you looking for specific items like water coolers, water heaters, or plumbing supplies for water systems?"
            Search: "water cooler OR water heater OR plumbing water supplies"

            User: "I need quarter inch bolts"
            Response: "I'll find 1/4 inch bolts for you! Let me search for various types and lengths available."
            Search: "1/4 inch bolt OR 0.25 inch bolt OR quarter inch bolt fasteners"

            User: "water leak in my basement"
            Response: "That sounds like you need emergency plumbing supplies! I'll help you find pipe repair kits, sealants, and tools to fix water leaks."
            Search: "pipe repair kit water leak sealant emergency plumbing supplies"

            User: "find me a hammer near my location"
            Response: "I'll help you find hammers available at your nearest WhiteCap location! Let me search for in-stock hammers."
            Search: "hammer tools in-stock local availability"

            When generating search queries, prioritize PRECISION over broad matching to reduce irrelevant results.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 300,
            temperature: 0.7,
            functions: [
                {
                    name: 'search_products',
                    description: 'Search for products based on user query',
                    parameters: {
                        type: 'object',
                        properties: {
                            searchQuery: {
                                type: 'string',
                                description: 'The search query to find relevant products'
                            }
                        },
                        required: ['searchQuery']
                    }
                }
            ],
            function_call: 'auto'
        });

        const assistantMessage = completion.choices[0].message;
        let searchQuery = null;

        console.log('OpenAI Response:', assistantMessage);

        // Check if the AI wants to call the search function
        if (assistantMessage.function_call) {
            try {
                const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');
                searchQuery = functionArgs.searchQuery;
                console.log('Function call search query:', searchQuery);
            } catch (error) {
                console.error('Error parsing function arguments:', error);
            }
        }

        // Enhanced fallback: extract search terms from user input directly
        if (!searchQuery) {
            const userInput = message.toLowerCase();
            
            // Look for common search patterns
            const searchPatterns = [
                /show me (.*)/,
                /find (.*)/,
                /looking for (.*)/,
                /need (.*)/,
                /want (.*)/,
                /search for (.*)/,
                /get me (.*)/
            ];
            
            for (const pattern of searchPatterns) {
                const match = userInput.match(pattern);
                if (match && match[1]) {
                    searchQuery = match[1].trim();
                    console.log('Pattern match search query:', searchQuery);
                    break;
                }
            }
            
            // Fallback: if no pattern matched and the input looks like a simple product search
            // (short, doesn't contain question words, and isn't a greeting)
            if (!searchQuery) {
                const questionWords = ['how', 'what', 'when', 'where', 'why', 'who', 'can you', 'could you', 'would you', 'hello', 'hi', 'hey', 'thanks', 'thank you'];
                const isQuestion = questionWords.some(word => userInput.includes(word));
                const isShort = userInput.trim().split(' ').length <= 4; // Increased to 4 words or less
                const hasProductKeywords = /\b(electronics|clothing|home|books|toys|sports|beauty|health|automotive|garden|pet|baby|office|jewelry|shoes|accessories)\b/.test(userInput);
                
                console.log('Fallback analysis:', {
                    userInput,
                    isQuestion,
                    isShort,
                    hasProductKeywords,
                    wordCount: userInput.trim().split(' ').length
                });
                
                // More inclusive: if it's not a question and either short OR has product keywords
                if (!isQuestion && (isShort || hasProductKeywords)) {
                    searchQuery = userInput.trim();
                    console.log('Fallback search query:', searchQuery);
                }
            }
        }

        // Enhance the response message if we have a search query
        let responseMessage = assistantMessage.content || 'I can help you find products. What are you looking for?';
        
        // If we have a search query but the AI didn't provide a contextual response, create one
        if (searchQuery && (!assistantMessage.content || assistantMessage.content.length < 20)) {
            responseMessage = `Great! I'm searching for "${searchQuery}" for you. Let me find the best options available.`;
        }

        console.log('Final search query:', searchQuery);
        console.log('Response message:', responseMessage);

        return NextResponse.json({
            success: true,
            message: responseMessage,
            searchQuery
        });

    } catch (error) {
        console.error('Chat API error:', error);

        // Handle specific OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { success: false, error: 'OpenAI API key is invalid or missing' },
                    { status: 500 }
                );
            }
            if (error.message.includes('quota')) {
                return NextResponse.json(
                    { success: false, error: 'OpenAI API quota exceeded' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: 'Failed to process chat message' },
            { status: 500 }
        );
    }
}
