import React, { useState, useEffect } from 'react';
import { Users, FileText, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import { getSchools } from '../../services/articleService';

export default function SuperDashboard() {
    const [stats, setStats] = useState({ schools: 0, articles: 0, views: 0, pending: 0 });
    const [allSchools, setAllSchools] = useState([]);
    const [pendingSchools, setPendingSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const schools = await getSchools();
                const articlesSnap = await getDocs(collection(db, 'articles'));
                const articles = articlesSnap.docs.map(doc => doc.data());

                // Filter out incomplete records
                const validSchools = schools.filter(s => s.name && s.email);
                const pending = validSchools.filter(s => s.status === 'pending');

                setStats({
                    schools: validSchools.length,
                    articles: articles.length,
                    views: articles.reduce((acc, curr) => acc + (curr.views || 0), 0),
                    pending: pending.length
                });

                setAllSchools(validSchools);
                setPendingSchools(pending);
            } catch (err) {
                console.error("Error fetching super stats:", err);
                setError("Failed to load dashboard statistics. Please verify your database connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Platform Overview</h2>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <div>
                        <p className="font-bold">Error Loading Data</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Users size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.schools}</h3>
                    <p className="text-slate-500 text-sm">Registered Schools</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><FileText size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.articles}</h3>
                    <p className="text-slate-500 text-sm">Total Articles</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-lg text-green-600"><Eye size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.views >= 1000 ? (stats.views / 1000).toFixed(1) + 'k' : stats.views}</h3>
                    <p className="text-slate-500 text-sm">Total Platform Views</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><AlertCircle size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{stats.pending}</h3>
                    <p className="text-slate-500 text-sm">Pending Approvals</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-slate-900">Recent Registrations</h3>
                        <p className="text-xs text-slate-500 mt-1">Reviewing all {stats.schools} registered schools</p>
                    </div>
                    <Link to="/super-admin/schools" className="text-sm bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition shadow-sm font-bold">Manage All Schools</Link>
                </div>
                {pendingSchools.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-slate-500 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium">School Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Show all schools in this list, not just pending, so super admin sees all 2 registered schools */}
                            {allSchools.map(school => (
                                <tr key={school.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-slate-900">{school.name}</td>
                                    <td className="px-6 py-4 text-slate-500">{school.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${school.status === 'active' ? 'bg-green-50 text-green-700' :
                                            school.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                'bg-red-50 text-red-700'
                                            }`}>{school.status || 'Active'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link to="/super-admin/schools" className="text-blue-600 font-medium hover:underline">Manage</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-slate-400 italic">
                        No pending school applications at the moment.
                    </div>
                )}
            </div>
        </div>
    );
}
