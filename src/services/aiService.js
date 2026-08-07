/**
 * AI Article Optimization Service
 * Calls the Vercel serverless function proxied to Google's official @google/generative-ai SDK.
 * The Gemini API key is stored securely in Vercel environment variables.
 */

const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL || '';

export const optimizeArticle = async (text, title = '', category = '') => {
  if (!text || !text.trim()) {
    throw new Error("Please enter some article text before optimizing.");
  }

  const endpoint = `${API_BASE_URL}/api/optimize-article`;

  try {
    console.log('[AI Service] Initiating optimization request to:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text,
        title,
        category
      })
    });

    const rawText = await response.text();
    console.log(`[AI Service] HTTP ${response.status} response received. Length: ${rawText.length}`);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[AI Service] Non-JSON response received:', rawText.substring(0, 500));
      throw new Error(
        `The AI optimization server returned an invalid response format (HTTP ${response.status}). ` +
        `Please check your network connection and try again.`
      );
    }

    if (!response.ok || !data.success) {
      const errorMessage = data.error || `AI optimization failed with status ${response.status}`;
      console.error('[AI Service] Optimization error:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!data.improvedText) {
      console.error('[AI Service] Response missing improvedText field:', data);
      throw new Error("AI service returned an empty text response. Please try again.");
    }

    let improvedText = data.improvedText.trim();

    // Clean up code block formatting if present
    if (improvedText.startsWith('```')) {
      improvedText = improvedText.replace(/^```[a-z]*\n?/i, '');
      improvedText = improvedText.replace(/\n?```$/i, '');
      improvedText = improvedText.trim();
    }

    console.log(
      `[AI Service] Optimization success using ${data.modelUsed || 'Gemini'} ` +
      `(${data.processingTimeMs || '?'}ms). Output length: ${improvedText.length} chars.`
    );

    return improvedText;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[AI Service] Network / CORS error:', error);
      throw new Error(
        'Unable to reach the AI optimization service. Please check your internet connection and try again.'
      );
    }

    console.error('[AI Service] Article optimization error:', error);
    throw new Error(error.message || 'Failed to optimize article. Please try again.');
  }
};
