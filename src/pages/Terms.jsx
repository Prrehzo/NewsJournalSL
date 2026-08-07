import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, CheckCircle, AlertTriangle, Scale, Globe, UserCheck } from 'lucide-react';

export default function Terms() {
    return (
        <div className="bg-white min-h-screen pb-24">
            {/* Hero Section */}
            <section className="bg-slate-950 py-24 text-white">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <h1 className="text-5xl font-black mb-6 tracking-tighter">Terms of Use</h1>
                        <p className="text-xl text-slate-400 font-medium">Please read these terms carefully before using News Journal SL.</p>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 -mt-12">
                <div className="grid lg:grid-cols-[1fr_300px] gap-16">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-8 md:p-16 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100"
                    >
                        <div className="prose prose-lg prose-slate max-w-none">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Gavel size={24} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 m-0">Acceptance of Terms</h2>
                            </div>
                            <p>
                                By accessing or using the News Journal SL platform, you agree to be bound by these Terms of Use. If you do not agree to all of these terms, do not use the platform.
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <UserCheck className="text-blue-500" size={20} /> 1. Eligibility and Registration
                            </h3>
                            <p>
                                Registration is open to educational institutions in Sierra Leone. Schools must provide accurate and verifiable information during registration. Individual accounts (Admins and Reporters) must be authorized by their respective schools.
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <Globe className="text-blue-500" size={20} /> 2. Content Standards
                            </h3>
                            <p>All content published on News Journal SL must adhere to the following standards:</p>
                            <ul>
                                <li>Accuracy and truthfulness in reporting.</li>
                                <li>No hate speech, harassment, or defamatory material.</li>
                                <li>Respect for intellectual property and copyright.</li>
                                <li>Focus on educational and school-related topics.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <AlertTriangle className="text-blue-500" size={20} /> 3. Prohibited Activities
                            </h3>
                            <p>Users are prohibited from:</p>
                            <ul>
                                <li>Impersonating other individuals or institutions.</li>
                                <li>Attempting to bypass platform security measures.</li>
                                <li>Using the platform for unauthorized commercial advertising.</li>
                                <li>Uploading malicious code or spamming the network.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <Scale className="text-blue-500" size={20} /> 4. Moderation and Termination
                            </h3>
                            <p>
                                News Journal SL reserves the right to moderate, edit, or remove any content that violates these terms. We may suspend or terminate access for users or schools that repeatedly fail to comply with platform guidelines.
                            </p>

                            <div className="mt-16 p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                                <p className="text-slate-600 m-0 font-medium leading-relaxed">
                                    By using this platform, you join a community dedicated to professional student journalism and national development.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <aside className="space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl">
                            <Scale className="mb-4 opacity-50" size={32} />
                            <h4 className="font-black text-xl mb-4 leading-tight">Legal Questions?</h4>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed font-medium">For inquiries regarding these terms and conditions, please reach out to our legal team.</p>
                            <a href="mailto:prrehzo@gmail.com" className="block text-center py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition">Email Legal</a>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
