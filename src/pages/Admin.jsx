import { useState, useEffect } from "react";
import { auth, loginWithGoogle, logout, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Trash2, Edit2, Plus, Save, X, LogOut, LogIn, UploadCloud, Home } from "lucide-react";
import { demos as staticDemos } from "../content/demos";

export default function Admin() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [demos, setDemos] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [newDemo, setNewDemo] = useState({ name: "", url: "" });
    const [uploading, setUploading] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", url: "" });

    const authorizedEmail = "natepuls@gmail.com";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        // Real-time listener for demos
        const q = query(collection(db, "demos"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedDemos = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Sort manually by order property
            setDemos(fetchedDemos.sort((a, b) => (a.order || 0) - (b.order || 0)));
        }, (error) => {
            console.error("Firestore listener error:", error);
            alert("Error syncing data: " + error.message);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();

        if (!newDemo.name || newDemo.name.trim() === "") {
            alert("Please enter a demo name.");
            return;
        }

        if (!newDemo.url || newDemo.url.trim() === "") {
            alert("Please paste a URL.");
            return;
        }

        setUploading(true);
        try {
            let finalUrl = newDemo.url;

            // Auto-convert Google Drive links to direct play links
            const driveMatch = finalUrl.match(/\/file\/d\/([^\/]+)/) || finalUrl.match(/id=([^\&]+)/);
            if (driveMatch && (finalUrl.includes("drive.google.com") || finalUrl.includes("docs.google.com"))) {
                finalUrl = `https://docs.google.com/uc?id=${driveMatch[1]}`;
            }

            // DropBox conversion
            if (finalUrl.includes("dropbox.com") && finalUrl.includes("dl=0")) {
                finalUrl = finalUrl.replace("dl=0", "raw=1");
            }

            // Add document to Firestore
            await addDoc(collection(db, "demos"), {
                name: newDemo.name,
                url: finalUrl,
                order: demos.length,
                createdAt: new Date(),
            });

            setNewDemo({ name: "", url: "" });
        } catch (error) {
            console.error("Error adding demo", error);
            alert("Error adding demo: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this demo?")) return;
        try {
            await deleteDoc(doc(db, "demos", id));
        } catch (error) {
            console.error("Error deleting demo", error);
            alert("Error deleting demo: " + error.message);
        }
    };

    const startEdit = (demo) => {
        setEditingId(demo.id);
        setEditForm({ name: demo.name, url: demo.url });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: "", url: "" });
    };

    const saveEdit = async (id) => {
        try {
            await updateDoc(doc(db, "demos", id), {
                name: editForm.name,
                url: editForm.url,
            });
            setEditingId(null);
        } catch (error) {
            console.error("Error updating demo", error);
            alert("Error updating demo: " + error.message);
        }
    };

    const handleMigrate = async () => {
        try {
            for (let i = 0; i < staticDemos.length; i++) {
                const demo = staticDemos[i];
                await addDoc(collection(db, "demos"), {
                    name: demo.name,
                    url: demo.url,
                    order: i,
                    createdAt: new Date(),
                });
            }
        } catch (error) {
            console.error("Error migrating demos", error);
            alert("Error migrating demos: " + error.message);
        }
    };

    if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50">Loading...</div>;

    if (!user) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-sm:w-full border border-slate-100">
                    <h1 className="text-2xl font-bold mb-6 text-slate-800">Admin Login</h1>
                    <button
                        onClick={handleLogin}
                        className="flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-indigo-200"
                    >
                        <LogIn size={20} />
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    if (user.email !== authorizedEmail && authorizedEmail !== "") {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full border border-red-100">
                    <h1 className="text-xl font-bold mb-4 text-red-600">Unauthorized</h1>
                    <p className="text-slate-600 mb-6">You are logged in as {user.email}, but you do not have permission to edit this site.</p>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all border border-slate-200"
                            title="Go to Home"
                        >
                            <Home size={20} />
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900">Manage Demos</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 hidden sm:inline">Logged in as {user.email}</span>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition-all text-sm"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Add New Demo */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 mb-10">
                    <h2 className="text-lg font-semibold mb-6 text-slate-800 flex items-center gap-2">
                        <Plus size={20} className="text-indigo-600" /> Add New Demo
                    </h2>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Demo Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Commercial"
                                value={newDemo.name}
                                required
                                onChange={(e) => setNewDemo({ ...newDemo, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Paste URL</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={newDemo.url}
                                required
                                onChange={(e) => setNewDemo({ ...newDemo, url: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newDemo.name || !newDemo.url || uploading}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-all h-[42px]"
                        >
                            {uploading ? "Adding..." : "Add Demo"}
                        </button>
                    </form>
                    <p className="text-[11px] text-slate-500 mt-4 italic">
                        Tip: For Google Drive links, ensure sharing is set to "Anyone with the link".
                    </p>
                </div>

                {/* List Demos */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Current Demos ({demos.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {demos.length === 0 && (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-4">
                                <p>No demos found in your database.</p>
                                <button
                                    onClick={handleMigrate}
                                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                                >
                                    <UploadCloud size={18} />
                                    Restore Initial Demos
                                </button>
                            </div>
                        )}

                        {demos.map((demo) => (
                            <div key={demo.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                                {editingId === demo.id ? (
                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={editForm.url}
                                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800">{demo.name}</h4>
                                        <p className="text-sm text-slate-500 truncate max-w-lg">{demo.url}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    {editingId === demo.id ? (
                                        <>
                                            <button
                                                onClick={() => saveEdit(demo.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            >
                                                <Save size={20} />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEdit(demo)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(demo.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
