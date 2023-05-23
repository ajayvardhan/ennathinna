// Import dependencies
import express, { Request, Response } from 'express';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Create Express app
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// OpenAI configuration
const configuration = new Configuration({
    organization: process.env.ORGANIZATION_ID,
    apiKey: process.env.API_KEY,
});

// OpenAI instance creation
const openai = new OpenAIApi(configuration);

// API endpoint
app.post('/', async (req: Request, res: Response) => {
    const { cuisine, cookingTime, mealType } = req.body;
    const prompt = `Suggest a dish for ${mealType} - Cuisine: ${cuisine}, Cooking Time: ${cookingTime}. I just need the dish name without any descriptions or extra text.`;
    try {
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 10,
        });
        const choices = response?.data?.choices;
        if (Array.isArray(choices) && choices.length > 0) {
            const data = choices[0].text?.replace(/(\r\n|\n|\r)/gm, '');
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
