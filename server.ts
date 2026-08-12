import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenAI, Modality } from '@google/genai';

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get Public Cloudinary Config
  app.get('/api/cloudinary/config', (req, res) => {
    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      isConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET),
    });
  });

  // API Route: Generate Signed Upload Parameters
  // Security: NEVER expose API_SECRET on the client.
  app.post('/api/cloudinary/signature', (req, res) => {
    try {
      const { folder, timestamp: clientTimestamp, public_id, resource_type } = req.body;

      const timestamp = clientTimestamp || Math.round(new Date().getTime() / 1000);

      // Build parameters to sign
      const paramsToSign: Record<string, any> = {
        timestamp,
      };

      if (folder) paramsToSign.folder = folder;
      if (public_id) paramsToSign.public_id = public_id;

      let signature = '';
      if (apiSecret) {
        signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
      } else {
        // Fallback for development if secret not set yet
        signature = 'unsigned_demo_signature';
      }

      res.json({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
      });
    } catch (error: any) {
      console.error('Cloudinary signature error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate upload signature' });
    }
  });

  // API Route: Delete Media Asset Server-Side
  app.post('/api/cloudinary/delete', async (req, res) => {
    try {
      const { publicId, resourceType = 'image' } = req.body;

      if (!publicId) {
        return res.status(400).json({ error: 'publicId is required' });
      }

      if (!apiSecret) {
        return res.json({ success: true, message: 'Simulated delete (Cloudinary API Secret not set)' });
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete Cloudinary asset' });
    }
  });

  // API Route: ACP AI Chat Response using Gemini 3.6 Flash
  app.post('/api/acp/chat', async (req, res) => {
    try {
      const { prompt, history, systemInstruction, imageBase64, imageMimeType } = req.body;
      const geminiApiKey = process.env.GEMINI_API_KEY;

      if (!geminiApiKey) {
        return res.status(503).json({
          error: 'ACP AI is temporarily unavailable. Missing GEMINI_API_KEY.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const defaultSystemInstruction =
        systemInstruction ||
        'You are ACP AI, an intelligent, helpful, and friendly AI assistant built directly into HTTP CHAT. Answer clearly, formatted cleanly, using markdown when helpful. You act as a full contact and assistant in individual and group chats.';

      const contents: any[] = [];

      // Include previous history context (up to last 10 messages)
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history.slice(-10)) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text || '' }],
          });
        }
      }

      // Current prompt with optional image
      const userParts: any[] = [{ text: prompt || 'Hello' }];
      if (imageBase64) {
        userParts.unshift({
          inlineData: {
            mimeType: imageMimeType || 'image/jpeg',
            data: imageBase64,
          },
        });
      }

      contents.push({
        role: 'user',
        parts: userParts,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: defaultSystemInstruction,
        },
      });

      res.json({
        reply: response.text || "I'm sorry, I couldn't generate a response.",
      });
    } catch (error: any) {
      console.error('ACP AI Gemini Error:', error);
      res.status(500).json({ error: error.message || 'Failed to process ACP AI request' });
    }
  });

  // API Route: ACP AI Text-to-Speech synthesis using Gemini TTS
  app.post('/api/acp/tts', async (req, res) => {
    try {
      const { text, voiceName = 'Zephyr' } = req.body;
      const geminiApiKey = process.env.GEMINI_API_KEY;

      if (!geminiApiKey || !text) {
        return res.status(400).json({ error: 'Text and GEMINI_API_KEY are required' });
      }

      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audioBase64: base64Audio, mimeType: 'audio/pcm' });
      } else {
        res.status(500).json({ error: 'No audio generated by TTS model' });
      }
    } catch (error: any) {
      console.error('ACP AI TTS Error:', error);
      res.status(500).json({ error: error.message || 'TTS synthesis failed' });
    }
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP CHAT Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
