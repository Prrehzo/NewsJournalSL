import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Plus, Search, Loader2, Sparkles, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getArticles } from '../../services/articleService';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function ManageArticles() {
    const { currentUser } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchArticlesList = async () => {
        if (!currentUser?.schoolId) {
            console.warn("ManageArticles: No schoolId found");
            setLoading(false);
            return;
        }
        try {
            const authorId = currentUser.role === 'reporter' ? currentUser.uid : null;
            const data = await getArticles(50, currentUser.schoolId, authorId);
            setArticles(data);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticlesList();
    }, [currentUser]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this article?")) {
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
        a.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Manage Articles</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                        />
                    </div>
                    <Link to="/school-admin/create" className="bg-blue-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800 transition shadow-md whitespace-nowrap">
                        <Plus size={20} /> Create New
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                    ) : filtered.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Article</th>
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
                                            <div className="text-xs text-slate-400">By {article.authorName || 'School Staff'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 capitalize">{article.category}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {article.createdAt?.toDate ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                <Link to={`/article/${article.id}`} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition" title="View"><Eye size={18} /></Link>
                                                <Link to={`/school-admin/edit/${article.id}`} className="p-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition" title="Edit"><Edit size={18} /></Link>
                                                <button onClick={() => handleDelete(article.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition" title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-20 text-center"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
                                <FileText size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {searchTerm ? "No matches found" : "No articles yet"}
                            </h3>
                            <p className="text-slate-500 max-w-xs mx-auto mb-8">
                                {searchTerm ? "Try adjusting your search terms to find what you're looking for." : "Your school's story starts here. Publish your first article to share news with the community."}
                            </p>
                            {!searchTerm && (
                                <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full">
                                    <Sparkles size={16} /> Ready to make headlines?
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
