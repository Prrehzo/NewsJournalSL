import React, { useState, useEffect } from 'react';
import { Video, Save, ArrowLeft, Loader2, User } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createArticle, getArticleById, updateArticle } from '../../services/articleService';
import { createNotificationForMany, getSuperAdminIds } from '../../services/notificationService';
import ImageUpload from '../../components/ImageUpload';
import RichTextEditor from '../../components/RichTextEditor';

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
                const docRef = await createArticle(articleData);
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

                // 4 & 5. Send OneSignal push to opted-in subscribers
                try {
                    const pushPayload = {
                        title: title,
                        schoolName: articleData.schoolName,
                        url: `${window.location.origin}/article/${docRef.id}`
                    };
                    
                    await fetch('/api/sendPush', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(pushPayload),
                    });
                } catch (pushErr) {
                    // Do not fail the article publish if push fails
                    console.error('Failed to send push notification:', pushErr);
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

    // AI optimization disabled — editor handles formatting manually.
    // The optimizeArticle function is preserved in src/services/aiService.js for future premium use.

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
                        <label className="block text-sm font-bold text-slate-700">Content</label>
                        <RichTextEditor value={body} onChange={setBody} />
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
