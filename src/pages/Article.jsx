import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Clock, MapPin, Loader2, AlertCircle, Check, ThumbsUp, ThumbsDown, MessageSquare, Trash2, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

import { getEmbedUrl } from '../utils/videoUtils';
import { getArticleById, getRelatedArticles, toggleReaction, getUserReaction, addComment, deleteComment, getComments, getSchoolById } from '../services/articleService';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

export default function Article() {
    const { id } = useParams();
    const { currentUser, userRole } = useAuth();
    
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Reactions & Comments state
    const [userReaction, setUserReaction] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [reactionLoading, setReactionLoading] = useState(false);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [schoolPlan, setSchoolPlan] = useState('basic');

    useEffect(() => {
        const fetchArticleData = async () => {
            setLoading(true);
            try {
                const data = await getArticleById(id);
                if (data) {
                    setArticle(data);
                    setLikeCount(data.likeCount || 0);
                    setDislikeCount(data.dislikeCount || 0);

                    // Fetch related articles
                    const related = await getRelatedArticles(data.category, id);
                    setRelatedArticles(related);

                    // Fetch School Plan
                    if (data.schoolId) {
                        const school = await getSchoolById(data.schoolId);
                        if (school && school.plan) {
                            setSchoolPlan(school.plan);
                        }
                    }

                    // Fetch comments
                    const fetchedComments = await getComments(id);
                    setComments(fetchedComments);
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

    // Fetch user reaction separately to depend on currentUser
    useEffect(() => {
        const fetchReaction = async () => {
            if (currentUser && id) {
                try {
                    const reaction = await getUserReaction(id, currentUser.uid);
                    setUserReaction(reaction);
                } catch (err) {
                    console.error("Error fetching user reaction:", err);
                }
            }
        };
        fetchReaction();
    }, [currentUser, id]);

    const handleReaction = async (type) => {
        if (!currentUser) {
            alert("Please sign in to react to this article.");
            return;
        }
        
        setReactionLoading(true);
        try {
            const currentReaction = userReaction;
            let newReaction = type;

            if (currentReaction === type) {
                newReaction = null; // Remove reaction
                if (type === 'like') setLikeCount(prev => Math.max(0, prev - 1));
                if (type === 'dislike') setDislikeCount(prev => Math.max(0, prev - 1));
            } else {
                if (type === 'like') {
                    setLikeCount(prev => prev + 1);
                    if (currentReaction === 'dislike') setDislikeCount(prev => Math.max(0, prev - 1));
                } else if (type === 'dislike') {
                    setDislikeCount(prev => prev + 1);
                    if (currentReaction === 'like') setLikeCount(prev => Math.max(0, prev - 1));
                }
            }
            
            setUserReaction(newReaction);
            await toggleReaction(id, currentUser.uid, type, currentReaction);
        } catch (err) {
            console.error("Error toggling reaction:", err);
            alert("Failed to update reaction.");
            // Refresh counts if failure occurs
            const data = await getArticleById(id);
            if (data) {
                setLikeCount(data.likeCount || 0);
                setDislikeCount(data.dislikeCount || 0);
            }
        } finally {
            setReactionLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        
        if (!currentUser.emailVerified) {
            alert("Please verify your email address to post a comment.");
            return;
        }

        if (!newComment.trim()) return;

        try {
            await addComment(id, currentUser.uid, currentUser.displayName || currentUser.email.split('@')[0], newComment);
            setNewComment("");
            const updatedComments = await getComments(id);
            setComments(updatedComments);
        } catch (err) {
            console.error("Error adding comment:", err);
            alert("Failed to post comment.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteComment(id, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error("Error deleting comment:", err);
            alert("Failed to delete comment.");
        }
    };

    const handleShare = async () => {
        if (!article) return;
        const shareData = {
            title: article.title,
            text: `Check out this story on News Journal SL: ${article.title}`,
            url: window.location.href,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.error("Error sharing:", err); }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) { console.error("Failed to copy:", err); }
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
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
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
                    <div className="prose prose-slate lg:prose-lg prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 max-w-none article-body">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body) }} />

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
                        
                        {/* Reactions Section */}
                        <div className="mt-8 flex gap-4">
                            <button 
                                onClick={() => handleReaction('like')}
                                disabled={reactionLoading}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition font-bold shadow-sm ${userReaction === 'like' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <ThumbsUp size={20} className={userReaction === 'like' ? 'fill-blue-600' : ''} /> 
                                <span>{likeCount}</span>
                            </button>
                            <button 
                                onClick={() => handleReaction('dislike')}
                                disabled={reactionLoading}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition font-bold shadow-sm ${userReaction === 'dislike' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <ThumbsDown size={20} className={userReaction === 'dislike' ? 'fill-red-600' : ''} /> 
                                <span>{dislikeCount}</span>
                            </button>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-12 pt-8 border-t border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <MessageSquare className="text-blue-600" />
                                Comments ({comments.length})
                            </h3>

                            {schoolPlan === 'premium' ? (
                                <>
                                    {currentUser ? (
                                        <form onSubmit={handleAddComment} className="mb-8">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder={currentUser.emailVerified ? "Add a comment..." : "Please verify your email to comment"}
                                                disabled={!currentUser.emailVerified}
                                                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none resize-none min-h-[100px]"
                                                maxLength={500}
                                            />
                                            <div className="flex justify-between items-center mt-3">
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {newComment.length}/500 characters
                                                </span>
                                                <button 
                                                    type="submit"
                                                    disabled={!currentUser.emailVerified || !newComment.trim()}
                                                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Send size={16} /> Post Comment
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center mb-8">
                                            <p className="text-slate-600 font-medium mb-4">Join the conversation</p>
                                            <Link to="/login" className="inline-block bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">
                                                Sign In to Comment
                                            </Link>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {comments.length > 0 ? comments.map(comment => (
                                            <div key={comment.id} className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{comment.displayName}</div>
                                                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                                                            {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                                                        </div>
                                                    </div>
                                                    {(currentUser?.uid === comment.userId || ['super_admin', 'admin'].includes(userRole)) && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-slate-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-lg"
                                                            title="Delete Comment"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.text}</p>
                                            </div>
                                        )) : (
                                            <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                No comments yet. Be the first to share your thoughts!
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                                    <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
                                    <p className="font-bold text-slate-700">Comments are disabled</p>
                                    <p className="text-sm">Comments are not available for this article.</p>
                                </div>
                            )}
                        </div>
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
