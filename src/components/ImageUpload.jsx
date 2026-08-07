import React, { useState, useEffect } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ImageUpload({ onUploadComplete, folder = 'uploads', initialUrl = '' }) {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(initialUrl);

    useEffect(() => {
        if (initialUrl) {
            setPreview(initialUrl);
        }
    }, [initialUrl]);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit to images and 5MB (imgBB supports up to 32MB)
        if (!file.type.startsWith('image/')) {
            setError("Please upload an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB.");
            return;
        }

        const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
        if (!apiKey || apiKey === 'YOUR_IMGBB_API_KEY_HERE') {
            setError("imgBB API key is not configured in .env file.");
            return;
        }

        setError(null);
        setUploading(true);
        setProgress(0);

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('image', file);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const p = (event.loaded / event.total) * 100;
                setProgress(p);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success && response.data && response.data.url) {
                        const downloadURL = response.data.url;
                        setPreview(downloadURL);
                        onUploadComplete(downloadURL);
                    } else {
                        setError(response.error?.message || "Upload failed. Image service rejected the file.");
                    }
                } catch (err) {
                    setError("Failed to parse response from image service.");
                }
            } else {
                setError(`Upload failed with status: ${xhr.status}`);
            }
            setUploading(false);
        });

        xhr.addEventListener('error', () => {
            setError("Upload failed due to a network error.");
            setUploading(false);
        });

        xhr.open('POST', `https://api.imgbb.com/1/upload?key=${apiKey}`);
        xhr.send(formData);
    };

    const clearPreview = () => {
        setPreview('');
        onUploadComplete('');
    };

    return (
        <div className="space-y-4">
            <div className="relative group w-32 h-32 mx-auto">
                <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-center items-center justify-center overflow-hidden bg-slate-50 transition-all ${error ? 'border-red-300' : 'border-slate-200 group-hover:border-blue-400'}`}>
                    {preview ? (
                        <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
                    ) : uploading ? (
                        <div className="flex flex-col items-center gap-2">
                             <Loader2 className="animate-spin text-blue-600" size={24} />
                             <span className="text-[10px] font-bold text-blue-600">{Math.round(progress)}%</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-500">
                            <Upload size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                        </div>
                    )}
                </div>

                {!uploading && (
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleUpload}
                        accept="image/*"
                    />
                )}

                {preview && !uploading && (
                    <button
                        onClick={clearPreview}
                        className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-600 shadow-sm transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold justify-center uppercase tracking-wider bg-red-50 p-2 rounded-lg border border-red-100 italic">
                    <AlertCircle size={12} /> {error}
                </div>
            )}
            
            {preview && !uploading && !error && (
                <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold justify-center uppercase tracking-wider bg-green-50 p-2 rounded-lg border border-green-100">
                    <CheckCircle2 size={12} /> Ready to save
                </div>
            )}
        </div>
    );
}
