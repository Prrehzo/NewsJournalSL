import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url, article, author, datePublished, schoolName }) => {
    const siteName = 'News Journal SL';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = 'News Journal SL is a dedicated platform designed to amplify the achievements, stories, and innovative ideas emerging from schools across Sierra Leone.';
    const metaDescription = description || defaultDescription;
    const siteUrl = 'https://newsjournalsl.web.app';
    const metaUrl = url ? `${siteUrl}${url}` : siteUrl;
    const metaImage = image || `${siteUrl}/logo.png`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={metaUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={article ? 'article' : 'website'} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />

            {/* Structured Data (JSON-LD) for Articles */}
            {article && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "NewsArticle",
                        "headline": title,
                        "image": [metaImage],
                        "datePublished": datePublished || new Date().toISOString(),
                        "dateModified": datePublished || new Date().toISOString(),
                        "author": [{
                            "@type": "Person",
                            "name": author || "School Staff",
                            "jobTitle": "Student Reporter"
                        }],
                        "publisher": {
                            "@type": "Organization",
                            "name": schoolName || siteName,
                            "logo": {
                                "@type": "ImageObject",
                                "url": `${siteUrl}/logo.png`
                            }
                        },
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": metaUrl
                        }
                    })}
                </script>
            )}

            {/* Structured Data (JSON-LD) for Website */}
            {!article && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": siteName,
                        "url": siteUrl,
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": `${siteUrl}/search?q={search_term_string}`,
                            "query-input": "required name=search_term_string"
                        }
                    })}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
