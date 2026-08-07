import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Mail, Globe, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getArticles } from '../services/articleService';

export default function SchoolProfile() {
    const { id } = useParams();
    const [school, setSchool] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSchoolData = async () => {
            try {
                // Fetch school details
                const schoolRef = doc(db, 'schools', id);
                const schoolSnap = await getDoc(schoolRef);

                if (schoolSnap.exists()) {
                    setSchool({ id: schoolSnap.id, ...schoolSnap.data() });
                    // Fetch school's articles
                    const schoolArticles = await getArticles(20, id);
                    setArticles(schoolArticles);
                } else {
                    setError("School not found");
                }
            } catch (err) {
                console.error("Error fetching school data:", err);
                setError("Failed to load school profile");
            } finally {
                setLoading(false);
            }
        };

        fetchSchoolData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-slate-500 font-medium tracking-wide">Loading school profile...</p>
            </div>
        );
    }

    if (error || !school) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{error || "School not found"}</h2>
                <Link to="/schools" className="bg-blue-900 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-800 transition shadow-lg">
                    Browse All Schools
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header / Banner */}
            <div className="bg-blue-900 text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/50"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 p-1 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                        {school.logoUrl ? (
                            <img src={school.logoUrl} alt={school.name} className="rounded-full w-full h-full object-cover" />
                        ) : (
                            <div className="text-3xl font-black text-blue-900">{school.name?.substring(0, 2).toUpperCase()}</div>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-6">{school.name}</h1>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed">{school.description || "Proud member of the News Journal SL network."}</p>

                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-blue-200">
                        <div className="flex items-center gap-2 bg-blue-800/50 px-4 py-2 rounded-full backdrop-blur-sm"><MapPin size={18} /> {school.location || 'Sierra Leone'}</div>
                        {school.email && <div className="flex items-center gap-2 bg-blue-800/50 px-4 py-2 rounded-full backdrop-blur-sm"><Mail size={18} /> {school.email}</div>}
                        {school.website && <div className="flex items-center gap-2 bg-blue-800/50 px-4 py-2 rounded-full backdrop-blur-sm"><Globe size={18} /> {school.website}</div>}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-12 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto border border-gray-100">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Latest Updates</h2>
                        <div className="flex gap-4">
                        </div>
                    </div>

                    {articles.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            {articles.map((art) => (
                                <Link to={`/article/${art.id}`} key={art.id} className="group cursor-pointer bg-gray-50 rounded-xl p-4 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100">
                                    <div className="h-48 bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                                        {art.coverImage || art.imageUrl ? (
                                            <img src={art.coverImage || art.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={art.title} />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-white flex items-center justify-center">
                                                <span className="text-slate-200 font-black text-3xl uppercase tracking-tighter select-none">NJ</span>
                                            </div>
                                        )}
                                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase tracking-wider text-slate-800 shadow-sm">{art.category || 'News'}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors line-clamp-1">{art.title}</h3>
                                    <div className="text-slate-500 text-sm line-clamp-2 mb-4" dangerouslySetInnerHTML={{ __html: art.body }} />
                                    <div className="flex items-center text-blue-600 font-bold text-sm gap-1 group-hover:gap-2 transition-all">Read more <ArrowRight size={16} /></div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-slate-500 italic">This school hasn't published any articles yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
