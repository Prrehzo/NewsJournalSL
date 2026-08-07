import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { getSchools } from '../services/articleService';

export default function Schools() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const data = await getSchools();
                setSchools(data);
            } catch (error) {
                console.error("Error fetching schools:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchools();
    }, []);

    const filteredSchools = schools.filter(school =>
        school.status === 'approved' && (
            (school.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (school.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
        )
    );

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Discover Schools</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">Browse through the network of schools across Sierra Leone sharing their stories and achievements.</p>
                </div>

                {/* Search & Filter Bar */}
                <div className="max-w-2xl mx-auto mb-16 flex gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search schools by name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-4 pl-12 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                        <p className="text-slate-500 font-medium tracking-wide">Finding schools...</p>
                    </div>
                ) : filteredSchools.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSchools.map(school => (
                            <div key={school.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-20 h-20 bg-blue-50 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black text-blue-900 border border-blue-100 group-hover:bg-blue-900 group-hover:text-white transition-colors duration-300">
                                        {school.logoUrl ? (
                                            <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover" />
                                        ) : (
                                            school.name?.substring(0, 2).toUpperCase() || 'S'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors">{school.name}</h3>
                                        <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                                            <MapPin size={14} /> {school.location || 'Sierra Leone'}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-slate-500 text-sm line-clamp-3 mb-8 flex-grow">
                                    {school.description || "Building the future of Sierra Leone through education and empowerment."}
                                </p>

                                <Link
                                    to={`/school/${school.id}`}
                                    className="mt-auto w-full py-4 text-center rounded-xl font-bold border-2 border-slate-100 text-slate-600 hover:border-blue-900 hover:text-blue-900 transition-all flex items-center justify-center gap-2"
                                >
                                    View Profile <ArrowRight size={18} />
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-gray-100">
                            <span className="text-2xl">🏫</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No schools found</h3>
                        <p className="text-slate-500 text-center max-w-sm">
                            {searchTerm ? `We couldn't find any schools matching "${searchTerm}".` : (
                                <>
                                    New schools are joining the network! Check back soon.
                                    <Link to="/register-school" className="block mt-4 text-blue-900 font-bold hover:underline">
                                        Is your school missing? Join us today.
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
