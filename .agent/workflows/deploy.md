---
description: Deploy News Journal SL to Firebase Hosting
---

Follow these steps to deploy your application to the web:

1. **Install Firebase CLI** (if you haven't already):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Hosting**:
   Run this command and follow the prompts:
   ```bash
   firebase init hosting
   ```
   - **Public directory**: Set to `dist`
   - **Single-page app**: Yes (Configure as a single-page app)
   - **GitHub actions**: Optional (User choice)

4. **Create Production Build**:
   ```bash
   npm run build
   ```

5. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

Your app will be live at `https://newsjournalsl.web.app` (or similar, depending on your Firebase project ID).
