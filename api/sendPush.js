// api/sendPush.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Expecting title, schoolName, and url
  const { title, schoolName, url } = req.body;

  if (!title || !schoolName) {
    return res.status(400).json({ error: 'Missing title or schoolName' });
  }

  const onesignalAppId = 'a521bf18-01a8-43d3-b3bb-06d0b8f8bd22';
  const onesignalRestApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!onesignalRestApiKey) {
    console.error('Missing ONESIGNAL_REST_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const notification = {
    app_id: onesignalAppId,
    // Target all subscribers
    included_segments: ['Subscribed Users'],
    headings: {
      en: `${schoolName} published a new article`
    },
    contents: {
      en: title
    },
    url: url || 'https://newsjournalsl.web.app', // Default URL if none provided
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${onesignalRestApiKey}`
      },
      body: JSON.stringify(notification)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OneSignal API Error:', data);
      return res.status(response.status).json({ error: 'Failed to send push notification', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error calling OneSignal:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
