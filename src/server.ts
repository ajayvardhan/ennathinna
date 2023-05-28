// Import dependencies
import express, { Request, Response } from 'express';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

// Create Express app
const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(cors());

// OpenAI configuration
const configuration = new Configuration({
    organization: process.env.ORGANIZATION_ID,
    apiKey: process.env.OPEN_API_KEY,
});

// OpenAI instance creation
const openai = new OpenAIApi(configuration);


// API key verification middleware
const authenticateAPIKey = (req: Request, res: Response, next: Function) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        return res.status(401).json({ message: 'Missing API key' });
    }

    if (apiKey === process.env.OPEN_API_KEY) {
        return res.status(403).json({ message: 'Invalid API key' });
    }

    // If the API key is valid, proceed to the next middleware
    next();
}

const constructPrompt = (cuisine: string, cookingTime: string, mealType: string, dietType: string, dietaryRestrictions?: string, flavorProfiles?: string, allergies?: string, proteinContent?: string, carbohydrateContent?: string, fatContent?: string, availableIngredients?: string): string => {
    let prompt = `Please recommend a dish that is`;

    prompt += ` ${cuisine} cuisine,`;
    prompt += ` can be prepared in ${cookingTime},`;
    prompt += ` suitable for ${mealType} and ${dietType} diet,`;

    if (dietaryRestrictions) {
        prompt += ` without violating any ${dietaryRestrictions},`;
    }

    if (flavorProfiles) {
        prompt += ` with ${flavorProfiles} flavor profile,`;
    }

    if (allergies) {
        prompt += ` avoiding ${allergies},`;
    }

    if (proteinContent) {
        prompt += ` with ${proteinContent} protein content,`;
    }

    if (carbohydrateContent) {
        prompt += ` ${carbohydrateContent} carbohydrate content,`;
    }

    if (fatContent) {
        prompt += ` and ${fatContent} fat content,`;
    }

    if (availableIngredients) {
        prompt += ` using the available ingredients: ${availableIngredients}.`;
    }

    prompt += ` ${new Date().toISOString()}`

    return prompt;
}



// API endpoint
app.post('/', authenticateAPIKey, async (req: Request, res: Response) => {
    const { cuisine, cookingTime, mealType, dietType, dietaryRestrictions, flavorProfiles, allergies, proteinContent, carbohydrateContent, fatContent, availableIngredients } = req.body;
    const prompt = constructPrompt(cuisine, cookingTime, mealType, dietType, dietaryRestrictions, flavorProfiles, allergies, proteinContent, carbohydrateContent, fatContent, availableIngredients);

    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { "role": "system", "content": "You are an expert chef specializing in the cuisine the user is asking for. You reply with short, to-the-point answers with no elaboration." },
                { "role": "user", "content": prompt },
            ],
            temperature: 0.7,
        });
        const choices = response?.data?.choices;
        if (Array.isArray(choices) && choices.length > 0) {
            const data = choices[0].message?.content.replace(/[^a-zA-Z0-9 ]|(\r\n|\n|\r)/gm, '');
            res.status(200).json(data);
        } else {
            throw new Error('Invalid response from OpenAI API');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
