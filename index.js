import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dbPromise from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini Client (Multi-Key/Model Rotation)
const geminiKeys = [
    "AIzaSyA4pa3rzhpEKAxWU5kT9E2MtnmyMa4OYAs",
    "AIzaSyBAJZ5Zlmn7LB4R3gg8ObkgunXlvk-1EKI"
];

const fallbackModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-lite"
];
let currentGeminiKeyIndex = 0;

function getGeminiClientByIndex(index) {
    const key = geminiKeys[index % geminiKeys.length];
    console.log(`[API Proxy] Attempt ${index + 1}: Using key ending ...${key.slice(-4)}`);
    return new GoogleGenAI({ apiKey: key });
}

function advanceKeyIndex() {
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % geminiKeys.length;
}

app.use(cors());
// Increase limit for base64 image strings
app.use(express.json({ limit: '50mb' }));

// ==========================================
// GROQ AI ENDPOINTS
// ==========================================

// 1. Image Analysis (/api/analyze)
app.post('/api/analyze', async (req, res) => {
    try {
        const { imageBase64, icData } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

        const demoContext = icData ? `The patient is a ${icData.age} year old ${icData.gender}. Keep this demographic context in mind for baseline dermatological risks (like hormonal distributions, age spots, melanoma curves).` : '';

        const prompt = `
            ${demoContext}
            As a dermatology screening assistant, analyze this skin image. 
            Identify potential conditions, detected signals (like redness, scaling), and provide a preliminary risk assessment.
            In addition, map the exact body part shown in the image to ONE of the following precise string values: 'head', 'neck', 'shoulderL', 'shoulderR', 'chest', 'abdomen', 'pelvis', 'upperArmL', 'upperArmR', 'forearmL', 'forearmR', 'handL', 'handR', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR'.
            If it's the face, you MUST use 'head'.
            
            CRITICAL VALIDATION INSTRUCTIONS:
            1. Verify if a person/skin is clearly visible in the image. Set "person_detected" to true or false.
            2. If evaluating the face, determine if it is reasonably well-centered and not completely obscured/cut off. Set "good_angle" to true or false. If not a face, evaluate the general clarity of the body part.
            
            SPATIAL TRACKING:
            For each condition detected, provide a "boundingBox" array: [ymin, xmin, ymax, xmax] mapping to the physical location in the image. Values must be normalized floats between 0.0 and 1.0, where [0,0] is top-left and [1,1] is bottom-right.
            
            IMPORTANT MEDICAL ACCURACY & ACNE HANDLING: 
            This is NOT a medical diagnosis. DO NOT hallucinate conditions. 
            - If the image shows a face with pimples, blackheads, whiteheads, or general acne (Acne Vulgaris), you MUST accurately identify it as "Acne" or "Pimples" and NOT a severe disease.
            - For common acne, minor blemishes, or healthy skin, you MUST set "suggestedRiskScore" to a VERY LOW value (e.g., 5-25).
            - Do not invent high-risk conditions just because there is redness associated with a pimple.
            - Only assign high risk scores (>60) for severe, obvious, or highly suspicious lesions (like potential melanoma or severe infections).
            - CRITICAL: In the "primaryInsight" field, you MUST explicitly state the body part scanned and the main finding (e.g., "Scanning the face reveals mild acne." or "Scanning the forearm shows normal healthy skin.").
            - CRITICAL UI RULE: You MUST NEVER return an empty "conditions" array. If the skin is completely healthy or you cannot find any distinct blemishes, you MUST return at least one condition named "Healthy Skin" or "Normal Tissue" with a bounding box mapped to the center of the scanned area (e.g. [0.4, 0.4, 0.6, 0.6]) and assign a very low risk score (e.g. 5).
            
            Return ONLY a valid JSON object in exactly this format, nothing else. If person_detected is false, you may omit bounding boxes but keep the JSON structure intact:
            {
              "person_detected": true,
              "good_angle": true,
              "conditions": [
                { "category": "Acne", "confidence": 0.95, "description": "Mild facial acne", "boundingBox": [0.45, 0.45, 0.55, 0.55] }
              ],
              "signals": ["redness", "papules"],
              "primaryInsight": "Scanning the face reveals common acne.",
              "explanation": "Visible comedones and mild inflammation typical of acne.",
              "suggestedRiskScore": 15,
              "bodyPart": "head"
            }
        `;

        // Retry across available keys and fallback models
        let response = null;
        let lastErr = null;
        const startIndex = currentGeminiKeyIndex;

        retryLoop:
        for (let attempt = 0; attempt < geminiKeys.length; attempt++) {
            const keyIndex = (startIndex + attempt) % geminiKeys.length;
            const ai = getGeminiClientByIndex(keyIndex);

            for (const modelName of fallbackModels) {
                try {
                    console.log(`[API Proxy] Attempt ${attempt + 1}/${geminiKeys.length}: Trying model ${modelName} with key ending ...${geminiKeys[keyIndex].slice(-4)}`);
                    response = await ai.models.generateContent({
                        model: modelName,
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    { text: prompt },
                                    {
                                        inlineData: {
                                            mimeType: mimeType,
                                            data: base64Data
                                        }
                                    }
                                ]
                            }
                        ],
                        config: {
                            temperature: 0.1,
                            responseMimeType: "application/json"
                        }
                    });
                    currentGeminiKeyIndex = (keyIndex + 1) % geminiKeys.length; // advance past the key that worked
                    break retryLoop; // success, stop retrying completely
                } catch (err) {
                    lastErr = err;
                    if (err?.status === 429) {
                        console.warn(`[API Proxy] Rate limit (429) on model ${modelName} with key ending ...${geminiKeys[keyIndex].slice(-4)}. Trying next key...`);
                        continue retryLoop; // Rate limit likely affects the whole key, skip to next key
                    } else if (err?.status === 404 || err?.status === 503 || err?.status === 400 || err?.status === 500) {
                        console.warn(`[API Proxy] Model ${modelName} unavailable (${err.status}), trying next model...`);
                        continue; // Try next model on the same key
                    } else {
                        console.warn(`[API Proxy] Unexpected error on model ${modelName}:`, err.message);
                        throw err; // Re-throw unhandled errors
                    }
                }
            }
        }

        if (!response) throw lastErr;

        const rawJson = typeof response.text === 'function' ? response.text() : response.text;
        const parsed = JSON.parse(rawJson);
        console.log("VISION AI PARSED JSON:", JSON.stringify(parsed, null, 2));
        res.json(parsed);
    } catch (err) {
        console.error("Analysis Error:", err);
        const code = err?.status || 500;
        const msg = code === 429 ? "All API keys rate-limited. Please wait 60s." : "Vision AI Analysis Failed.";
        res.status(code).json({ error: msg, details: err.message });
    }
});
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, context } = req.body;
        if (!messages) return res.status(400).json({ error: 'No messages provided' });

        const model = "llama-3.3-70b-versatile";

        const systemInstruction = `
            You are DermaAI Copilot, a professional dermatology screening assistant.
            Your goal is to explain skin conditions in plain language and provide actionable next steps.
            
            RULES:
            1. Always identify as a screening assistant, NOT a doctor.
            2. CRITICAL: For the VERY FIRST message (when user hasn't spoken yet), you MUST read the "Context from Scan" below. Start your response by explicitly echoing back the body part scanned and the main findings (e.g., "I see you've scanned your face and I noticed some mild acne."). 
            3. After confirming the visual findings in that first message, immediately ask ONE highly targeted clinical question about POTENTIAL/HIDDEN symptoms that cannot be seen in the photo (e.g., "Does it itch or feel painful?", "How long have these spots been present?", "Is this happening anywhere else on your body?"). Do NOT ask generic branching questions.
            4. In subsequent messages, structure your advice and ask further questions if needed to narrow down the issue. 
            5. Once you have enough info, say "Analysis Complete:" and give final advice.
            6. Always recommend professional consultation for Moderate or High risk.
            7. Use plain language. Avoid jargon.
            
            Context from Scan: ${JSON.stringify(context || {})}
            
            DISCLAIMER: "This is a screening result, not a medical diagnosis. Consult a dermatologist."
        `;

        const formattedMessages = [
            { role: "system", content: systemInstruction },
            ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
        ];

        const response = await groq.chat.completions.create({
            model,
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: 512,
        });

        res.json({ reply: response.choices[0]?.message?.content || "I am currently offline." });
    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ error: 'Failed to generate chat response' });
    }
});

// 3. Final Risk Synthesis (/api/synthesize)
app.post('/api/synthesize', async (req, res) => {
    try {
        const { imageScore, metadata, chatHistory } = req.body;

        const model = "llama-3.3-70b-versatile";

        const demoInfo = metadata?.icData ? `Patient Profile: ${metadata.icData.age}yo ${metadata.icData.gender}.` : '';

        const synthesisPrompt = `
            Calculate a final risk probability (0-100) based on:
            1. Image Analysis Score: ${imageScore}
            2. Medical/Lifestyle Metadata: ${JSON.stringify(metadata)}
            3. ${demoInfo}
            4. Chat interactions: ${JSON.stringify(chatHistory || [])}
            
            CRITICAL RULES:
            - The "Image Analysis Score" is the baseline. 
            - If the Image Analysis Score is low (e.g. < 40) due to common blemishes or acne, DO NOT artificially inflate the finalScore. Keep it low (similar to the image score) unless the Chat interactions reveal severe, life-threatening symptoms.
            - Do not hallucinate high risks for young healthy adults with acne.
            
            Output ONLY a JSON object: { "finalScore": 15, "insight": "Reasoning..." }
        `;
        const response = await groq.chat.completions.create({
            model,
            messages: [{ role: "user", content: synthesisPrompt }],
            temperature: 0.2,
            max_tokens: 150,
            response_format: { type: "json_object" }
        });

        const rawJson = response.choices[0]?.message?.content || '{"finalScore": 50, "insight": "Unable to compute."}';
        const parsed = JSON.parse(rawJson);
        res.json(parsed);

    } catch (err) {
        console.error("Synthesis Error:", err);
        res.status(500).json({ error: 'Failed to synthesize data' });
    }
});

// ==========================================
// LEGACY CRUD ENDPOINTS
// ==========================================

// Create (Store arbitrary data)
app.post('/api/data', async (req, res) => {
    try {
        const { body } = req;
        const db = await dbPromise;

        // In SQLite/Postgres wrapper we serialize JSON payloads to strings
        const jsonData = JSON.stringify(body);
        const newRecord = await db.insert(jsonData);

        if (newRecord && newRecord.data) {
            newRecord.data = JSON.parse(newRecord.data);
        }

        res.status(201).json(newRecord);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while saving data' });
    }
});

// Read All
app.get('/api/data', async (req, res) => {
    try {
        const db = await dbPromise;
        const allData = await db.getAll();

        // Parse the stored JSON strings back into objects structure
        const parsed = allData.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));

        res.json(parsed);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching data' });
    }
});

// Read One by ID
app.get('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await dbPromise;
        const data = await db.getById(id);

        if (!data) {
            return res.status(404).json({ error: 'Data not found' });
        }

        data.data = JSON.parse(data.data);
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching specific data' });
    }
});

// Update
app.put('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const db = await dbPromise;

        const jsonData = JSON.stringify(body);
        const updateData = await db.update(id, jsonData);

        if (!updateData) {
            return res.status(404).json({ error: 'Data not found' });
        }

        if (updateData && updateData.data) {
            updateData.data = JSON.parse(updateData.data);
        }

        res.json(updateData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while updating data' });
    }
});

// Delete
app.delete('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await dbPromise;
        const changes = await db.deleteData(id);

        if (changes === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.json({ message: 'Data deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while deleting data' });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    // Check if dist was uploaded in the same folder (friendly for manual drag-and-drop)
    const distPath = fs.existsSync(path.join(__dirname, 'dist'))
        ? path.join(__dirname, 'dist')
        : path.join(__dirname, '../dist');

    app.use(express.static(distPath));

    // React Router catch-all
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});
