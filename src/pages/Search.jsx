import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, Loader2 } from 'lucide-react';
import { searchArticles } from '../services/articleService';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (query) {
                setLoading(true);
                try {
                    const data = await searchArticles(query);
                    setResults(data);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        };

        performSearch();
    }, [query]);

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">
                        {query ? `Results for "${query}"` : "Search Articles"}
                    </h1>
                    <div className="relative">
                        <input
                            type="text"
                            defaultValue={query}
                            placeholder="Search for articles, schools, categories..."
                            className="w-full p-4 pl-12 rounded-full border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    window.location.href = `/search?q=${e.target.value}`;
                                }
                            }}
                        />
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <button
                            onClick={(e) => {
                                const input = e.currentTarget.previousSibling.previousSibling;
                                window.location.href = `/search?q=${input.value}`;
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-900 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-800 transition"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                        <p className="text-slate-500 font-medium tracking-wide">Searching our archives...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {results.map(article => (
                            <Link to={`/article/${article.id}`} key={article.id} className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 border border-gray-100 group p-6">
                                <div className="flex-grow">
                                    <span className="text-xs font-bold text-blue-600 uppercase mb-2 block">{article.category || 'Education'}</span>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition">{article.title}</h3>
                                    <div className="text-slate-600 text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: (article.body || '').substring(0, 150) + '...' }} />
                                    <div className="flex items-center text-xs text-slate-400 gap-3">
                                        <span>{article.createdAt?.toDate ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'Recent'}</span>
                                        <span>•</span>
                                        <span>{article.schoolName || 'News Journal'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : query ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🏜️</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
                        <p className="text-slate-500">We couldn't find any articles matching "{query}". Try different keywords.</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
