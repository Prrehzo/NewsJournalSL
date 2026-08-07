import React from 'react';
import { Target, Users, BookOpen, ShieldCheck } from 'lucide-react';

export default function About() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-3xl"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Empowering Student Voices</h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        News Journal SL is a dedicated platform designed to amplify the achievements, stories, and innovative ideas emerging from schools across Sierra Leone.
                    </p>
                </div>
            </div>

            {/* Mission Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            We believe that every student has a story worth telling. Our platform provides a professional space for schools to publish their news, from sports victories to academic breakthroughs, fostering a sense of community and pride.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Education First</h3>
                                    <p className="text-slate-500 text-sm">Providing a digital library of school activities for future generations.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Community Built</h3>
                                    <p className="text-slate-500 text-sm">Connecting students, parents, and alumni through transparent school updates.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm relative">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-900/10 rounded-full blur-2xl"></div>
                        <img
                            src="https://images.unsplash.com/photo-1577891720192-80d39c946ca3?q=80&w=800&auto=format&fit=crop"
                            alt="Sierra Leone School Environment"
                            className="rounded-2xl shadow-xl w-full h-auto object-cover"
                            onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop";
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats/Values Section */}
            <div className="bg-slate-50 border-y border-slate-100 py-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-black text-slate-900 mb-2">Grow</div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Schools</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 mb-2">Daily</div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Articles Published</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 mb-2">Connect</div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Monthly Readers</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 mb-2">S.L.</div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Districts Reached</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team/Philosophy */}
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-3xl mx-auto">
                    <BookOpen className="mx-auto text-blue-600 mb-6" size={48} />
                    <h2 className="text-3xl font-bold text-slate-900 mb-8">Digital Literacy for All</h2>
                    <p className="text-lg text-slate-600 mb-10 leading-relaxed italic">
                        "By teaching students to document their own environment, we are not just sharing news; we are building the digital skills necessary for the modern workforce."
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <ShieldCheck className="text-green-600" size={20} />
                        <span className="font-bold text-slate-800">Officially moderated for student safety.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
