export const optimizeArticle = async (text, title = '', category = '') => {
  const prompt = `You are a professional school news editor.

Your job is to improve student-written school articles.

STRICT RULES:
- Do NOT change facts or meaning
- Do NOT add new information
- Do NOT remove important details
- Only improve grammar, spelling, sentence structure, and clarity
- Keep simple English suitable for secondary school students in Sierra Leone
- Maintain a journalistic tone
- Do NOT make it sound like advertising or creative writing
- STRICTLY PRESERVE the original structure, paragraphing, and formatting. 
- NEVER combine separate paragraphs into one.
- NEVER split a single paragraph into multiple ones.
- Keep the exact same number of line breaks between sections.

Return ONLY the improved article text. Do not include markdown formatting like \`\`\` or "Here is the improved article".`;

  const userContent = `ARTICLE TITLE: ${title}
ARTICLE CATEGORY: ${category}

ARTICLE TEXT:
${text}`;

  try {
    // We are using a free, no-API-key required text generation endpoint (Pollinations AI)
    // This solves all Gemini "quota exceeded" and "model not found" errors automatically.
    const url = 'https://text.pollinations.ai/';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userContent }
        ],
        // Enforce the openai model to avoid reasoning models (which output weird JSON)
        model: 'openai',
        jsonMode: false,
        // Set parameters for better journalistic formatting
        temperature: 0.3,
        seed: 42 
      })
    });

    if (!response.ok) {
      throw new Error(`AI API returned status ${response.status}`);
    }

    // Pollinations AI returns the raw text response directly or sometimes JSON depending on the model
    let improvedText = await response.text();

    if (!improvedText) {
      throw new Error("AI returned an empty response.");
    }

    // Sometimes the AI returns a JSON string like {"role":"assistant","content":"..."}
    try {
      const parsedJSON = JSON.parse(improvedText);
      if (parsedJSON.content) {
        improvedText = parsedJSON.content;
      } else if (parsedJSON.response) {
        improvedText = parsedJSON.response;
      } else if (parsedJSON.choices && parsedJSON.choices[0] && parsedJSON.choices[0].message) {
        improvedText = parsedJSON.choices[0].message.content;
      }
    } catch (e) {
      // It's just plain text, which is fine!
    }

    // Clean up potential markdown formatting that AI sometimes includes
    if (improvedText.startsWith('```')) {
      improvedText = improvedText.replace(/```[a-z]*\n?/i, '');
      improvedText = improvedText.replace(/```\s*$/, '');
    }

    return improvedText.trim();
  } catch (error) {
    console.error(`AI optimization failed:`, error);
    throw new Error(`Failed to optimize article: ${error.message}. Please check your internet connection or try again later.`);
  }
};
