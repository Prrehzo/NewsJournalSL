export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { text, title = '', category = '' } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Article text is required.' });
    }

    // Retrieve API key securely from server-side environment variable
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY environment variable is missing on Vercel server configuration.' 
      });
    }

    const systemPrompt = `You are a professional school news editor.

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

    // Priority model list starting with Gemini Flash-Lite
    const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;
    let improvedText = null;

    for (const model of models) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\n${userPrompt}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192
            }
          })
        });

        const data = await response.json();

        if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          improvedText = data.candidates[0].content.parts[0].text;
          break; // Successfully generated content
        } else {
          lastError = data.error?.message || `Status ${response.status} from ${model}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!improvedText) {
      return res.status(502).json({ 
        error: `Gemini API call failed: ${lastError || 'Unable to generate response'}` 
      });
    }

    // Clean up code block ticks if returned by AI
    improvedText = improvedText.trim();
    if (improvedText.startsWith('```')) {
      improvedText = improvedText.replace(/^```[a-z]*\n?/i, '');
      improvedText = improvedText.replace(/\n?```$/i, '');
    }

    return res.status(200).json({ improvedText: improvedText.trim() });
  } catch (error) {
    console.error('Vercel function execution error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
