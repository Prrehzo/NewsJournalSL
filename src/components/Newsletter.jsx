import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const { subscribeToNewsletter } = await import('../services/articleService');
            await subscribeToNewsletter(email);
            setStatus('success');
            setEmail('');
        } catch (err) {
            console.error("Subscription error:", err);
            setStatus('idle');
            alert("Failed to subscribe. Please try again.");
        }
    };

    return (
        <section className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-blue-900 rounded-[3rem] p-8 md:p-20 relative overflow-hidden shadow-2xl shadow-blue-900/40"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-30"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block p-4 bg-blue-800/50 backdrop-blur-md rounded-2xl mb-8 border border-blue-700/50"
                    >
                        <Send className="text-blue-300" size={32} />
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                        Stay Connected with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">Sierra Leone's Schools</span>
                    </h2>

                    <p className="text-blue-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join 5,000+ students, teachers, and parents. Get the best school stories delivered straight to your inbox every week.
                    </p>

                    {status === 'success' ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-md mx-auto"
                        >
                            <CheckCircle2 className="text-green-400 mx-auto mb-4" size={48} />
                            <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                            <p className="text-blue-100">Thanks for subscribing. We'll be in touch soon.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="flex-grow bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-blue-300/70 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                required
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-bold hover:bg-blue-50 transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 disabled:opacity-70 group"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Subscribe Now <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <p className="mt-8 text-blue-300/60 text-sm">
                        Protecting your privacy. No spam, ever.
                    </p>
                </div>
            </motion.div>
        </section>
    );
}
