// server.js
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ByteMentor API running' });
});

// Main route
app.post('/api/generate-course', async (req, res) => {
  const { keyword } = req.body;
  if (!keyword || !keyword.trim()) return res.status(400).json({ error: 'Keyword is required' });

  console.log(`⚙️ Generating course for keyword: ${keyword}`);

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

// Endpoint to generate a PDF from provided text (used by frontend fallback)
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
    console.log('🔹 Sending request to Gemini API for quiz:', keyword);

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
Format your response exactly like this example:

${keyword.toUpperCase()} STUDY GUIDE

WHAT IS ${keyword.toUpperCase()}?
A brief plain text description without any special formatting.

CORE CONCEPTS
1. Basic concept one explained in plain text
2. Basic concept two explained in plain text
3. Basic concept three explained in plain text

MAIN COMPONENTS
1. First component description
2. Second component description
3. Third component description

SYNTAX AND USAGE
1. Basic syntax example
2. Common usage pattern
3. Standard implementation

BEST PRACTICES
1. First best practice explained simply
2. Second best practice explained simply
3. Third best practice explained simply

CODE EXAMPLE
[Simple code example without any special formatting]

COMMON MISTAKES
1. First mistake and solution
2. Second mistake and solution
3. Third mistake and solution

LEARNING RESOURCES
1. First resource
2. Second resource
3. Third resource

Use only numbers for lists. No asterisks, no markdown, no special characters.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    console.log('🔹 Sending request to Gemini API for study guide:', keyword);

    const { data } = await axios.post(
      url,
      { 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { 
          response_mime_type: 'text/plain',
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        } 
      },
      { timeout: 30000 }
    );

    const raw = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (raw) {
      try {
        const filename = `${keyword.replace(/\s+/g, '_')}_study_guide.pdf`;
        const pdfBase64 = await createPdfFromText(raw, filename);
        return { cheatSheet: raw, cheatSheetPdf: { filename, data: pdfBase64 } };
      } catch (pdfErr) {
        console.error('❌ PDF generation error:', pdfErr.message || pdfErr);
        return { cheatSheet: raw };
      }
    }

    return buildFallbackSummary(keyword);
  } catch (err) {
    console.error('❌ Gemini summary error:', err.message);
    return buildFallbackSummary(keyword);
  }
}

function formatSummary(keyword) {
  return `${keyword.toUpperCase()} QUICK REFERENCE GUIDE

INTRODUCTION
A comprehensive overview of ${keyword} and its core features.

KEY CONCEPTS
1. Definition and Fundamentals
   What ${keyword} is and its main purpose
   Core features and capabilities
   Basic architecture and design

2. Main Components
   Essential building blocks
   Key libraries and tools
   Standard implementations

3. Working Principles
   How ${keyword} operates
   Basic workflows
   Common patterns

SYNTAX AND USAGE
1. Basic Syntax
   Standard format and structure
   Common commands and operations
   Basic examples

2. Advanced Features
   Extended capabilities
   Complex operations
   Performance considerations

BEST PRACTICES
1. Code Organization
   Structure your code properly
   Follow naming conventions
   Maintain clean architecture

2. Performance Tips
   Optimize your code
   Handle resources efficiently
   Avoid common bottlenecks

3. Security Considerations
   Protect your applications
   Handle sensitive data
   Implement proper validation

CODE EXAMPLES

Basic Implementation:
[Code example showing basic usage]

Advanced Pattern:
[Code example demonstrating complex feature]

COMMON MISTAKES TO AVOID
1. Poor error handling
   Always implement proper error checking
   Use try-catch blocks where appropriate

2. Memory management issues
   Clean up resources properly
   Use appropriate data structures

3. Security vulnerabilities
   Validate all inputs
   Protect sensitive information

LEARNING RESOURCES
1. Official Documentation
2. Community Forums
3. Practice Platforms
4. Tutorial Websites
5. Code Examples
6. Reference Books`;
}

// Bonus learning tip
async function generateBonusTip(keyword) {
  if (!process.env.GEMINI_API_KEY) return `💡 Tip: Consistently practice ${keyword} concepts with hands-on exercises.`;

  const prompt = `
Give a short, actionable bonus learning tip for mastering "${keyword}".
Format: one clear sentence.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const { data } = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: 'text/plain', temperature: 0.7 } },
      { timeout: 15000 }
    );

    const tip = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return tip || `💡 Tip: Consistently practice ${keyword} concepts with hands-on exercises.`;
  } catch (err) {
    console.error('❌ Gemini bonus tip error:', err.message);
    return `💡 Tip: Consistently practice ${keyword} concepts with hands-on exercises.`;
  }
}

// --- YouTube Helper ---
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
  } catch (err) {
    console.error('❌ YouTube fetch error:', err.message);
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
  } catch (e) {
    console.error('❌ Fallback PDF generation error:', e.message || e);
    return { cheatSheet };
  }
}

// Helper function to format the summary content
function formatSummary(keyword) {
  return `${keyword.toUpperCase()} QUICK REFERENCE GUIDE

INTRODUCTION
A comprehensive overview of ${keyword} and its core features.

KEY CONCEPTS
1. Definition and Fundamentals
   What ${keyword} is and its main purpose
   Core features and capabilities
   Basic architecture and design

2. Main Components
   Essential building blocks
   Key libraries and tools
   Standard implementations

3. Working Principles
   How ${keyword} operates
   Basic workflows
   Common patterns

SYNTAX AND USAGE
1. Basic Syntax
   Standard format and structure
   Common commands and operations
   Basic examples

2. Advanced Features
   Extended capabilities
   Complex operations
   Performance considerations

BEST PRACTICES
1. Code Organization
   Structure your code properly
   Follow naming conventions
   Maintain clean architecture

2. Performance Tips
   Optimize your code
   Handle resources efficiently
   Avoid common bottlenecks

3. Security Considerations
   Protect your applications
   Handle sensitive data
   Implement proper validation

CODE EXAMPLES

Basic Implementation:
[Code example showing basic usage]

Advanced Pattern:
[Code example demonstrating complex feature]

COMMON MISTAKES TO AVOID
1. Poor error handling
   Always implement proper error checking
   Use try-catch blocks where appropriate

2. Memory management issues
   Clean up resources properly
   Use appropriate data structures

3. Security vulnerabilities
   Validate all inputs
   Protect sensitive information

LEARNING RESOURCES
1. Official Documentation
2. Community Forums
3. Practice Platforms
4. Tutorial Websites
5. Code Examples
6. Reference Books`;
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

// Enhanced PDF generator with proper styling
async function createPdfFromText(text, filename = 'cheatsheet.pdf') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        autoFirstPage: false,
        bufferPages: true,
        font: 'Helvetica'
      });
      
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer.toString('base64'));
        } catch (e) {
          reject(e);
        }
      });

      // Add first page with title
      doc.addPage({ size: 'A4', margin: 50 });
      
      // Title
      const title = filename.replace(/_/g, ' ').replace('.pdf', '');
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#2c3e50')
         .text(title.toUpperCase(), { align: 'center' });
      
      doc.moveDown(2);

      // Process text content by sections
      const sections = text.split('\n\n');
      
      sections.forEach((section) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage({ size: 'A4', margin: 50 });
        }

        const lines = section.split('\n');
        const title = lines[0];
        const content = lines.slice(1);

        // Section title
        if (title.trim()) {
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .fillColor('#2c3e50')
             .text(title.trim())
             .moveDown(0.5);
        }

        // Section content
        content.forEach(line => {
          const trimmedLine = line.trim();
          
          // Code block
          if (trimmedLine.startsWith('//') || trimmedLine.includes('function') || trimmedLine.includes('const')) {
            doc.font('Courier')
               .fontSize(10)
               .fillColor('#16a085')
               .text(trimmedLine, {
                 width: 500,
                 align: 'left',
                 indent: 20
               })
               .moveDown(0.2);
          }
          // Bullet point
          else if (trimmedLine.startsWith('•')) {
            doc.font('Helvetica')
               .fontSize(11)
               .fillColor('#34495e')
               .text(trimmedLine, {
                 width: 500,
                 align: 'left',
                 indent: 10
               })
               .moveDown(0.2);
          }
          // Regular text
          else if (trimmedLine) {
            doc.font('Helvetica')
               .fontSize(11)
               .fillColor('#34495e')
               .text(trimmedLine, {
                 width: 500,
                 align: 'left'
               })
               .moveDown(0.2);
          }
        });
        
        doc.moveDown(0.5);
      });

      // Add page numbers
      let pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#95a5a6')
           .text(
             `Page ${i + 1} of ${pages.count}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// --- Safe JSON parser ---
function safeParseJSON(text) {
  if (!text) return null;
  try {
    let cleaned = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ByteMentor API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});