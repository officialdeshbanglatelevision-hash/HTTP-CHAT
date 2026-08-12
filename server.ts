import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenAI, Modality } from '@google/genai';
import admin from 'firebase-admin';

if (!(admin as any).apps?.length) {
  try {
    admin.initializeApp({
      projectId: 'http-chat-c63f5',
    });
  } catch (e) {
    console.warn('Firebase Admin init warning:', e);
  }
}

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

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents,
          config: {
            systemInstruction: defaultSystemInstruction,
          },
        });
      } catch (geminiError: any) {
        // Fallback to gemini-2.5-flash if 3.6-flash exceeds quota/rate limit
        if (geminiError?.message?.includes('resource_exhausted') || geminiError?.status === 429) {
          console.warn('Gemini 3.6 Flash rate limited. Attempting fallback model gemini-2.5-flash...');
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
              systemInstruction: defaultSystemInstruction,
            },
          });
        } else {
          throw geminiError;
        }
      }

      res.json({
        reply: response.text || "I'm sorry, I couldn't generate a response.",
      });
    } catch (error: any) {
      console.error('ACP AI Gemini Error:', error);
      const isQuota = error?.message?.includes('resource_exhausted') || error?.status === 429;
      const userMessage = isQuota
        ? 'ACP AI is currently under high demand (API quota/rate limit reached). Please wait a moment and try again.'
        : error.message || 'Failed to process ACP AI request';
      res.status(500).json({ error: userMessage });
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

  // API Route: Test FCM Push Notification (End-to-End Verification)
  app.post('/api/notifications/test', async (req, res) => {
    try {
      const { uid, token, chatId } = req.body;
      if (!uid || !token) {
        return res.status(400).json({ success: false, failurePoint: 'token_registration', error: 'uid and token are required' });
      }

      const db = (admin as any).firestore();
      
      // 1. Check user notification preferences
      let prefs: any = null;
      try {
        const prefSnap = await db.doc(`users/${uid}/settings/notifications`).get();
        if (prefSnap.exists) {
          prefs = prefSnap.data();
        }
      } catch (e) {
        console.warn('Could not fetch preferences for test:', e);
      }

      // 2. Check chat mute status if chatId provided
      let isMuted = false;
      if (chatId) {
        try {
          const chatSnap = await db.doc(`chats/${chatId}`).get();
          if (chatSnap.exists) {
            const chatData = chatSnap.data();
            if (chatData?.mutedBy && Array.isArray(chatData.mutedBy) && chatData.mutedBy.includes(uid)) {
              isMuted = true;
            }
          }
        } catch (e) {
          console.warn('Could not fetch chat mute status for test:', e);
        }
      }

      if (isMuted) {
        return res.json({
          success: false,
          failurePoint: 'backend_trigger',
          reason: 'Chat is muted by user. Notification suppressed per mute preferences.',
        });
      }

      // 3. Attempt FCM send
      let messageBody = 'This is a verified test push notification from HTTP CHAT.';
      if (prefs && prefs.messagePreview === false) {
        messageBody = 'New message';
      }

      const message = {
        token,
        notification: {
          title: 'HTTP CHAT Test Push',
          body: messageBody,
        },
        data: {
          type: 'TEST_PUSH',
          recipientUid: uid,
          url: chatId ? `/chat/${chatId}` : '/',
        },
      };

      try {
        const responseId = await (admin as any).messaging().send(message);
        return res.json({
          success: true,
          messageId: responseId,
          preferencesChecked: prefs || { default: 'all enabled' },
          chatMuted: isMuted,
        });
      } catch (fcmError: any) {
        console.error('FCM Send Error:', fcmError);
        return res.status(500).json({
          success: false,
          failurePoint: 'fcm_send',
          error: fcmError.message || 'Failed to send FCM push notification',
          code: fcmError.code,
        });
      }
    } catch (error: any) {
      console.error('Notification Test API Error:', error);
      res.status(500).json({ success: false, failurePoint: 'backend_trigger', error: error.message });
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
