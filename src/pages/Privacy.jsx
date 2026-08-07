import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, FileText, Server, Bell } from 'lucide-react';

export default function Privacy() {
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
                        <h1 className="text-5xl font-black mb-6 tracking-tighter">Privacy Policy</h1>
                        <p className="text-xl text-slate-400 font-medium">Last updated: May 10, 2026. Your privacy is our priority at News Journal SL.</p>
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
                                    <ShieldCheck size={24} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 m-0">Our Commitment</h2>
                            </div>
                            <p>
                                At News Journal SL, we are committed to protecting the privacy and security of our users, particularly the students and educators who power our platform. This Privacy Policy explains how we collect, use, and safeguard your information.
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <Eye className="text-blue-500" size={20} /> 1. Information We Collect
                            </h3>
                            <p>We collect information that you provide directly to us when you:</p>
                            <ul>
                                <li>Register your school on our platform.</li>
                                <li>Create an account as a School Admin or Student Reporter.</li>
                                <li>Submit articles, images, or videos for publication.</li>
                                <li>Contact our support team or subscribe to our updates.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <Lock className="text-blue-500" size={20} /> 2. How We Use Your Information
                            </h3>
                            <p>We use the collected information to:</p>
                            <ul>
                                <li>Maintain and improve the News Journal SL platform.</li>
                                <li>Verify school authenticity and prevent unauthorized access.</li>
                                <li>Attribute articles correctly to their respective authors and schools.</li>
                                <li>Communicate important platform updates and security alerts.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <Server className="text-blue-500" size={20} /> 3. Data Storage and Security
                            </h3>
                            <p>
                                Your data is stored securely using Firebase (Google Cloud Infrastructure). We implement industry-standard security measures to protect against unauthorized access, alteration, or destruction of your personal information.
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
                                <Bell className="text-blue-500" size={20} /> 4. Updates to This Policy
                            </h3>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date at the top.
                            </p>

                            <div className="mt-16 p-8 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-600">
                                "We believe that student voices deserve a safe and private space to grow and lead the national conversation."
                            </div>
                        </div>
                    </motion.div>

                    <aside className="space-y-8">
                        <div className="bg-blue-900 p-8 rounded-[2rem] text-white shadow-xl">
                            <FileText className="mb-4 opacity-50" size={32} />
                            <h4 className="font-black text-xl mb-4 leading-tight">Need more clarity?</h4>
                            <p className="text-blue-200 text-sm mb-6 leading-relaxed font-medium">If you have questions about how we handle data, our team is ready to help.</p>
                            <a href="mailto:prrehzo@gmail.com" className="block text-center py-3 bg-white text-blue-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition">Contact Support</a>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
