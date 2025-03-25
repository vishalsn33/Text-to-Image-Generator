import OpenAI from 'openai'; // Import Nebius SDK
import userModel from '../models/userModel.js';

// Initialize Nebius client
const client = new OpenAI({
    baseURL: 'https://api.studio.nebius.com/v1/',
    apiKey: process.env.NEBIUS_API_KEY, // Ensure this is set in your environment variables
});

// Controller function to generate image from prompt
// http://localhost:4000/api/image/generate-image
export const generateImage = async (req, res) => {
    try {
        const { userId, prompt } = req.body;

        // Fetching User Details Using userId
        const user = await userModel.findById(userId);

        if (!user || !prompt) {
            return res.json({ success: false, message: 'Missing Details' });
        }

        // Checking User creditBalance
        if (user.creditBalance === 0 || user.creditBalance < 0) {
            return res.json({ success: false, message: 'No Credit Balance', creditBalance: user.creditBalance });
        }

        // Calling Nebius API to generate image
        const response = await client.images.generate({
            model: "black-forest-labs/flux-dev",
            response_format: "b64_json",
            extra_body: {
                response_extension: "webp",
                width: 1024,
                height: 1024,
                num_inference_steps: 28,
                negative_prompt: "",
                seed: -1,
            },
            prompt: prompt,
        });

        // Extract base64 image from response
        const base64Image = response.data[0].b64_json; // Assuming the response structure includes b64_json
        const resultImage = `data:image/webp;base64,${base64Image}`;
        console.log(resultImage);
        // Deduction of user credit
        await userModel.findByIdAndUpdate(user._id, { creditBalance: user.creditBalance - 1 });

        // Sending Response
        res.json({
            success: true,
            message: "Image Generated Successfully",
            resultImage,
            creditBalance: user.creditBalance - 1,
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};