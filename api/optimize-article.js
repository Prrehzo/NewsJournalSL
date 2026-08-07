import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Always enforce JSON content type and CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const startTime = Date.now();
  console.log('[Vercel Gemini API] Processing optimization request...');

  try {
    const { text, title = '', category = '' } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      console.warn('[Vercel Gemini API] Rejected request: missing article text.');
      return res.status(400).json({
        success: false,
        error: 'Article text is required for AI optimization.'
      });
    }

    // Retrieve Gemini API key from Vercel environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Vercel Gemini API] Error: GEMINI_API_KEY environment variable is not configured.');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: GEMINI_API_KEY environment variable is not set in Vercel.'
      });
    }

    console.log(`[Vercel Gemini API] Input size: ${text.length} chars | Title: "${title}" | Category: "${category}"`);

    // Initialize Google Generative AI client using official SDK
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemInstruction = `You are a professional school news editor.

Your job is to improve student-written school articles.

STRICT RULES:
- Do NOT change facts or core meaning
- Do NOT add new unverified information
- Do NOT remove important details
- Fix grammar, spelling, spacing, paragraph structure, and typos
- Keep simple English suitable for secondary school students in Sierra Leone
- Maintain a clear journalistic tone
- Do NOT make it sound like advertising or creative fiction
- STRICTLY PRESERVE original formatting and paragraphing structure
- NEVER combine separate paragraphs unless fixing a broken sentence

Return ONLY the improved article text. Do not include markdown code block syntax like \`\`\` or introductory text like "Here is your edited article:".`;

    const userPrompt = `ARTICLE TITLE: ${title}
ARTICLE CATEGORY: ${category}

ARTICLE TEXT:
${text}`;

    const promptText = `${systemInstruction}\n\n${userPrompt}`;

    // Modern candidate models to attempt in order of performance and availability
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-1.5-pro'
    ];

    let improvedText = null;
    let successfulModel = null;
    let lastErrorDetails = [];

    for (const modelName of candidateModels) {
      try {
        console.log(`[Vercel Gemini API] Attempting generation with model: ${modelName}...`);
        const model = genAI.getGenerativeAIModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        });

        const response = await result.response;
        const candidateText = response.text();

        if (candidateText && candidateText.trim().length > 0) {
          improvedText = candidateText.trim();
          successfulModel = modelName;
          console.log(`[Vercel Gemini API] Success using model "${modelName}" in ${Date.now() - startTime}ms.`);
          break;
        } else {
          console.warn(`[Vercel Gemini API] Model "${modelName}" returned empty text.`);
          lastErrorDetails.push(`${modelName}: empty text response`);
        }
      } catch (modelErr) {
        const errMsg = modelErr.message || String(modelErr);
        console.error(`[Vercel Gemini API] Model "${modelName}" failed:`, errMsg);
        lastErrorDetails.push(`${modelName}: ${errMsg}`);
      }
    }

    if (!improvedText) {
      console.error('[Vercel Gemini API] All candidate models failed:', lastErrorDetails);
      return res.status(502).json({
        success: false,
        error: `Gemini API call failed: ${lastErrorDetails.join(' | ')}`
      });
    }

    // Clean up code block ticks if returned by AI
    if (improvedText.startsWith('```')) {
      improvedText = improvedText.replace(/^```[a-z]*\n?/i, '');
      improvedText = improvedText.replace(/\n?```$/i, '');
      improvedText = improvedText.trim();
    }

    return res.status(200).json({
      success: true,
      improvedText,
      modelUsed: successfulModel,
      processingTimeMs: Date.now() - startTime
    });
  } catch (error) {
    console.error('[Vercel Gemini API] Unhandled server error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during article optimization.'
    });
  }
}
