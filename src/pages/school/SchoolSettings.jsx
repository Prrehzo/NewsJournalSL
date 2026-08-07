import React, { useState, useEffect } from 'react';
import { Save, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LogoSelector from '../../components/LogoSelector';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { verifyBeforeUpdateEmail } from 'firebase/auth';

export default function SchoolSettings() {
    const { currentUser } = useAuth();
    const [schoolData, setSchoolData] = useState({
        name: '',
        displayName: '',
        email: '',
        description: '',
        logoUrl: '',
        location: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSchool = async () => {
            if (!currentUser?.schoolId) {
                console.warn("SchoolSettings: No schoolId found");
                setLoading(false);
                return;
            }
            try {
                const schoolSnap = await getDoc(doc(db, 'schools', currentUser.schoolId));
                if (schoolSnap.exists()) {
                    setSchoolData(schoolSnap.data());
                }
            } catch (err) {
                console.error("Error fetching school settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchool();
    }, [currentUser]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!currentUser?.schoolId) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'schools', currentUser.schoolId), schoolData);
            
            // Sync to user document for profile picture and email
            await updateDoc(doc(db, "users", currentUser.uid), {
                photoURL: schoolData.logoUrl,
                email: schoolData.email
            });

            if (schoolData.email !== currentUser.email) {
                try {
                    await verifyBeforeUpdateEmail(currentUser, schoolData.email);
                    alert("Settings updated! A verification link has been sent to your new email address. Please verify it to complete the login email change.");
                } catch (emailErr) {
                    console.error("Email update error:", emailErr);
                    alert("Settings updated, but we failed to send the email change verification. You might need to log out and log back in to try again.");
                }
            } else {
                alert("Settings updated successfully!");
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">School Profile Settings</h2>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
                    <h3 className="font-bold text-lg text-slate-800 border-b border-gray-100 pb-2">School Logo</h3>
                    <div className="flex flex-col items-center pb-4">
                        <LogoSelector 
                            selectedLogo={schoolData.logoUrl}
                            onSelect={(url) => setSchoolData({ ...schoolData, logoUrl: url })}
                        />
                        <p className="text-xs text-slate-400 mt-4 text-center max-w-sm">Select your school's official logo from our verified list. If your logo is missing, use the request links above.</p>
                    </div>

                    <h3 className="font-bold text-lg text-slate-800 border-b border-gray-100 pb-2">General Information</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">School Name</label>
                            <input
                                type="text"
                                required
                                value={schoolData.name}
                                onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Contact / Login Email</label>
                            <input
                                type="email"
                                required
                                value={schoolData.email}
                                onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">School Display Name (Public)</label>
                        <input
                            type="text"
                            value={schoolData.displayName || ''}
                            onChange={(e) => setSchoolData({ ...schoolData, displayName: e.target.value })}
                            placeholder="E.g. The Albert Academy News"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">This name will be displayed as the source for all articles from your school.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                            <input
                                type="text"
                                value={schoolData.location}
                                onChange={(e) => setSchoolData({ ...schoolData, location: e.target.value })}
                                placeholder="E.g. Freetown, Sierra Leone"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                            <input
                                type="tel"
                                value={schoolData.phone}
                                onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea
                            value={schoolData.description}
                            onChange={(e) => setSchoolData({ ...schoolData, description: e.target.value })}
                            className="w-full p-3 h-32 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition"
                        ></textarea>
                        <p className="text-xs text-slate-400 mt-1">Short bio shown on your public school page.</p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 rounded-lg font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition shadow-lg flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
