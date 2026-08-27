import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { getUserReactions, getArticleById } from '../services/articleService';
import { Loader2, User, Mail, Shield, LogOut, ArrowRight, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';

export default function Dashboard() {
    const { currentUser, userRole, logout } = useAuth();
    const [likedArticles, setLikedArticles] = useState([]);
    const [dislikedArticles, setDislikedArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReactions = async () => {
            if (!currentUser) return;
            try {
                const reactions = await getUserReactions(currentUser.uid);
                
                // Fetch article details for each reaction
                const articlePromises = reactions.map(async (reaction) => {
                    const article = await getArticleById(reaction.articleId);
                    return { ...article, reactionType: reaction.type };
                });
                
                const articlesWithReactions = (await Promise.all(articlePromises)).filter(a => a.id);
                
                setLikedArticles(articlesWithReactions.filter(a => a.reactionType === 'like'));
                setDislikedArticles(articlesWithReactions.filter(a => a.reactionType === 'dislike'));
            } catch (err) {
                console.error("Error fetching user reactions:", err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchReactions();
        }
    }, [currentUser]);

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (userRole !== 'public') {
        // Handled by App.jsx routing, but just in case
        if (userRole === 'super_admin' || userRole === 'admin') return <Navigate to="/super-admin" replace />;
        if (userRole === 'school_admin' || userRole === 'reporter') return <Navigate to="/school-admin" replace />;
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <SEO title="My Dashboard" />
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Sidebar Profile */}
                    <div className="md:w-1/3">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <h2 className="text-xl font-bold text-center text-slate-900 mb-2">
                                {currentUser.displayName || 'Public User'}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
                                <Mail size={14} />
                                {currentUser.email}
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700">
                                    <Shield size={16} className={currentUser.emailVerified ? "text-green-500" : "text-amber-500"} />
                                    {currentUser.emailVerified ? 'Email Verified' : 'Email Unverified'}
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700">
                                    <User size={16} className="text-blue-500" />
                                    Role: Reader
                                </div>
                            </div>

                            <button 
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-2/3 space-y-8">
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <BookOpen className="text-blue-600" />
                                Liked Articles
                            </h3>
                            
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : likedArticles.length > 0 ? (
                                <div className="space-y-4">
                                    {likedArticles.map(article => (
                                        <Link key={article.id} to={`/article/${article.id}`} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition bg-white">
                                            {article.coverImage && (
                                                <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                                    <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition mb-1 line-clamp-2">{article.title}</h4>
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    {article.schoolName}
                                                </div>
                                            </div>
                                            <div className="flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition">
                                                <ArrowRight size={20} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    You haven't liked any articles yet.
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <BookOpen className="text-red-600" />
                                Disliked Articles
                            </h3>
                            
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="animate-spin text-red-600" size={32} />
                                </div>
                            ) : dislikedArticles.length > 0 ? (
                                <div className="space-y-4">
                                    {dislikedArticles.map(article => (
                                        <Link key={article.id} to={`/article/${article.id}`} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 hover:border-red-200 hover:shadow-md transition bg-white">
                                            {article.coverImage && (
                                                <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                                    <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition mb-1 line-clamp-2">{article.title}</h4>
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    {article.schoolName}
                                                </div>
                                            </div>
                                            <div className="flex items-center text-red-600 opacity-0 group-hover:opacity-100 transition">
                                                <ArrowRight size={20} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    You haven't disliked any articles.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
