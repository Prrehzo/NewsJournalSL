export const getEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube
    // Matches: youtube.com/watch?v=ID, m.youtube.com, youtu.be/ID, embed/ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
        return { type: 'youtube', url: `https://www.youtube.com/embed/${youtubeMatch[1]}` };
    }

    // Facebook
    // Facebook Video embed requires a canonical URL. We attempt to extract the numeric video ID
    // from common URL forms (e.g. watch/?v=ID, /videos/ID/, /share/v/ID/, /video.php?v=ID)
    // to build a stable URL. If not found, we pass the original URL.
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
        const fbIdMatch = url.match(/[?&]v=(\d+)/) || url.match(/\/videos\/(\d+)/) || url.match(/\/share\/v\/(\d+)/) || url.match(/\/video\.php\?v=(\d+)/);
        const canonicalUrl = fbIdMatch ? `https://www.facebook.com/video.php?v=${fbIdMatch[1]}` : url;
        return { type: 'facebook', url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalUrl)}&show_text=false&t=0` };
    }

    // TikTok
    // Extract video ID from mobile/desktop URL format. Supported patterns:
    // - tiktok.com/@username/video/123456
    // - tiktok.com/video/123456
    // - tiktok.com/v/123456
    if (url.includes('tiktok.com')) {
        const tiktokIdMatch = url.match(/(?:video|v|embed)\/(\d+)/);
        if (tiktokIdMatch) {
            return { type: 'tiktok', url: `https://www.tiktok.com/embed/${tiktokIdMatch[1]}` };
        }
    }

    return null;
};
