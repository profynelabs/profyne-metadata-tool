const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('public'));
app.use(express.json());

app.post('/api/generate-metadata', upload.single('image'), async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.trim() === '') {
            return res.status(500).json({
                success: false,
                message: 'Gemini API Key is missing in .env file.'
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image file.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // আপডেটেড মডেল নাম
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            },
        };

        const prompt = `You are an expert microstock SEO specialist for Adobe Stock, Shutterstock, and Freepik. 
    Analyze this image and generate metadata.
    Return ONLY a valid JSON object without markdown formatting or code blocks:
    {
      "title": "Concise, highly descriptive English title (5-10 words)",
      "category": "The single most relevant stock category name",
      "keywords": ["keyword1", "keyword2", "keyword3", "up to 30 relevant keywords"]
    }`;

        const result = await model.generateContent([prompt, imagePart]);
        let responseText = result.response.text();

        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const metadata = JSON.parse(responseText);

        res.json({ success: true, metadata });

    } catch (error) {
        console.error('Gemini API Error Detail:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate metadata.'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`PROFYNE LABS Server running on http://localhost:${PORT}`);
});