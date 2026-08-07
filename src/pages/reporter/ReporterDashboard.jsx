import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckCircle, Clock, PlusCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getArticles } from '../../services/articleService';
import { motion } from 'framer-motion';

export default function ReporterDashboard() {
    const { currentUser } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyArticles = async () => {
            if (!currentUser?.uid) return;
            try {
                // Fetch articles where authorId matches current user
                const data = await getArticles(20, null, currentUser.uid);
                setArticles(data);
            } catch (err) {
                console.error("Error fetching reporter articles:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyArticles();
    }, [currentUser]);

    const stats = [
        { label: 'Total Articles', value: articles.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Published', value: articles.filter(a => a.status === 'published').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Drafts', value: articles.filter(a => a.status === 'draft').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Reporter Dashboard</h1>
                    <p className="text-slate-500 font-medium">Welcome back, {currentUser?.displayName || currentUser?.name}. Ready to write something new?</p>
                </div>
                <Link 
                    to="/school-admin/create" 
                    className="flex items-center gap-2 bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-800 transition shadow-xl shadow-blue-900/20"
                >
                    <PlusCircle size={20} /> Create New Article
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} mb-6`}>
                            <stat.icon size={28} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-blue-600" /> Recent Articles
                    </h2>
                    <Link to="/school-admin/articles" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center text-slate-400">Loading your stories...</div>
                    ) : articles.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {articles.slice(0, 5).map(article => (
                                <div key={article.id} className="p-6 hover:bg-slate-50/50 transition group flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex items-center justify-center">
                                            {article.coverImage ? (
                                                <img 
                                                    src={article.coverImage} 
                                                    alt="" 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                />
                                            ) : (
                                                <span className="text-slate-300 font-black text-[10px] uppercase tracking-tighter select-none">NJ</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition mb-1">{article.title}</h3>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="font-black text-blue-600 uppercase tracking-widest">{article.category}</span>
                                                <span className="text-slate-400">•</span>
                                                <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter text-[10px] ${
                                                    article.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {article.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link 
                                        to={`/school-admin/edit/${article.id}`} 
                                        className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <p className="text-slate-400 font-medium mb-6">You haven't posted any articles yet.</p>
                            <Link 
                                to="/school-admin/create" 
                                className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
                            >
                                Write Your First Story
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
