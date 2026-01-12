
import { useState } from 'react';
import { Loader2, Link as LinkIcon, Trash2, AlertCircle } from 'lucide-react';

interface EditLinkModalProps {
    currentUrl: string;
    onSave: (newUrl: string) => void;
    onClose: () => void;
}

export function EditLinkModal({ currentUrl, onSave, onClose }: EditLinkModalProps) {
    const [url, setUrl] = useState(currentUrl);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-indigo-600" />
                        Edit Demo Link
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Update the live preview URL for this project.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Website / Demo URL
                            </label>
                            <input
                                type="url"
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Save URL
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface ConfirmDeleteModalProps {
    title: string;
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
}

export function ConfirmDeleteModal({ title, onConfirm, onClose, loading = false }: ConfirmDeleteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Trash2 className="w-6 h-6" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Project?</h2>
                    <p className="text-slate-500 text-center mb-6">
                        Are you sure you want to remove <span className="font-semibold text-slate-900">"{title}"</span> from your showcase? This cannot be undone.
                    </p>

                    <div className="flex justify-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Yes, delete it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
