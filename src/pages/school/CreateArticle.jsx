import React, { useState, useEffect } from 'react';
import { Video, Save, ArrowLeft, Loader2, Sparkles, Check, X, User } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createArticle, getArticleById, updateArticle } from '../../services/articleService';
import { optimizeArticle } from '../../services/aiService';
import { createNotificationForMany, getSuperAdminIds } from '../../services/notificationService';
import ImageUpload from '../../components/ImageUpload';

export default function CreateArticle() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('education');
    const [body, setBody] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [reporterName, setReporterName] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);

    // AI Optimizer States
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [optimizedBody, setOptimizedBody] = useState('');
    const [lastOptimizedTime, setLastOptimizedTime] = useState(0);

    useEffect(() => {
        if (isEditing) {
            const fetchArticle = async () => {
                try {
                    const data = await getArticleById(id);
                    if (data) {
                        // Security check: Reporters should only edit their own articles
                        if (currentUser.role === 'reporter' && data.authorId !== currentUser.uid) {
                            alert("Access denied. You can only edit your own articles.");
                            navigate('/school-admin/articles');
                            return;
                        }
                        setTitle(data.title);
                        setCategory(data.category?.toLowerCase() || 'education');
                        setBody(data.body);
                        setVideoLink(data.videoLink || '');
                        setReporterName(data.authorName || '');
                        setCoverImage(data.coverImage || '');
                    }
                } catch (err) {
                    console.error("Error loading article:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchArticle();
        }
    }, [id, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser?.schoolId) {
            alert("Error: Your account is not correctly linked to a school. Please contact support.");
            return;
        }

        setSaving(true);
        try {
            const articleData = {
                title,
                category,
                body,
                videoLink,
                schoolId: currentUser.schoolId,
                schoolName: currentUser.schoolName || 'Unknown School',
                authorName: reporterName.trim() || currentUser.displayName || currentUser.name || 'School Staff',
                authorId: currentUser.uid,
                authorPositions: currentUser.positions || [],
                coverImage: coverImage || null
            };

            if (isEditing) {
                await updateArticle(id, articleData);
                alert('Article updated successfully!');
            } else {
                await createArticle(articleData);
                // Notify all super admins about the new article
                try {
                    const superAdminIds = await getSuperAdminIds();
                    if (superAdminIds.length > 0) {
                        await createNotificationForMany(superAdminIds, {
                            type: 'article_published',
                            title: 'New Article Published',
                            message: `"${title}" was published by ${articleData.authorName} at ${articleData.schoolName}.`,
                            link: '/super-admin/articles'
                        });
                    }
                } catch (notifErr) {
                    console.error('Failed to send notification:', notifErr);
                }
                alert('Article published successfully!');
            }
            navigate('/school-admin/articles');
        } catch (error) {
            console.error("Save error:", error);
            alert(error.message || "Failed to save article");
        } finally {
            setSaving(false);
        }
    };

    const handleOptimize = async () => {
        if (!body.trim()) return;

        // Debounce / spam protection (5 seconds)
        const now = Date.now();
        if (now - lastOptimizedTime < 5000) {
            alert("Please wait a few seconds before optimizing again.");
            return;
        }

        setIsOptimizing(true);
        try {
            const improvedText = await optimizeArticle(body, title, category);
            setOptimizedBody(improvedText);
            setShowComparison(true);
            setLastOptimizedTime(now);
        } catch (error) {
            alert(error.message || "Failed to optimize article.");
        } finally {
            setIsOptimizing(false);
        }
    };

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/school-admin/articles" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} className="text-slate-500" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Article' : 'Create New Article'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Article Title</label>
                        <input
                            type="text"
                            required
                            className="w-full p-4 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Enter a catchy headline..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Article Thumbnail / Cover Image (Optional)</label>
                        <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <ImageUpload 
                                onUploadComplete={(url) => setCoverImage(url)}
                                folder="articles"
                                initialUrl={coverImage}
                            />
                            <div className="text-xs text-slate-500">
                                <p className="font-bold text-slate-700 mb-1">Recommended size: 1200 x 630 pixels (under 5MB)</p>
                                <p>Upload an eye-catching thumbnail to represent your article in feeds and search results. Hosted securely via imgBB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                            <select
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="education">Education</option>
                                <option value="sports">Sports</option>
                                <option value="events">Events</option>
                                <option value="culture">Culture</option>
                                <option value="awards">Awards</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Reported By</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    className="w-full p-3 pl-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter your name or the name of the reporter"
                                    value={reporterName}
                                    onChange={(e) => setReporterName(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">This name will appear on the published article as "Reported by..."</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Video Link (Optional)</label>
                        <div className="relative">
                            <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="url"
                                className="w-full p-3 pl-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Paste YouTube, TikTok, or Facebook video URL..."
                                value={videoLink}
                                onChange={(e) => setVideoLink(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 ml-1">
                            E.g. YouTube watch link, Facebook video link (avoid fb.watch shortlinks), or TikTok video link (use full links containing /video/).
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-bold text-slate-700">Content</label>
                            {!showComparison && (
                                <button
                                    type="button"
                                    onClick={handleOptimize}
                                    disabled={!body.trim() || isOptimizing}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-sm"
                                >
                                    {isOptimizing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    Optimize & Improve (AI)
                                </button>
                            )}
                        </div>

                        {showComparison ? (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                        <Sparkles className="text-blue-600" size={20} /> AI Review Mode
                                    </h3>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowComparison(false)}
                                            className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 transition flex items-center gap-2 text-sm"
                                        >
                                            <X size={16} /> Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowComparison(false)}
                                            className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-bold hover:bg-blue-50 transition flex items-center gap-2 text-sm"
                                        >
                                            ✏ Keep Editing Original
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBody(optimizedBody);
                                                setShowComparison(false);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2 text-sm shadow-sm"
                                        >
                                            <Check size={16} /> Accept Changes
                                        </button>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Original Draft</div>
                                        <div className="p-4 bg-white border border-slate-200 rounded-xl h-[500px] overflow-y-auto text-slate-600 font-sans leading-relaxed whitespace-pre-wrap shadow-inner">
                                            {body}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-black text-blue-600 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                                            <Sparkles size={12} /> Improved Version
                                        </div>
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl h-[500px] overflow-y-auto text-slate-900 font-sans leading-relaxed whitespace-pre-wrap ring-4 ring-blue-500/10 shadow-inner">
                                            {optimizedBody}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <textarea
                                    required
                                    className="w-full p-4 h-96 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-sans leading-relaxed text-slate-700 shadow-sm"
                                    placeholder="Write your story here..."
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                ></textarea>
                                <p className="text-xs text-slate-400 mt-2 text-right">{body.split(/\s+/).filter(Boolean).length} words</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 rounded-lg font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition shadow-lg flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {isEditing ? 'Update Article' : 'Publish Article'}
                    </button>
                </div>
            </form>
        </div>
    );
}
