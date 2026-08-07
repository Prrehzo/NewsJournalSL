import React, { useState, useEffect } from 'react';
import { Save, Shield, Globe, Bell, Mail, Loader2, CheckCircle2, User } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../../components/ImageUpload';

export default function SuperSettings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    
    // Platform Settings
    const [settings, setSettings] = useState({
        siteName: 'News Journal SL',
        contactEmail: 'prrehzo@gmail.com',
        maintenanceMode: false,
        enableRegistration: true,
        notifyOnNewSchool: true
    });

    // Personal Profile
    const [profile, setProfile] = useState({
        displayName: '',
        photoURL: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Platform Settings
                const settingsSnap = await getDoc(doc(db, 'settings', 'platform'));
                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.data());
                }

                // Fetch User Profile
                if (currentUser) {
                    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setProfile({
                            displayName: data.displayName || '',
                            photoURL: data.photoURL || ''
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Save Platform Settings
            await setDoc(doc(db, 'settings', 'platform'), settings, { merge: true });

            // Save Personal Profile
            if (currentUser) {
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    displayName: profile.displayName,
                    photoURL: profile.photoURL
                });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
                    <p className="text-slate-500">Manage global configurations for the News Journal SL platform.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Profile */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <User size={18} className="text-blue-600" /> My Personal Profile
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-shrink-0">
                                <ImageUpload 
                                    onUploadComplete={(url) => setProfile({ ...profile, photoURL: url })} 
                                    folder="admins" 
                                    initialUrl={profile.photoURL} 
                                />
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Avatar</p>
                            </div>
                            <div className="flex-grow w-full space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Display Name</label>
                                    <input
                                        type="text"
                                        placeholder="Admin Name"
                                        value={profile.displayName}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Login Email</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={currentUser?.email || ''}
                                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-slate-400 italic">Email cannot be changed from this panel.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Globe size={18} className="text-blue-600" /> General Configuration
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Site Name</label>
                                <input
                                    type="text"
                                    value={settings.siteName}
                                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Support Email</label>
                                <input
                                    type="email"
                                    value={settings.contactEmail}
                                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Controls */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Shield size={18} className="text-blue-600" /> Platform Controls
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <div className="font-bold text-slate-900">New School Registration</div>
                                <div className="text-sm text-slate-500">Allow new schools to submit registration applications.</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableRegistration}
                                    onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg border border-red-100">
                            <div>
                                <div className="font-bold text-red-900">Maintenance Mode</div>
                                <div className="text-sm text-red-600">Disable platform access for all users except Super Admins.</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Bell size={18} className="text-blue-600" /> Notifications
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail size={18} /></div>
                                <div>
                                    <div className="font-bold text-slate-900">School Application Alerts</div>
                                    <div className="text-sm text-slate-500">Receive email notifications for new school registrations.</div>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifyOnNewSchool}
                                    onChange={(e) => setSettings({ ...settings, notifyOnNewSchool: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Settings
                    </button>
                    {saved && (
                        <span className="flex items-center gap-2 text-green-600 font-medium animate-in fade-in slide-in-from-left-2">
                            <CheckCircle2 size={20} /> Settings saved successfully!
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
