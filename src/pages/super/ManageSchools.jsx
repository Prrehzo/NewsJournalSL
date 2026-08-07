import React, { useState, useEffect } from 'react';
import { Search, MapPin, Mail, Phone, MoreVertical, Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { getSchools } from '../../services/articleService';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { createNotification, getSchoolAdminId } from '../../services/notificationService';

export default function ManageSchools() {
    const { currentUser: superAdmin } = useAuth();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSchoolsData = async () => {
        try {
            const data = await getSchools();
            setSchools(data);
        } catch (err) {
            console.error("Error fetching schools:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchoolsData();
    }, []);

    const updateStatus = async (school, newStatus) => {
        try {
            const updateData = {
                status: newStatus
            };

            if (newStatus === 'approved') {
                updateData.approved_at = serverTimestamp();
                updateData.approved_by = superAdmin?.uid || 'unknown';
                updateData.approved = true;
            }

            await updateDoc(doc(db, 'schools', school.id), updateData);

            // If approved, update the user role
            if (newStatus === 'approved') {
                const usersRef = collection(db, 'users');
                
                // Try searching by schoolId first
                console.log("ManageSchools: Searching for user by schoolId:", school.id);
                let q = query(usersRef, where('schoolId', '==', school.id));
                let querySnapshot = await getDocs(q);

                // Fallback to searching by email if schoolId search yields nothing
                if (querySnapshot.empty) {
                    console.log("ManageSchools: No user found by schoolId, trying email:", school.email);
                    q = query(usersRef, where('email', '==', school.email));
                    querySnapshot = await getDocs(q);
                }

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    console.log("ManageSchools: Updating user role to school_admin for doc:", userDoc.id);
                    await updateDoc(doc(db, 'users', userDoc.id), {
                        role: 'school_admin',
                        schoolId: school.id,
                        schoolName: school.name
                    });
                    alert(`Successfully approved ${school.name} and updated user role.`);
                } else {
                    console.warn("ManageSchools: No user document found for school approval", { id: school.id, email: school.email });
                    alert(`Approved ${school.name}, but couldn't find a user account with email ${school.email} to update their role. They may need to sign up first.`);
                }
            } else {
                alert(`Status updated to ${newStatus} for ${school.name}.`);
            }

            // Notify the school admin about approval/rejection
            try {
                const schoolAdminId = await getSchoolAdminId(school.id);
                if (schoolAdminId) {
                    const isApproved = newStatus === 'approved';
                    await createNotification(schoolAdminId, {
                        type: isApproved ? 'school_approved' : 'school_rejected',
                        title: isApproved ? 'School Approved!' : 'School Application Update',
                        message: isApproved 
                            ? `Congratulations! ${school.name} has been approved. You can now publish articles.`
                            : `Your application for ${school.name} has been updated to "${newStatus}". Please contact support for details.`,
                        link: '/school-admin'
                    });
                }
            } catch (notifErr) {
                console.error('Failed to send notification:', notifErr);
            }

            setSchools(schools.map(s => s.id === school.id ? { ...s, ...updateData } : s));
        } catch (err) {
            console.error("Status update failed:", err);
            if (err.code === 'permission-denied') {
                alert("Insufficient Permissions: Please ensure you have uploaded the 'firestore.rules' file provided in the local directory to your Firebase Console.");
            } else {
                alert("Failed to update status: " + err.message);
            }
        }
    };

    const filtered = schools.filter(s =>
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (s.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Manage Schools</h2>
                <div className="flex gap-4">
                    {schools.some(s => !s.name || !s.email) && (
                        <button
                            onClick={async () => {
                                if (window.confirm("Are you sure you want to delete ALL incomplete records? This cannot be undone.")) {
                                    const incomplete = schools.filter(s => !s.name || !s.email);
                                    for (const school of incomplete) {
                                        await deleteDoc(doc(db, 'schools', school.id));
                                    }
                                    setSchools(schools.filter(s => s.name && s.email));
                                }
                            }}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold text-sm hover:bg-red-100 transition flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Clean Incomplete
                        </button>
                    )}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search schools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                    ) : filtered.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-medium">School</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium">Location</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-center">Reporters</th>
                                    <th className="px-6 py-4 font-medium text-center">Limit</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(school => {
                                    const isIncomplete = !school.name || !school.email;
                                    return (
                                        <tr key={school.id} className={`hover:bg-gray-50 transition ${isIncomplete ? 'bg-red-50/50 outline outline-1 outline-red-100' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {school.logoUrl ? (
                                                        <img src={school.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                            {school.name ? school.name.charAt(0) : '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-slate-900">{school.name || <span className="text-red-600 italic font-bold">Incomplete Record</span>}</div>
                                                        <div className="text-xs text-slate-400">ID: {school.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex items-center gap-2 mb-1"><Mail size={14} /> {school.email || 'Missing Email'}</div>
                                                {school.phone && <div className="flex items-center gap-2"><Phone size={14} /> {school.phone}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex items-center gap-2"><MapPin size={14} /> {school.location || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border uppercase ${school.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    school.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {school.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={async () => {
                                                        const newVal = !school.reportersEnabled;
                                                        try {
                                                            await updateDoc(doc(db, 'schools', school.id), { reportersEnabled: newVal });
                                                            setSchools(schools.map(s => s.id === school.id ? { ...s, reportersEnabled: newVal } : s));
                                                        } catch (err) {
                                                            console.error("Failed to toggle reporters:", err);
                                                            alert("Failed to update reporter setting.");
                                                        }
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        school.reportersEnabled !== false 
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {school.reportersEnabled !== false ? 'Enabled' : 'Disabled'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={school.reporterLimit || 5}
                                                    onChange={async (e) => {
                                                        const newVal = parseInt(e.target.value) || 5;
                                                        try {
                                                            await updateDoc(doc(db, 'schools', school.id), { reporterLimit: newVal });
                                                            setSchools(schools.map(s => s.id === school.id ? { ...s, reporterLimit: newVal } : s));
                                                        } catch (err) {
                                                            console.error("Failed to update reporter limit:", err);
                                                        }
                                                    }}
                                                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {school.status === 'pending' && !isIncomplete && (
                                                        <button
                                                            onClick={() => {
                                                                updateStatus(school, 'approved');
                                                                console.log(`Notification: Approved ${school.name}. Email sent to ${school.email}`);
                                                            }}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`Are you sure you want to PERMANENTLY delete ${school.name || 'this incomplete record'}? This action cannot be undone.`)) {
                                                                try {
                                                                    await deleteDoc(doc(db, 'schools', school.id));
                                                                    setSchools(schools.filter(s => s.id !== school.id));
                                                                } catch (err) {
                                                                    console.error("Delete failed:", err);
                                                                    alert("Failed to delete school");
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-900 hover:bg-red-100 rounded-lg transition"
                                                        title="Delete Permanently"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 text-center text-slate-400 italic">No schools found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
