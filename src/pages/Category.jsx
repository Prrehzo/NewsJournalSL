import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getArticles } from '../services/articleService';

export default function Category() {
    const { name } = useParams();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const categoryName = name ? name.charAt(0).toUpperCase() + name.slice(1) : 'All Categories';

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                const data = await getArticles(20, null, null, name || 'all');
                setArticles(data);
            } catch (error) {
                console.error("Error fetching articles:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, [name]);

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-2 block">Browse News</span>
                    <h1 className="text-4xl font-bold text-slate-900">{categoryName}</h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {['All', 'Education', 'Sports', 'Events', 'Culture'].map(cat => (
                        <Link
                            key={cat}
                            to={cat === 'All' ? '/categories' : `/category/${cat.toLowerCase()}`}
                            className={`px-6 py-2 rounded-full font-medium transition ${(cat.toLowerCase() === name || (cat === 'All' && !name))
                                ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-white text-slate-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat}
                        </Link>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                ) : articles.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-8">
                        {articles.map(article => (
                            <Link to={`/article/${article.id}`} key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group flex flex-col p-6">
                                <div className="flex-grow flex flex-col">
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 font-medium">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full capitalize">{article.category}</span>
                                        <span>•</span>
                                        <span>{article.createdAt?.toDate().toLocaleDateString() || 'Recently'}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-blue-700 transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow">
                                        {article.excerpt || (article.body && article.body.substring(0, 150) + '...')}
                                    </p>
                                    <div className="pt-4 border-t border-gray-50 mt-auto flex items-center text-blue-600 font-bold text-sm">
                                        Read Article <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <p className="text-slate-500 text-lg">No articles found in this category yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
