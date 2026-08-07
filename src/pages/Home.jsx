import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Sparkles, BookOpen, Globe, Award, Loader2 } from 'lucide-react';
import { getArticles, getSchools } from '../services/articleService';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const CATEGORY_CONFIG = {
    education: { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Education' },
    sports: { color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Sports' },
    events: { color: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50', label: 'Events' },
    culture: { color: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', label: 'Culture' },
    awards: { color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Awards' },
    default: { color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50', label: 'News' },
};

function getCat(cat) {
    return CATEGORY_CONFIG[(cat || '').toLowerCase()] || CATEGORY_CONFIG.default;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Recent';
    try {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        if (isNaN(date.getTime())) return 'Recent';
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return 'Recent';
    }
}

function ArticleCard({ article, index }) {
    const cat = getCat(article.category);
    const dateStr = formatDate(article.createdAt);

    const excerpt = (article.body || '')
        .replace(/<[^>]*>/g, '')
        .substring(0, 120)
        .trim();

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
        >
            <Link
                to={`/article/${article.id}`}
                className="group block h-full bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
            >
                <div className={`h-1 w-full ${cat.color} group-hover:h-1.5 transition-all duration-300`} />

                <div className="p-7 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${cat.bg} ${cat.text}`}>
                            {cat.label}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{dateStr}</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors duration-200 line-clamp-3">
                        {article.title}
                    </h3>

                    <p className="text-sm text-slate-500 leading-relaxed flex-grow line-clamp-3 mb-6">
                        {excerpt}{excerpt.length >= 120 ? '…' : ''}
                    </p>

                    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                                {(article.schoolName || 'NJ').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">By</p>
                                <p className="text-xs font-bold text-slate-700 leading-tight truncate max-w-[110px]">
                                    {article.authorName || 'School Staff'}
                                </p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-200">
                            <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function Home() {
    const [articles, setArticles] = useState([]);
    const [realStats, setRealStats] = useState({ articlesCount: 0, schoolsCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedArticles = await getArticles(6);
                setArticles(fetchedArticles);

                const fetchedSchools = await getSchools();
                setRealStats({
                    articlesCount: fetchedArticles.length,
                    schoolsCount: fetchedSchools.length
                });
            } catch (err) {
                console.error("Error loading home page data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const dynamicStats = [
        { icon: BookOpen, value: `${realStats.articlesCount}`, label: 'Published Stories' },
        { icon: Globe, value: `${realStats.schoolsCount}`, label: 'Partner Schools' },
        { icon: Award, value: 'Active', label: 'Student Journalism' },
        { icon: Sparkles, value: '100% Free', label: 'Open Access' },
    ];

    return (
        <div className="flex flex-col bg-white overflow-hidden">
            <SEO
                title="Empowering Student Voices in Sierra Leone"
                description="News Journal SL is a dedicated platform designed to amplify the achievements, stories, and innovative ideas emerging from schools across Sierra Leone."
                keywords="Sierra Leone, Education, Student News, School Journal, Student Journalism, Freetown, SL Schools"
            />

            {/* Hero */}
            <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-slate-950">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.3),transparent)]" />
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white to-transparent" />
                </div>

                <div className="container mx-auto px-6 relative z-10 pt-28 pb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-4xl mx-auto"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 text-blue-300 text-xs font-black tracking-[0.2em] uppercase mb-8 rounded-full border border-blue-500/30 backdrop-blur-md">
                            <Sparkles size={12} className="animate-pulse" />
                            Sierra Leone's School Voice
                        </span>

                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white mb-6 leading-[1.05] tracking-tight">
                            Where Every<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-sky-100">
                                Story Matters.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                            Empowering the next generation of student journalists across Sierra Leone.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                to="/schools"
                                className="group flex items-center gap-2.5 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5"
                            >
                                Explore Schools
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/categories"
                                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm text-white border border-white/20 hover:bg-white/10 transition-all duration-200 backdrop-blur-md hover:-translate-y-0.5"
                            >
                                Browse All Stories
                            </Link>
                        </div>
                    </motion.div>

                    {/* Dynamic Real Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
                    >
                        {dynamicStats.map(({ icon: Icon, value, label }) => (
                            <div key={label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center">
                                <Icon size={20} className="text-blue-400 mx-auto mb-2" />
                                <div className="text-2xl font-black text-white mb-0.5">{value}</div>
                                <div className="text-xs text-slate-400 font-medium">{label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Latest Stories */}
            <section className="container mx-auto px-6 py-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
                    <div>
                        <p className="text-blue-600 font-black text-xs uppercase tracking-[0.25em] mb-3">
                            Latest from the Field
                        </p>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                            Frontlines of<br />
                            <span className="text-blue-600">Education</span>
                        </h2>
                    </div>
                    <Link
                        to="/categories"
                        className="group inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        View all stories
                        <span className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-200">
                            <ArrowUpRight size={16} />
                        </span>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                        <p className="text-slate-400 font-medium">Loading stories…</p>
                    </div>
                ) : articles.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article, i) => (
                            <ArticleCard key={article.id} article={article} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                            <Sparkles className="text-blue-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Quiet on the set…</h3>
                        <p className="text-slate-400 text-center max-w-sm">Our student reporters are out in the field. Check back soon for fresh stories!</p>
                    </div>
                )}
            </section>

            {/* CTA Banner */}
            <section className="container mx-auto px-6 pb-24">
                <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-12 md:p-16 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.25),transparent_70%)]" />
                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1.5 bg-blue-600/20 text-blue-300 text-xs font-black tracking-widest uppercase rounded-full border border-blue-500/30 mb-6">
                            For Schools
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            Is your school's voice<br />being heard?
                        </h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-8 text-lg">
                            Join the News Journal SL network and give your students a platform to share their stories.
                        </p>
                        <Link
                            to="/register-school"
                            className="inline-flex items-center gap-2.5 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:-translate-y-0.5"
                        >
                            Register Your School <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
