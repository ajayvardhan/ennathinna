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


// API endpoint
app.post('/', authenticateAPIKey, async (req: Request, res: Response) => {
    const { cuisine, cookingTime, mealType, dietType, dietaryRestrictions, flavorProfiles, allergies, proteinContent, carbohydrateContent, fatContent } = req.body;
    const prompt = `Suggest a dish based on the following criteria: 
    Cuisine: ${cuisine}
    Cooking Time: ${cookingTime}
    Meal Type: ${mealType}
    Diet Type: ${dietType}
    Dietary Restriction: ${dietaryRestrictions}
    Flavor Profile: ${flavorProfiles}
    Allergies: ${allergies}
    Protein Content: ${proteinContent}
    Carbohydrate Content: ${carbohydrateContent}
    Fat Content: ${fatContent}
    
    Respond with just the dish name`
    try {
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 15,
        });
        const choices = response?.data?.choices;
        if (Array.isArray(choices) && choices.length > 0) {
            const data = choices[0].text?.replace(/[^a-zA-Z0-9 ]|(\r\n|\n|\r)/gm, '');
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
