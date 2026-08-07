/**
 * AI Article Optimization Service
 * Calls a Vercel serverless function that securely proxies
 * to the Gemini Flash-Lite API. The API key is stored as a
 * Vercel environment variable — never exposed client-side.
 */

// The Vercel deployment URL — set via VITE_VERCEL_API_URL in .env
// Falls back to relative path (only works if hosted on Vercel itself)
const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL || '';

export const optimizeArticle = async (text, title = '', category = '') => {
  if (!text || !text.trim()) {
    throw new Error("Please enter some article text to optimize.");
  }

  const endpoint = `${API_BASE_URL}/api/optimize-article`;

  try {
    console.log('[AI Service] Sending optimization request to:', endpoint);

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

    // Read the raw response text first so we can handle non-JSON errors
    const rawText = await response.text();
    console.log('[AI Service] Response status:', response.status, '| Length:', rawText.length);

    // Attempt to parse the response as JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      // The server returned something that isn't JSON (e.g. HTML error page)
      console.error('[AI Service] Non-JSON response received:', rawText.substring(0, 500));
      throw new Error(
        `The AI server returned an unexpected response (status ${response.status}). ` +
        `This may be a temporary issue — please try again in a moment.`
      );
    }

    // Handle HTTP error status codes with the parsed JSON error message
    if (!response.ok) {
      const errorMsg = data.error || `AI optimization request failed (status ${response.status})`;
      console.error('[AI Service] API error:', errorMsg);
      throw new Error(errorMsg);
    }

    // Validate that we got actual content back
    if (!data.improvedText) {
      console.error('[AI Service] Empty response payload:', data);
      throw new Error("AI service returned an empty response. Please try again.");
    }

    let improvedText = data.improvedText.trim();

    // Clean up any lingering markdown code block formatting
    if (improvedText.startsWith('```')) {
      improvedText = improvedText.replace(/^```[a-z]*\n?/i, '');
      improvedText = improvedText.replace(/\n?```$/i, '');
    }

    console.log('[AI Service] Optimization successful. Output length:', improvedText.length);
    return improvedText.trim();
  } catch (error) {
    // Network errors (offline, DNS failure, CORS block, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[AI Service] Network/CORS error:', error);
      throw new Error(
        'Could not reach the AI optimization server. Please check your internet connection and try again.'
      );
    }

    // Re-throw errors we already formatted above
    console.error('[AI Service] Optimization failed:', error);
    throw new Error(error.message || 'Failed to optimize article. Please try again.');
  }
};
