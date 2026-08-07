import { GoogleGenerativeAI } from "@google/generative-ai";

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
  console.log('[Vercel Gemini Function] Received article optimization request.');

  try {
    const { text, title = '', category = '' } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      console.warn('[Vercel Gemini Function] Request rejected: missing article text.');
      return res.status(400).json({
        success: false,
        error: 'Article text is required for optimization.'
      });
    }

    // Retrieve Gemini API key exclusively from server-side process.env.GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Vercel Gemini Function] Error: GEMINI_API_KEY environment variable is not set.');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: GEMINI_API_KEY environment variable is missing on Vercel.'
      });
    }

    console.log(`[Vercel Gemini Function] Processing article (${text.length} chars) | Title: "${title}" | Category: "${category}"`);

    // Official @google/generative-ai SDK syntax
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const systemInstruction = `You are a professional school news editor.

Your job is to improve student-written school articles.

STRICT RULES:
- Do NOT change facts or core meaning
- Do NOT add new unverified information
- Do NOT remove important details
- Fix grammar, spelling, punctuation, spacing, paragraph structure, and typos
- Keep simple English suitable for secondary school students in Sierra Leone
- Maintain a clear school journalism tone
- Do NOT make it sound like advertising or creative fiction
- STRICTLY PRESERVE original formatting and paragraphing structure
- NEVER combine separate paragraphs unless fixing a broken sentence

Return ONLY the improved article text. Do not include markdown code block syntax like \`\`\` or introductory text like "Here is your edited article:".`;

    const userPrompt = `ARTICLE TITLE: ${title}
ARTICLE CATEGORY: ${category}

ARTICLE TEXT:
${text}`;

    const promptText = `${systemInstruction}\n\n${userPrompt}`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    let improvedText = response.text();

    if (!improvedText || !improvedText.trim()) {
      console.error('[Vercel Gemini Function] Model returned empty text.');
      return res.status(502).json({
        success: false,
        error: 'Gemini model returned an empty text response.'
      });
    }

    improvedText = improvedText.trim();
    if (improvedText.startsWith('```')) {
      improvedText = improvedText.replace(/^```[a-z]*\n?/i, '');
      improvedText = improvedText.replace(/\n?```$/i, '');
      improvedText = improvedText.trim();
    }

    const processingTimeMs = Date.now() - startTime;
    console.log(`[Vercel Gemini Function] Optimization success using ${modelName} in ${processingTimeMs}ms.`);

    return res.status(200).json({
      success: true,
      improvedText,
      modelUsed: modelName,
      processingTimeMs
    });
  } catch (error) {
    console.error('[Vercel Gemini Function] Server error during optimization:', error);
    let errorMessage = error.message || 'Internal server error during article optimization.';
    if (errorMessage.includes('429') || errorMessage.includes('Quota exceeded')) {
      errorMessage = 'Gemini API quota exceeded for this API key. Please check your Google AI Studio quota or billing details.';
    }
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
