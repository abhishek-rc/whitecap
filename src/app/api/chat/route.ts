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
    sfPreferred?: boolean;
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

        // System prompt for product search assistant
        const systemPrompt = `You are a helpful shopping assistant for a food distribution company. Your role is to:
            1. Help users find products based on their needs
            2. Extract search queries from user messages
            3. Extract specific filters when mentioned (categories, brands, price ranges, etc.)
            4. Provide helpful product recommendations
            5. Be conversational and friendly

            When a user asks about products, you should:
            - Respond conversationally and specifically to their request
            - Acknowledge what they're looking for in your response
            - Extract key search terms and return them as a searchQuery
            - Extract any specific filters mentioned (category, brand, price range, etc.)
            - Focus only on what the user specifically asked for
            - Do NOT suggest additional product categories or options they didn't ask for
            - Keep responses concise and focused
            - NEVER include the search query or any technical details in your response to the user

            Examples of good responses:
            - If user asks "show me chicken products" → "I'll help you find chicken products for you!"
            - If user asks "need organic vegetables under $5" → "Great! I'm searching for organic vegetables under $5."
            - If user asks "looking for dairy products from Brand X" → "Perfect! I'll find Brand X dairy products for you."

            IMPORTANT: Your response should ONLY contain the conversational message. Do NOT include searchQuery, technical details, or any system information in your response.

            Always respond in a helpful, friendly tone but keep it focused on their specific request. When you identify a product search intent, always extract and return a searchQuery and any applicable filters.`;

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
                    description: 'Search for products based on user query with optional filters',
                    parameters: {
                        type: 'object',
                        properties: {
                            searchQuery: {
                                type: 'string',
                                description: 'The search query to find relevant products'
                            },
                            filters: {
                                type: 'object',
                                description: 'Optional filters to apply to the search',
                                properties: {
                                    category: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        description: 'Product categories (e.g., ["dairy"], ["meat"], ["vegetables"])'
                                    },
                                    brand: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        description: 'Brand names to filter by'
                                    },
                                    priceRange: {
                                        type: 'object',
                                        properties: {
                                            min: { type: 'number', description: 'Minimum price' },
                                            max: { type: 'number', description: 'Maximum price' }
                                        }
                                    },
                                    sfPreferred: {
                                        type: 'boolean',
                                        description: 'Filter for SF preferred products'
                                    },
                                    allergens: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        description: 'Allergen filters (e.g., ["gluten-free"], ["dairy-free"])'
                                    }
                                }
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
        let filters: SearchFilters = {};

        console.log('OpenAI Response:', assistantMessage);

        // Check if the AI wants to call the search function
        if (assistantMessage.function_call) {
            try {
                const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');
                searchQuery = functionArgs.searchQuery;
                filters = functionArgs.filters || {};
                console.log('Function call search query:', searchQuery);
                console.log('Function call filters:', filters);
            } catch (error) {
                console.error('Error parsing function arguments:', error);
            }
        }

        // Enhanced fallback: extract search terms and basic filters from user input directly
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
                const hasProductKeywords = /\b(cheese|sandwich|bread|milk|meat|chicken|beef|fish|fruit|vegetable|snack|drink|beverage|food|organic|fresh|pizza|pasta|rice|egg|butter|yogurt|cereal|soup|sauce|spice|herb|oil|vinegar|sugar|flour|salt|pepper|tea|coffee|juice|water|soda|wine|beer)\b/.test(userInput);
                
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
            
            // Extract basic filters from common phrases
            if (userInput.includes('organic')) {
                if (!filters?.category) filters.category = [];
                if (!filters.category.includes('organic')) filters.category.push('organic');
            }
            
            // Price range extraction
            const priceMatch = userInput.match(/under \$?(\d+)/i) || userInput.match(/below \$?(\d+)/i) || userInput.match(/less than \$?(\d+)/i);
            if (priceMatch) {
                filters.priceRange = { max: parseInt(priceMatch[1]) };
            }
            
            const priceRangeMatch = userInput.match(/between \$?(\d+) and \$?(\d+)/i) || userInput.match(/from \$?(\d+) to \$?(\d+)/i);
            if (priceRangeMatch) {
                filters.priceRange = { 
                    min: parseInt(priceRangeMatch[1]), 
                    max: parseInt(priceRangeMatch[2]) 
                };
            }
            
            // Category extraction
            const categories = ['dairy', 'meat', 'vegetables', 'fruits', 'beverages', 'snacks', 'frozen', 'bakery', 'seafood', 'poultry', 'chicken', 'beef', 'pork'];
            for (const category of categories) {
                if (userInput.includes(category)) {
                    if (!filters.category) filters.category = [];
                    if (!filters.category.includes(category)) filters.category.push(category);
                }
            }
            
            // Allergen-free extraction
            if (userInput.includes('gluten-free') || userInput.includes('gluten free')) {
                if (!filters.allergens) filters.allergens = [];
                if (!filters.allergens.includes('gluten-free')) filters.allergens.push('gluten-free');
            }
            if (userInput.includes('dairy-free') || userInput.includes('dairy free')) {
                if (!filters.allergens) filters.allergens = [];
                if (!filters.allergens.includes('dairy-free')) filters.allergens.push('dairy-free');
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
            searchQuery,
            filters
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
