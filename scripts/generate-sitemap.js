import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

/**
 * Dynamic Sitemap Generator for News Journal SL
 * 
 * Queries Firestore for published articles and approved schools,
 * then generates a sitemap.xml in public/ for Vite to include in the build.
 * 
 * Run automatically via: npm run build (pre-build hook)
 * Or manually via:       node scripts/generate-sitemap.js
 */

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

/**
 * Convert a Firestore timestamp (or seconds-based object) to YYYY-MM-DD.
 * Falls back to today's date if the timestamp is missing or unreadable.
 */
function toDateString(timestamp) {
  try {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    // Firestore REST-style { _seconds, _nanoseconds }
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toISOString().split('T')[0];
    // Firestore SDK Timestamp with toDate()
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().toISOString().split('T')[0];
    // Firestore SDK Timestamp with seconds property
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
    // Already a Date or ISO string
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {
    // ignore
  }
  return new Date().toISOString().split('T')[0];
}

/** Escape XML special characters in text content */
function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[sitemap] Generating sitemap for ${BASE_URL} ...`);

  // ── Static public pages ──────────────────────────────────────────────
  const staticPages = [
    { url: '/',           priority: '1.0', changefreq: 'daily',   lastmod: today },
    { url: '/about',      priority: '0.8', changefreq: 'monthly', lastmod: today },
    { url: '/schools',    priority: '0.8', changefreq: 'weekly',  lastmod: today },
    { url: '/categories', priority: '0.7', changefreq: 'weekly',  lastmod: today },
    { url: '/privacy',    priority: '0.3', changefreq: 'yearly',  lastmod: today },
    { url: '/terms',      priority: '0.3', changefreq: 'yearly',  lastmod: today },
    { url: '/search',     priority: '0.5', changefreq: 'weekly',  lastmod: today },
  ];

  // ── Fetch published articles ─────────────────────────────────────────
  let articles = [];
  try {
    const articlesRef = collection(db, 'articles');
    const q = query(articlesRef, where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    articles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`[sitemap] Found ${articles.length} published articles`);
  } catch (error) {
    console.error('[sitemap] Error fetching articles:', error.message);
  }

  // ── Fetch schools ────────────────────────────────────────────────────
  let schools = [];
  try {
    const schoolsRef = collection(db, 'schools');
    const snapshot = await getDocs(schoolsRef);
    schools = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`[sitemap] Found ${schools.length} schools`);
  } catch (error) {
    console.error('[sitemap] Error fetching schools:', error.message);
  }

  // ── Build XML ────────────────────────────────────────────────────────
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(BASE_URL + page.url)}</loc>\n`;
    xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // School pages
  for (const school of schools) {
    const lastmod = toDateString(school.updatedAt || school.createdAt);
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(BASE_URL + '/school/' + school.id)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  }

  // Article pages
  for (const article of articles) {
    const lastmod = toDateString(article.updatedAt || article.createdAt);
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(BASE_URL + '/article/' + article.id)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  // ── Write to public/ ─────────────────────────────────────────────────
  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');

  const totalUrls = staticPages.length + schools.length + articles.length;
  console.log(`[sitemap] ✓ Sitemap written to ${outputPath} (${totalUrls} URLs)`);
  process.exit(0);
}

generateSitemap();
