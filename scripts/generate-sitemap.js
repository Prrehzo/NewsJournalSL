import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// This script generates a dynamic sitemap.xml by fetching articles from Firestore.
// Run it before deployment: node scripts/generate-sitemap.js

const firebaseConfig = {
  apiKey: "AIzaSyDD75YDuvegRyuaglsNPsw5nO6b4rVSwSQ",
  authDomain: "newsjournalsl.firebaseapp.com",
  projectId: "newsjournalsl",
  storageBucket: "newsjournalsl.firebasestorage.app",
  messagingSenderId: "25470382079",
  appId: "1:25470382079:web:2aad0d43d8e710a6b8c1ca",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE_URL = 'https://newsjournalsl.web.app';

async function generateSitemap() {
  console.log('Generating sitemap...');
  
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/about', priority: 0.8, changefreq: 'monthly' },
    { url: '/schools', priority: 0.8, changefreq: 'weekly' },
    { url: '/categories', priority: 0.7, changefreq: 'weekly' },
    { url: '/register-school', priority: 0.5, changefreq: 'monthly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `
  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // Fetch articles
  try {
    const articlesRef = collection(db, 'articles');
    const q = query(articlesRef, where('status', '==', 'published'));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      xml += `
  <url>
    <loc>${BASE_URL}/article/${doc.id}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
  }

  xml += `
</urlset>`;

  const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, xml);
  console.log(`Sitemap generated successfully at ${publicPath}`);
  process.exit(0);
}

generateSitemap();
