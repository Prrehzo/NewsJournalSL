import React, { useState, useEffect } from 'react';
import { FileText, Eye, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getArticles } from '../../services/articleService';
import { Link } from 'react-router-dom';

export default function SchoolDashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({ total: 0, views: 0, lastDate: 'N/A' });
    const [recentArticles, setRecentArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!currentUser?.schoolId) {
                console.warn("Dashboard: No schoolId found for current user");
                setLoading(false);
                return;
            }
            try {
                const articles = await getArticles(5, currentUser.schoolId);
                setRecentArticles(articles);

                // For now, simpler stats. In a real app we'd aggregate these.
                setStats({
                    total: articles.length,
                    views: articles.reduce((acc, curr) => acc + (curr.views || 0), 0),
                    lastDate: articles.length > 0 && articles[0].createdAt?.toDate
                        ? new Date(articles[0].createdAt.toDate()).toLocaleDateString()
                        : 'N/A'
                });
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentUser]);

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><FileText size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</h3>
                    <p className="text-slate-500 text-sm">Total Articles Published</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><Eye size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.views}</h3>
                    <p className="text-slate-500 text-sm">Estimated Views</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><Clock size={24} /></div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{stats.lastDate}</h3>
                    <p className="text-slate-500 text-sm">Last Published</p>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Recent Articles</h3>
                    <Link to="/school-admin/articles" className="text-sm font-medium text-blue-600 hover:bg-blue-600/10 px-3 py-1.5 rounded-lg transition">View all</Link>
                </div>
                <div className="overflow-x-auto">
                    {recentArticles.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Title</th>
                                    <th className="px-6 py-4 font-medium">Category</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentArticles.map(article => (
                                    <tr key={article.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-slate-900">{article.title}</td>
                                        <td className="px-6 py-4 text-slate-500">{article.category}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {article.createdAt?.toDate ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/school-admin/edit/${article.id}`} className="text-blue-600 font-medium hover:underline">Edit</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-slate-400 italic">
                            No articles published yet. Click "View all" to manage your content.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
