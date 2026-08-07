import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Clock, MapPin, Loader2, AlertCircle, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';

import { getEmbedUrl } from '../utils/videoUtils';
import { getArticleById, getRelatedArticles } from '../services/articleService';
import SEO from '../components/SEO';

export default function Article() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchArticleData = async () => {
            setLoading(true);
            try {
                const data = await getArticleById(id);
                if (data) {
                    setArticle(data);
                    // Fetch related articles
                    const related = await getRelatedArticles(data.category, id);
                    setRelatedArticles(related);
                } else {
                    setError("Article not found");
                }
            } catch (err) {
                console.error("Error fetching article:", err);
                setError("Failed to load article");
            } finally {
                setLoading(false);
            }
        };

        fetchArticleData();
        window.scrollTo(0, 0);
    }, [id]);

    const handleShare = async () => {
        if (!article) return;

        const shareData = {
            title: article.title,
            text: `Check out this story on News Journal SL: ${article.title}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }
    };

    const handleDownloadPDF = async () => {
        if (!article) return;

        const element = document.getElementById('article-main-content');
        if (!element) return;

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();

            pdf.setFontSize(22);
            pdf.setFont("helvetica", "bold");
            const titleLines = pdf.splitTextToSize(article.title, pageWidth - 40);
            pdf.text(titleLines, 20, 30);

            let currentY = 35 + (titleLines.length * 10);

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(100);
            const dateStr = article.createdAt?.toDate ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'Recent';
            pdf.text(`${article.schoolName || 'School Staff'} | ${dateStr} | Category: ${article.category || 'General'}`, 20, currentY);

            currentY += 15;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);

            pdf.save(`${article.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}.pdf`);
        } catch (err) {
            console.error("PDF generation failed", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    // Helper to strip HTML for meta description
    const stripHtml = (html) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || "";
        return text.replace(/\s+/g, ' ').trim();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-slate-500 font-medium tracking-wide">Loading story...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{error || "Article not found"}</h2>
                <p className="text-slate-500 text-center mb-8">The story you're looking for might have been moved or deleted.</p>
                <Link to="/" className="bg-blue-900 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-800 transition shadow-lg">
                    Back to Homepage
                </Link>
            </div>
        );
    }

    const embedData = getEmbedUrl(article.videoLink);
    const formattedDate = article.createdAt?.toDate ? new Date(article.createdAt.toDate()).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    }) : 'Just now';

    const plainDescription = stripHtml(article.body).substring(0, 160) + '...';

    return (
        <div className="bg-white min-h-screen pb-20">
            <SEO 
                title={article.title}
                description={plainDescription}
                article={true}
                author={article.authorName}
                datePublished={article.createdAt?.toDate ? article.createdAt.toDate().toISOString() : null}
                schoolName={article.schoolName}
                url={`/article/${article.id}`}
            />
            <div className="bg-slate-900 py-20">
                <div className="container mx-auto px-4 md:px-8">
                    <span className="bg-blue-600 text-white px-3 py-1 text-xs font-bold uppercase rounded mb-4 inline-block tracking-wider">{article.category}</span>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-4xl">{article.title}</h1>
                    <div className="flex flex-wrap items-center text-white/90 gap-6 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-blue-400" />
                            <span>{article.schoolName || 'School Staff'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-blue-400" />
                            <span>{formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 grid md:grid-cols-[1fr_350px] gap-12 mt-12">
                <div id="article-main-content" className="bg-white">
                    {article.coverImage && (
                        <div className="mb-8 rounded-2xl overflow-hidden aspect-[21/9] w-full max-h-[400px] shadow-sm border border-slate-100 bg-slate-50">
                            <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="prose prose-lg prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: article.body }} />

                        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl border border-blue-100">
                                {article.authorName ? article.authorName.charAt(0) : 'S'}
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Reported by</div>
                                <div className="font-black text-slate-900 text-lg">{article.authorName || 'School Staff'}</div>
                                {article.authorPositions && article.authorPositions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {article.authorPositions.map((pos, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-tighter rounded border border-slate-200">
                                                {pos}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {embedData && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="my-12 rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 bg-slate-50 p-2 md:p-4"
                            >
                                <div className="rounded-2xl overflow-hidden aspect-video relative group">
                                    <iframe
                                        src={embedData.url}
                                        className="absolute inset-0 w-full h-full"
                                        title="Embedded Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 sticky top-24">
                        <h3 className="font-bold text-slate-900 mb-4 text-lg">Article Actions</h3>
                        <button
                            onClick={handleDownloadPDF}
                            className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white py-3.5 rounded-xl hover:bg-blue-800 transition mb-3 font-bold shadow-lg shadow-blue-900/20"
                        >
                            <Download size={20} /> Download PDF
                        </button>
                        <button
                            onClick={handleShare}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition font-medium border ${copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'}`}
                        >
                            {copied ? <Check size={20} /> : <Share2 size={20} />}
                            {copied ? 'Link Copied!' : 'Share Article'}
                        </button>
                    </div>

                    {relatedArticles.length > 0 && (
                        <div>
                            <h3 className="font-bold text-slate-900 mb-6 text-lg">Related News</h3>
                            <div className="space-y-6">
                                {relatedArticles.map(rel => (
                                    <Link to={`/article/${rel.id}`} key={rel.id} className="group block">
                                        <div className="flex gap-4 items-center py-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition">{rel.title}</h4>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{rel.schoolName}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
