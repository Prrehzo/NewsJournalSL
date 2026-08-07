export const optimizeArticle = async (text, title = '', category = '') => {
  if (!text || !text.trim()) {
    throw new Error("Please enter some article text to optimize.");
  }

  try {
    const response = await fetch('/api/optimize-article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        title,
        category
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `AI optimization request failed with status ${response.status}`);
    }

    if (!data.improvedText) {
      throw new Error("AI service returned an empty response.");
    }

    let improvedText = data.improvedText.trim();

    // Clean up any lingering markdown code block formatting
    if (improvedText.startsWith('```')) {
      improvedText = improvedText.replace(/^```[a-z]*\n?/i, '');
      improvedText = improvedText.replace(/\n?```$/i, '');
    }

    return improvedText.trim();
  } catch (error) {
    console.error('AI optimization failed:', error);
    throw new Error(error.message || 'Failed to optimize article. Please try again.');
  }
};
