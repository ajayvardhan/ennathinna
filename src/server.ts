// Import dependencies
import express, { Request, Response } from 'express';
import { OpenAI } from "openai";
import dotenv from 'dotenv';
import cors from 'cors';

// Initialize dotenv for environment variables
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPEN_API_KEY
});

// Create Express app
const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(cors());

// Helper function to construct the user prompt
const constructPrompt = ({
    cuisine,
    cookingTime,
    mealType,
    dietType,
    dietaryRestrictions = '',
    flavorProfiles = '',
    allergies = '',
    proteinContent = '',
    carbohydrateContent = '',
    fatContent = '',
    availableIngredients = '',
}: {
    cuisine: string;
    cookingTime: string;
    mealType: string;
    dietType: string;
    dietaryRestrictions?: string;
    flavorProfiles?: string;
    allergies?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fatContent?: string;
    availableIngredients?: string;
}): string => {
    let prompt = `Please recommend a dish that is ${cuisine} cuisine,`;
    prompt += ` can be prepared in ${cookingTime}, suitable for ${mealType} and ${dietType} diet,`;

    if (dietaryRestrictions) prompt += ` without violating any ${dietaryRestrictions},`;
    if (flavorProfiles) prompt += ` with ${flavorProfiles} flavor profile,`;
    if (allergies) prompt += ` avoiding ${allergies},`;
    if (proteinContent) prompt += ` with ${proteinContent} protein content,`;
    if (carbohydrateContent) prompt += ` ${carbohydrateContent} carbohydrate content,`;
    if (fatContent) prompt += ` and ${fatContent} fat content,`;
    if (availableIngredients) prompt += ` using the available ingredients: ${availableIngredients}.`;

    return prompt;
};

// OpenAI API interaction function
const getOpenAIResponse = async (systemMessage: string, userMessage: string) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
        });

        return response.choices.pop()?.message.content || 'No response';
    } catch (error) {
        console.error('Error interacting with OpenAI:', error);
        throw new Error('OpenAI API request failed');
    }
};

// API endpoint for dish recommendations
app.post('/recommend-dish', async (req: Request, res: Response) => {
    const { cuisine, cookingTime, mealType, dietType, dietaryRestrictions, flavorProfiles, allergies, proteinContent, carbohydrateContent, fatContent, availableIngredients } = req.body;

    const systemMessage = `Generate a dish name for a ${cuisine} ${mealType} dish. Respond with just the dish name and no extra words. Use the conversation history context and ensure you don't repeat the same response for the same prompt.`;
    const userMessage = constructPrompt({
        cuisine,
        cookingTime,
        mealType,
        dietType,
        dietaryRestrictions,
        flavorProfiles,
        allergies,
        proteinContent,
        carbohydrateContent,
        fatContent,
        availableIngredients,
    });

    try {
        const response = await getOpenAIResponse(systemMessage, userMessage);
        res.status(200).json({ dishRecommendation: response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get dish recommendation from OpenAI' });
    }
});

// API endpoint for recipe generation
app.post('/recipe', async (req: Request, res: Response) => {
    const { dish } = req.body;

    const systemMessage = 'You are an expert chef. Provide a clear recipe with ingredients, cooking temperatures, and times.';
    const userMessage = `Please provide me with a recipe for ${dish}`;

    try {
        const response = await getOpenAIResponse(systemMessage, userMessage);
        res.status(200).json({ recipe: response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate recipe from OpenAI' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
