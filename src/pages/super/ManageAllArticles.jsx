import React, { useState, useEffect } from 'react';
import { Search, Trash2, Eye, Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllArticlesForAdmin } from '../../services/articleService';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function ManageAllArticles() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllArticles = async () => {
        try {
            const data = await getAllArticlesForAdmin(100);
            setArticles(data);
        } catch (err) {
            console.error("Error fetching all articles:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllArticles();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this article? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'articles', id));
                setArticles(articles.filter(a => a.id !== id));
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to delete article");
            }
        }
    };

    const filtered = articles.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.schoolName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-bold text-slate-900">All Articles</h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search articles or schools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                    ) : filtered.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Article</th>
                                    <th className="px-6 py-4 font-medium">School</th>
                                    <th className="px-6 py-4 font-medium">Category</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(article => (
                                    <tr key={article.id} className="hover:bg-gray-50 transition group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{article.title}</div>
                                            <div className="text-xs text-slate-400">By {article.authorName || 'Staff'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">{article.schoolName}</td>
                                        <td className="px-6 py-4 text-slate-500 capitalize">{article.category}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {article.createdAt?.toDate ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                <Link to={`/article/${article.id}`} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition" title="View"><Eye size={18} /></Link>
                                                <button onClick={() => handleDelete(article.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition" title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 text-center text-slate-400">
                            {searchTerm ? "No matches found." : "No articles found in the entire platform."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
