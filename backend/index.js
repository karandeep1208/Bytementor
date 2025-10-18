  // index.js
  const express = require('express');
  const cors = require('cors');
  const axios = require('axios');
  const PDFDocument = require('pdfkit');
  require('dotenv').config();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Environment validation
  if (!process.env.GEMINI_API_KEY) console.warn('⚠️ Warning: GEMINI_API_KEY not found');
  if (!process.env.YOUTUBE_API_KEY) console.warn('⚠️ Warning: YOUTUBE_API_KEY not found');

  // Root route
  app.get('/', (req, res) => {
    res.send('<h1>🚀 Welcome to ByteMentor API!</h1><p>Use /api/generate-course to generate courses.</p>');
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'ByteMentor API running' });
  });

  // Main route
  app.post('/api/generate-course', async (req, res) => {
    const { keyword } = req.body;
    if (!keyword || !keyword.trim()) return res.status(400).json({ error: 'Keyword is required' });

    console.log(`Generating course for keyword: ${keyword}`);

    try {
      const [quiz, summary, videos, bonusTip] = await Promise.all([
        generateQuiz(keyword),
        generateSummary(keyword),
        fetchYouTubeVideos(keyword),
        generateBonusTip(keyword),
      ]);

      res.json({
        keyword,
        quiz,
        summary,
        videos,
        bonusTip,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('❌ Course generation failed:', err.message);
      res.status(500).json({ error: 'Failed to generate course', details: err.message });
    }
  });

  // Endpoint to generate a PDF from provided text
  app.post('/api/generate-pdf', async (req, res) => {
    try {
      const { text, filename } = req.body || {};
      if (!text) return res.status(400).json({ error: 'Text is required' });

      const safeFilename = (filename || 'cheatsheet.pdf').replace(/[^a-zA-Z0-9_\-.]/g, '_');
      const pdfBase64 = await createPdfFromText(text, safeFilename);
      return res.json({ filename: safeFilename, data: pdfBase64 });
    } catch (err) {
      console.error('❌ /api/generate-pdf error:', err.message || err);
      return res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
    }
  });

  // --- Gemini Helpers ---
  async function generateQuiz(keyword) {
    if (!process.env.GEMINI_API_KEY) return buildFallbackQuiz(keyword);

    const prompt = `
  You are an expert educator. Generate exactly 5 quiz questions about "${keyword}".
  Return ONLY JSON:
  {
    "questions": [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Why this answer is correct"
      }
    ]
  }
  `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const { data } = await axios.post(
        url,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: 'application/json', temperature: 0.7 } },
        { timeout: 30000 }
      );

      const raw = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
      const parsed = safeParseJSON(raw);
      if (parsed?.questions && Array.isArray(parsed.questions)) return { questions: parsed.questions.slice(0, 5) };

      return buildFallbackQuiz(keyword);
    } catch (err) {
      console.error('❌ Gemini quiz error:', err.message);
      return buildFallbackQuiz(keyword);
    }
  }

  async function generateSummary(keyword) {
    if (!process.env.GEMINI_API_KEY) return await buildFallbackSummary(keyword);

    const prompt = `
  Create a plain text study guide for "${keyword}". Do not use any markdown, special characters, or formatting symbols.
  Use only numbers for lists.`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const { data } = await axios.post(
        url,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: 'text/plain', temperature: 0.7, topK: 40, topP: 0.8, maxOutputTokens: 2048 } },
        { timeout: 30000 }
      );

      const raw = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (raw) {
        try {
          const filename = `${keyword.replace(/\s+/g, '_')}_study_guide.pdf`;
          const pdfBase64 = await createPdfFromText(raw, filename);
          return { cheatSheet: raw, cheatSheetPdf: { filename, data: pdfBase64 } };
        } catch {
          return { cheatSheet: raw };
        }
      }
      return buildFallbackSummary(keyword);
    } catch {
      return buildFallbackSummary(keyword);
    }
  }

  async function generateBonusTip(keyword) {
    if (!process.env.GEMINI_API_KEY) return `💡 Tip: Consistently practice ${keyword} concepts with hands-on exercises.`;

    const prompt = `Give a short, actionable bonus learning tip for mastering "${keyword}". Format: one clear sentence.`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const { data } = await axios.post(
        url,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: 'text/plain', temperature: 0.7 } },
        { timeout: 15000 }
      );

      const tip = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      return tip || `💡 Tip: Consistently practice ${keyword} concepts with hands-on exercises.`;
    } catch {
      return `💡 Tip: Consistently practice ${keyword} concepts with hands-on exercises.`;
    }
  }

  async function fetchYouTubeVideos(keyword) {
    if (!process.env.YOUTUBE_API_KEY) return [];
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', q: `${keyword} tutorial`, type: 'video', maxResults: 5, key: process.env.YOUTUBE_API_KEY },
      });
      return res.data.items.map((item) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle,
      }));
    } catch {
      return [];
    }
  }

  // --- Fallbacks ---
  async function buildFallbackSummary(keyword) {
    const cheatSheet = formatSummary(keyword);
    try {
      const filename = `${keyword.replace(/\s+/g, '_')}_guide.pdf`;
      const pdfBase64 = await createPdfFromText(cheatSheet, filename);
      return { cheatSheet, cheatSheetPdf: { filename, data: pdfBase64 } };
    } catch {
      return { cheatSheet };
    }
  }

  function buildFallbackQuiz(keyword) {
    return {
      questions: Array.from({ length: 5 }).map((_, i) => ({
        question: `${keyword} fallback question ${i + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Correct answer is Option A',
      })),
    };
  }

  function formatSummary(keyword) {
    return `${keyword.toUpperCase()} QUICK REFERENCE GUIDE\n\nIntroduction and key points about ${keyword}.`;
  }

  // PDF generator
  async function createPdfFromText(text, filename = 'cheatsheet.pdf') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ autoFirstPage: true });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
        doc.fontSize(12).text(text, { align: 'left' });
        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  // Safe JSON parser
  function safeParseJSON(text) {
    if (!text) return null;
    try {
      let cleaned = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 ByteMentor API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });