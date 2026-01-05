import { useState, useEffect } from "react";
import { auth, loginWithGoogle, logout, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, writeBatch, setDoc, getDocs, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import {
    Trash2, Edit2, Plus, Save, X, LogOut, LogIn, UploadCloud,
    Home, ArrowUp, ArrowDown, Music, Video, Mic, Users,
    MessageSquare, Contact, Info, Settings, RefreshCcw
} from "lucide-react";
import { demos as staticDemos } from "../content/demos";

// const authorizedEmail = "natepuls@gmail.com";
const authorizedEmail = ""; // Disabled for multi-user support

export default function Admin() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("demos");
    const [uploading, setUploading] = useState(false);

    // Data States
    const [demos, setDemos] = useState([]);
    const [videos, setVideos] = useState([]);
    const [studio, setStudio] = useState([]);
    const [clients, setClients] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [siteContent, setSiteContent] = useState({
        heroTitle: "",
        heroSubtitle: "",
        aboutTitle: "",
        aboutText: "",
        contactEmail: "",
        contactPhone: "",
        siteName: "",
        profileImage: "",
        profileCartoon: "",
        themeColor: "#4f46e5"
    });

    // Form States
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Create Form States
    const [newDemo, setNewDemo] = useState({ name: "", url: "" });
    const [newVideo, setNewVideo] = useState({ youtubeId: "", title: "" });
    const [newStudio, setNewStudio] = useState({ name: "", url: "" });
    const [newClient, setNewClient] = useState({ url: "" });
    const [newReview, setNewReview] = useState({ text: "", author: "" });
    const [fetchingTitle, setFetchingTitle] = useState(false);

    // Fetch YouTube video title
    const fetchYouTubeTitle = async (videoIdOrUrl) => {
        try {
            setFetchingTitle(true);

            // Extract ID if it's a URL
            let videoId = videoIdOrUrl;
            if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
                const patterns = [
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/,
                    /youtube\.com\/watch\?.*v=([^&?\/\s]+)/
                ];

                for (const pattern of patterns) {
                    const match = videoIdOrUrl.match(pattern);
                    if (match && match[1]) {
                        videoId = match[1];
                        break;
                    }
                }
            }

            // Fetch title using YouTube oEmbed API (no API key needed!)
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Fetched YouTube title:', data.title);
                setNewVideo(prev => ({ ...prev, title: data.title, youtubeId: videoId }));
            } else {
                console.warn('⚠️ Could not fetch title, using ID as-is');
                setNewVideo(prev => ({ ...prev, youtubeId: videoId }));
            }
        } catch (error) {
            console.error('❌ Error fetching YouTube title:', error);
            // Still set the ID even if title fetch fails
            setNewVideo(prev => ({ ...prev, youtubeId: videoIdOrUrl }));
        } finally {
            setFetchingTitle(false);
        }
    };

    // Automatically fetch YouTube title when the ID or URL changes
    useEffect(() => {
        if (newVideo.youtubeId && !newVideo.title && !fetchingTitle) {
            fetchYouTubeTitle(newVideo.youtubeId);
        }
    }, [newVideo.youtubeId]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // Store user email in Firestore for identification/search
            if (currentUser) {
                try {
                    await setDoc(doc(db, "users", currentUser.uid), {
                        email: currentUser.email,
                        lastSeen: new Date()
                    }, { merge: true });
                } catch (err) {
                    console.error("Error updating user record:", err);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Firestore Listeners
    useEffect(() => {
        if (!user) return;

        const syncCollection = (collName, setter) => {
            return onSnapshot(query(collection(db, "users", user.uid, collName)), (snapshot) => {
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(docs.sort((a, b) => (a.order || 0) - (b.order || 0)));
            }, (err) => console.error(`Error syncing ${collName}:`, err));
        };

        const unsubDemos = syncCollection("demos", setDemos);
        const unsubVideos = syncCollection("videos", setVideos);
        const unsubStudio = syncCollection("studio", setStudio);
        const unsubClients = syncCollection("clients", setClients);
        const unsubReviews = syncCollection("reviews", setReviews);

        const unsubContent = onSnapshot(doc(db, "users", user.uid, "settings", "siteContent"), (doc) => {
            if (doc.exists()) {
                setSiteContent(doc.data());
            }
        });

        return () => {
            unsubDemos(); unsubVideos(); unsubStudio(); unsubClients(); unsubReviews(); unsubContent();
        };
    }, [user]);

    // ------------------------------------------------------------
    // Hash‑based routing for admin tabs (single source of truth)
    // ------------------------------------------------------------
    const tabs = [
        { id: "demos", name: "Demos", icon: <Music size={18} /> },
        { id: "videos", name: "Projects", icon: <Video size={18} /> },
        { id: "studio", name: "Studio", icon: <Mic size={18} /> },
        { id: "clients", name: "Clients", icon: <Users size={18} /> },
        { id: "reviews", name: "Reviews", icon: <MessageSquare size={18} /> },
        { id: "content", name: "Site Content", icon: <Settings size={18} /> },
    ];

    // Sync active tab with URL hash on mount and when hash changes
    useEffect(() => {
        const syncTabWithHash = () => {
            const hash = window.location.hash.replace(/^#/, "");
            if (hash && tabs.find(t => t.id === hash)) {
                setActiveTab(hash);
            }
        };
        // Initial sync
        syncTabWithHash();
        // Listen for future hash changes (e.g., manual URL edits)
        window.addEventListener("hashchange", syncTabWithHash);
        return () => {
            window.removeEventListener("hashchange", syncTabWithHash);
        };
    }, []);

    // Click handler that also updates the URL hash for bookmarking
    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        setEditingId(null);
        window.location.hash = tabId;
    };

    const handleLogin = async () => {
        try { await loginWithGoogle(); } catch (error) { console.error("Login failed", error); }
    };

    // Generic Handlers
    const addItem = async (collName, data, resetter) => {
        setUploading(true);
        try {
            const list = collName === "demos" ? demos : collName === "videos" ? videos : collName === "studio" ? studio : collName === "clients" ? clients : reviews;

            let finalData = { ...data };

            // Auto-extract YouTube ID from URL if needed
            if (collName === "videos" && finalData.youtubeId) {
                const youtubeId = finalData.youtubeId;
                // Check if it's a URL and extract the ID
                if (youtubeId.includes('youtube.com') || youtubeId.includes('youtu.be')) {
                    const patterns = [
                        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/,
                        /youtube\.com\/watch\?.*v=([^&?\/\s]+)/
                    ];

                    for (const pattern of patterns) {
                        const match = youtubeId.match(pattern);
                        if (match && match[1]) {
                            finalData.youtubeId = match[1];
                            console.log(`🔗 Extracted YouTube ID: ${match[1]} from URL`);
                            break;
                        }
                    }
                }
            }

            console.log(`📝 Adding ${collName} item:`, finalData);

            if (collName === "demos" && finalData.url) {
                const driveMatch = finalData.url.match(/\/file\/d\/([^\/]+)/) || finalData.url.match(/id=([^\&]+)/);
                if (driveMatch && (finalData.url.includes("drive.google.com") || finalData.url.includes("docs.google.com"))) {
                    finalData.url = `https://docs.google.com/uc?id=${driveMatch[1]}`;
                }
                if (finalData.url.includes("dropbox.com") && finalData.url.includes("dl=0")) {
                    finalData.url = finalData.url.replace("dl=0", "raw=1");
                }
            }

            const docRef = await addDoc(collection(db, "users", user.uid, collName), {
                ...finalData,
                order: list.length,
                createdAt: new Date(),
            });

            console.log(`✅ ${collName} item added successfully! ID:`, docRef.id);
            resetter();
        } catch (error) {
            console.error(`❌ Error adding ${collName}:`, error);
            alert(`Error adding item: ` + error.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteItem = async (collName, id) => {
        if (!confirm("Are you sure?")) return;
        try { await deleteDoc(doc(db, "users", user.uid, collName, id)); }
        catch (error) { alert("Error deleting: " + error.message); }
    };

    const handleMove = async (collName, index, direction) => {
        const list = collName === "demos" ? demos : collName === "videos" ? videos : collName === "studio" ? studio : collName === "clients" ? clients : reviews;
        const newList = [...list];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newList.length) return;

        const [movedItem] = newList.splice(index, 1);
        newList.splice(targetIndex, 0, movedItem);

        const batch = writeBatch(db);
        newList.forEach((item, i) => {
            batch.update(doc(db, "users", user.uid, collName, item.id), { order: i });
        });

        try { await batch.commit(); }
        catch (error) { alert("Error reordering: " + error.message); }
    };

    const updateItem = async (collName, id) => {
        setUploading(true);
        try {
            const { id: _, ...dataToUpdate } = editForm;
            await updateDoc(doc(db, "users", user.uid, collName, id), dataToUpdate);
            setEditingId(null);
        } catch (error) {
            alert("Error updating: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const saveSettings = async (e) => {
        if (e) e.preventDefault();
        setUploading(true);
        try {
            await setDoc(doc(db, "users", user.uid, "settings", "siteContent"), siteContent);
            alert("Site content saved successfully!");
        } catch (error) {
            console.error("Save failed:", error);
            if (error.code === 'permission-denied') {
                alert("PERMISSION ERROR: You must update your Firestore Rules in the Firebase Console to allow saving. See FIREBASE_SETUP.md for instructions.");
            } else {
                alert("Error saving settings: " + error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleRestoreAll = async () => {
        if (!confirm("This will overwrite your site settings and add initial demos, projects, reviews, and gear. Continue?")) return;

        console.log("🔄 Starting content restoration...");
        setUploading(true);

        try {
            // Check authentication
            if (!user) {
                throw new Error("You must be logged in to restore content");
            }

            console.log("✅ User authenticated:", user.email);

            // Helper to clear existing collection
            const clearCollection = async (collName) => {
                const q = query(collection(db, "users", user.uid, collName));
                const snapshot = await getDocs(q);
                const batch = writeBatch(db);
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`🧹 Cleared ${snapshot.size} items from ${collName}`);
            };

            let totalAdded = 0;

            // 1. Demos
            console.log("🧹 Clearing & Adding demos...");
            await clearCollection("demos");
            for (const demo of staticDemos) {
                await addDoc(collection(db, "users", user.uid, "demos"), {
                    ...demo,
                    order: staticDemos.indexOf(demo),
                    createdAt: new Date()
                });
                totalAdded++;
            }
            console.log(`✅ Added ${staticDemos.length} demos`);

            // 2. Videos
            console.log("🧹 Clearing & Adding videos...");
            await clearCollection("videos");
            const initialVideos = [
                { youtubeId: "lskrj62JbNI", title: "Freeletics Commercial" },
                { youtubeId: "C-GdK49QZVs", title: "Getinge Medical" },
                { youtubeId: "QVTGS9ZAk60", title: "Florida State Parks" },
                { youtubeId: "friJGg6UDvo", title: "FarmersOnly.com" }
            ];
            for (let i = 0; i < initialVideos.length; i++) {
                await addDoc(collection(db, "users", user.uid, "videos"), {
                    ...initialVideos[i],
                    order: i,
                    createdAt: new Date()
                });
                totalAdded++;
            }
            console.log(`✅ Added ${initialVideos.length} videos`);

            // 3. Studio Gear
            console.log("🧹 Clearing & Adding studio gear...");
            await clearCollection("studio");
            const initialStudio = [
                { name: "Neumann TLM 103", url: "/studio-images/neumann-tlm-103.png" },
                { name: "Rode NTG-3", url: "/studio-images/rode-ntg-3.jpg" },
                { name: "Macbook Pro", url: "/studio-images/macbook-pro.png" },
                { name: "Apogee Duet", url: "/studio-images/apogee-duet.png" },
                { name: "Logic Pro X", url: "/studio-images/logic-pro-x.jpeg" },
                { name: "Source Connect", url: "/studio-images/source-connect.jpeg" },
            ];
            for (let i = 0; i < initialStudio.length; i++) {
                await addDoc(collection(db, "users", user.uid, "studio"), {
                    ...initialStudio[i],
                    order: i,
                    createdAt: new Date()
                });
                totalAdded++;
            }
            console.log(`✅ Added ${initialStudio.length} studio items`);

            // 4. Clients
            console.log("🧹 Clearing & Adding clients...");
            await clearCollection("clients");
            const initialClients = [
                "/client-images/apple.jpeg", "/client-images/farmers-only.jpeg", "/client-images/florida-state-parks.jpeg",
                "/client-images/freeletics.jpeg", "/client-images/gatorade.png", "/client-images/hp.jpeg",
                "/client-images/ziploc.jpeg", "/client-images/lavazza.jpeg", "/client-images/smart-design.jpeg",
                "/client-images/waste-management.jpeg"
            ];
            for (let i = 0; i < initialClients.length; i++) {
                await addDoc(collection(db, "users", user.uid, "clients"), {
                    url: initialClients[i],
                    order: i,
                    createdAt: new Date()
                });
                totalAdded++;
            }
            console.log(`✅ Added ${initialClients.length} clients`);

            // 5. Reviews
            console.log("🧹 Clearing & Adding reviews...");
            await clearCollection("reviews");
            const initialReviews = [
                { text: "Nathan is a joy to work with.", author: "BookheadEd Learning" },
                { text: "Above and beyond.", author: "Segal Benz" },
                { text: "Never thought of putting an accent on my recording.", author: "Mr. Wizard, Inc" },
                { text: "Fast delivery, followed direction perfectly!", author: "Sonya Fernandes" },
                { text: "Great flexibility and quality.", author: "Jasper Dekker / Smart Design" },
            ];
            for (let i = 0; i < initialReviews.length; i++) {
                await addDoc(collection(db, "users", user.uid, "reviews"), {
                    ...initialReviews[i],
                    order: i,
                    createdAt: new Date()
                });
                totalAdded++;
            }
            console.log(`✅ Added ${initialReviews.length} reviews`);

            // 6. Site Content
            console.log("⚙️ Setting site content...");
            await setDoc(doc(db, "users", user.uid, "settings", "siteContent"), {
                heroTitle: "Saying Things",
                heroSubtitle: "Professional Voice Over services tailored to bring your script to life.",
                aboutTitle: "It all started with acting in Los Angeles.",
                aboutText: "Now, with over a decade of experience in voice over and improv comedy I'm excited to bring your script to life! Currently based in the vibrant city of Houston, I'm ready to collaborate with you to create something truly amazing.",
                contactEmail: "nathan@sayingthings.com",
                contactPhone: "323-395-8384",
                siteName: "Nathan Puls",
                profileImage: "/images/profile.jpeg",
                profileCartoon: "/images/profile-cartoon-no-bg.png",
                themeColor: "#4f46e5"
            });
            console.log("✅ Site settings saved");

            console.log(`✅ All content successfully restored! Total items: ${totalAdded}`);

            alert(`✅ Success! Restored ${totalAdded} items:\n\n• ${staticDemos.length} Demos\n• ${initialVideos.length} Projects\n• ${initialStudio.length} Studio items\n• ${initialClients.length} Clients\n• ${initialReviews.length} Reviews\n• Site settings\n\nRefresh the page to see all content!`);
        } catch (error) {
            console.error("❌ Restoration failed:", error);
            console.error("Error details:", {
                code: error.code,
                message: error.message,
                stack: error.stack
            });

            if (error.code === 'permission-denied') {
                alert("🚫 PERMISSION DENIED\n\nYour Firestore security rules are blocking this operation.\n\nPlease update your rules in the Firebase Console:\n1. Go to Firestore Database → Rules\n2. Update the rules as shown in FIREBASE_SETUP.md\n3. Click Publish\n\nError: " + error.message);
            } else {
                alert("❌ Restoration Error\n\n" + error.message + "\n\nCheck the browser console (F12) for more details.");
            }
        } finally {
            setUploading(false);
        }
    };

    const handleMigrateLegacy = async () => {
        if (!confirm("This will copy all data from the legacy PUBLIC database to your PRIVATE user profile. \n\nUse this only if you have existing data you want to move to your new account.\n\nContinue?")) return;

        setUploading(true);
        console.log("🚀 Starting migration...");

        try {
            const collectionsToMigrate = ["demos", "videos", "studio", "clients", "reviews"];
            let totalMoved = 0;

            // 1. Migrate Collections
            for (const colName of collectionsToMigrate) {
                console.log(`📦 Migrating ${colName}...`);
                const snapshot = await getDocs(collection(db, colName));

                if (!snapshot.empty) {
                    const batch = writeBatch(db);
                    snapshot.docs.forEach(docSnap => {
                        const newRef = doc(db, "users", user.uid, colName, docSnap.id);
                        batch.set(newRef, docSnap.data());
                        totalMoved++;
                    });
                    await batch.commit();
                }
            }

            // 2. Migrate Settings
            console.log("⚙️ Migrating settings...");
            const settingsSnap = await getDoc(doc(db, "settings", "siteContent"));
            if (settingsSnap.exists()) {
                await setDoc(doc(db, "users", user.uid, "settings", "siteContent"), settingsSnap.data());
                totalMoved++;
            }

            alert(`✅ Migration Complete! Copied ${totalMoved} items to your private profile.`);

        } catch (error) {
            console.error("Migration failed:", error);
            if (error.code === 'permission-denied') {
                alert("PERMISSION DENIED: You cannot read the old public data or write to your new profile. Check console for details.");
            } else {
                alert("Migration failed: " + error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteLegacy = async () => {
        if (!confirm("⚠️ DANGER ZONE ⚠️\n\nThis will PERMANENTLY DELETE all data from the PUBLIC root collections (Demos, Videos, etc).\n\nOnly do this if you have already migrated your data to your private profile.\n\nAre you sure?")) return;

        if (!confirm("Final Output: Are you absolutely sure? This cannot be undone.")) return;

        setUploading(true);
        console.log("🔥 nuke initiated...");

        try {
            const collectionsToDelete = ["demos", "videos", "studio", "clients", "reviews"];
            let totalDeleted = 0;

            for (const colName of collectionsToDelete) {
                console.log(`🗑️ Deleting ${colName}...`);
                const snapshot = await getDocs(collection(db, colName));
                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                    totalDeleted++;
                });
                await batch.commit();
            }

            // Delete Settings
            await deleteDoc(doc(db, "settings", "siteContent"));
            totalDeleted++;

            alert(`✅ Cleanup Complete! Deleted ${totalDeleted} public items.`);

        } catch (error) {
            console.error("Cleanup failed:", error);
            alert("Error: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50 font-medium">Loading...</div>;

    if (!user) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100 max-w-sm w-full">
                    <h1 className="text-2xl font-bold mb-6 text-slate-800">Admin Login</h1>
                    <button onClick={handleLogin} className="flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-100">
                        <LogIn size={20} /> Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    if (user.email !== authorizedEmail && authorizedEmail !== "") {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-50 p-4 font-medium">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-red-100 max-w-sm w-full">
                    <h1 className="text-xl font-bold mb-4 text-red-600">Unauthorized</h1>
                    <p className="text-slate-600 mb-6">Access denied for {user.email}</p>
                    <button onClick={logout} className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-all">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>
        );
    }

    const currentTabTitle = tabs.find(t => t.id === activeTab)?.name;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold italic shadow-lg shadow-indigo-100">S</div>
                    <span className="font-bold text-slate-800 tracking-tight text-lg">Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                    <div className="pt-4 mt-4 border-t border-slate-50">
                        <button onClick={handleRestoreAll} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                            <RefreshCcw size={18} /> Restore Initial
                        </button>
                        <button onClick={handleMigrateLegacy} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all mt-1">
                            <UploadCloud size={18} /> Migrate Legacy Data
                        </button>
                        <button onClick={handleDeleteLegacy} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:text-red-600 hover:bg-red-50 transition-all mt-4 border-t border-slate-50 pt-4">
                            <Trash2 size={18} /> Delete Legacy Data
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 px-4 mb-2 truncate font-medium" title={user?.email}>
                        Signed in as: {user?.email}
                    </p>
                    <Link to={user ? `/u/${user.uid}` : "/"} target="_blank" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-2">
                        <Home size={18} /> View Site
                    </Link>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-10 min-h-screen overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10 flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{currentTabTitle}</h1>
                            <p className="text-slate-500 font-medium">Manage your website's {activeTab} content.</p>
                        </div>
                    </header>

                    {/* Demos Tab */}
                    {activeTab === "demos" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <form onSubmit={(e) => { e.preventDefault(); addItem("demos", newDemo, () => setNewDemo({ name: "", url: "" })); }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <FormInput label="Demo Name" placeholder="e.g. Commercial" value={newDemo.name} onChange={v => setNewDemo({ ...newDemo, name: v })} />
                                <FormInput label="Audio URL" placeholder="https://..." value={newDemo.url} onChange={v => setNewDemo({ ...newDemo, url: v })} />
                                <button type="submit" disabled={uploading || !newDemo.name || !newDemo.url} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">Add Demo</button>
                            </form>
                            <ItemList items={demos} collName="demos" onMove={handleMove} onDelete={deleteItem} editingId={editingId} setEditingId={setEditingId} editForm={editForm} setEditForm={setEditForm} onSave={updateItem} onCancel={() => setEditingId(null)} fields={[{ key: 'name', label: 'Name' }, { key: 'url', label: 'Audio URL' }]} />
                        </div>
                    )}

                    {/* Videos Tab */}
                    {activeTab === "videos" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">


                            <form onSubmit={(e) => { e.preventDefault(); addItem("videos", newVideo, () => setNewVideo({ youtubeId: "", title: "" })); }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <FormInput
                                            label="YouTube Video ID or URL"
                                            placeholder="Paste YouTube URL (title will auto-fetch)"
                                            value={newVideo.youtubeId}
                                            onChange={v => setNewVideo({ ...newVideo, youtubeId: v })}
                                        />

                                    </div>
                                    <FormInput
                                        label="Video Title (optional - auto-fetched)"
                                        placeholder="Will be fetched automatically or enter custom title"
                                        value={newVideo.title}
                                        onChange={v => setNewVideo({ ...newVideo, title: v })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploading || !newVideo.youtubeId || fetchingTitle}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                                >
                                    {fetchingTitle ? 'Fetching Title...' : 'Add Project'}
                                </button>
                            </form>
                            <ItemList items={videos} collName="videos" onMove={handleMove} onDelete={deleteItem} editingId={editingId} setEditingId={setEditingId} editForm={editForm} setEditForm={setEditForm} onSave={updateItem} onCancel={() => setEditingId(null)} fields={[{ key: 'title', label: 'Title' }, { key: 'youtubeId', label: 'YouTube ID' }]} />
                        </div>
                    )}

                    {/* Studio Tab */}
                    {activeTab === "studio" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <form onSubmit={(e) => { e.preventDefault(); addItem("studio", newStudio, () => setNewStudio({ name: "", url: "" })); }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <FormInput label="Gear Name" placeholder="e.g. Neumann TLM 103" value={newStudio.name} onChange={v => setNewStudio({ ...newStudio, name: v })} />
                                <FormInput label="Image URL" placeholder="https://..." value={newStudio.url} onChange={v => setNewStudio({ ...newStudio, url: v })} />
                                <button type="submit" disabled={uploading || !newStudio.name || !newStudio.url} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">Add Gear</button>
                            </form>
                            <ItemList items={studio} collName="studio" onMove={handleMove} onDelete={deleteItem} editingId={editingId} setEditingId={setEditingId} editForm={editForm} setEditForm={setEditForm} onSave={updateItem} onCancel={() => setEditingId(null)} fields={[{ key: 'name', label: 'Gear Name' }, { key: 'url', label: 'Image URL' }]} />
                        </div>
                    )}

                    {/* Clients Tab */}
                    {activeTab === "clients" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <form onSubmit={(e) => { e.preventDefault(); addItem("clients", newClient, () => setNewClient({ url: "" })); }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-end">
                                <FormInput label="Client Logo URL" placeholder="https://..." value={newClient.url} onChange={v => setNewClient({ url: v })} containerClass="flex-1" />
                                <button type="submit" disabled={uploading || !newClient.url} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">Add Client</button>
                            </form>
                            <ItemList items={clients} collName="clients" onMove={handleMove} onDelete={deleteItem} editingId={editingId} setEditingId={setEditingId} editForm={editForm} setEditForm={setEditForm} onSave={updateItem} onCancel={() => setEditingId(null)} fields={[{ key: 'url', label: 'Logo URL' }]} />
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === "reviews" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <form onSubmit={(e) => { e.preventDefault(); addItem("reviews", newReview, () => setNewReview({ text: "", author: "" })); }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 grid gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Review Text" textarea value={newReview.text} onChange={v => setNewReview({ ...newReview, text: v })} />
                                    <FormInput label="Author Name" value={newReview.author} onChange={v => setNewReview({ ...newReview, author: v })} />
                                </div>
                                <button type="submit" disabled={uploading || !newReview.text || !newReview.author} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 self-end disabled:opacity-50">Add Review</button>
                            </form>
                            <ItemList items={reviews} collName="reviews" onMove={handleMove} onDelete={deleteItem} editingId={editingId} setEditingId={setEditingId} editForm={editForm} setEditForm={setEditForm} onSave={updateItem} onCancel={() => setEditingId(null)} fields={[{ key: 'text', label: 'Review' }, { key: 'author', label: 'Author' }]} />
                        </div>
                    )}

                    {/* Site Content Tab */}
                    {activeTab === "content" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <form onSubmit={saveSettings} className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <Section title="Hero Section" icon={<Settings size={18} />}>
                                        <div className="space-y-6">
                                            <Field label="Site Name" value={siteContent.siteName} onChange={v => setSiteContent({ ...siteContent, siteName: v })} />
                                            <Field label="Hero Title" value={siteContent.heroTitle} onChange={v => setSiteContent({ ...siteContent, heroTitle: v })} />
                                            <Field label="Hero Subtitle" value={siteContent.heroSubtitle} onChange={v => setSiteContent({ ...siteContent, heroSubtitle: v })} />
                                        </div>
                                    </Section>
                                    <Section title="Theme & Appearance" icon={<Settings size={18} />}>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="color"
                                                    value={siteContent.themeColor || "#4f46e5"}
                                                    onChange={e => setSiteContent({ ...siteContent, themeColor: e.target.value })}
                                                    className="h-12 w-24 p-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                                                />
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-tight">Primary Brand Color</label>
                                                    <p className="text-sm text-slate-500">Pick a color for buttons, icons, and highlights.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Section>
                                    <Section title="About & Images" icon={<Info size={18} />}>
                                        <div className="space-y-6">
                                            <Field label="About Title" value={siteContent.aboutTitle} onChange={v => setSiteContent({ ...siteContent, aboutTitle: v })} />
                                            <Field label="About Text" textarea value={siteContent.aboutText} onChange={v => setSiteContent({ ...siteContent, aboutText: v })} />
                                            <Field label="Profile Image URL" value={siteContent.profileImage} onChange={v => setSiteContent({ ...siteContent, profileImage: v })} />
                                            <Field label="Cartoon Profile URL" value={siteContent.profileCartoon} onChange={v => setSiteContent({ ...siteContent, profileCartoon: v })} />
                                        </div>
                                    </Section>
                                    <Section title="Contact Info" icon={<Contact size={18} />}>
                                        <div className="space-y-6">
                                            <Field label="Email Address" value={siteContent.contactEmail} onChange={v => setSiteContent({ ...siteContent, contactEmail: v })} />
                                            <Field label="Phone Number" value={siteContent.contactPhone} onChange={v => setSiteContent({ ...siteContent, contactPhone: v })} />
                                        </div>
                                    </Section>
                                </div>
                                <div className="pt-8 border-t border-slate-100 flex justify-end items-center">
                                    <button type="submit" disabled={uploading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-10 rounded-2xl font-extrabold text-lg transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50">
                                        <Save size={24} /> {uploading ? "Saving..." : "Save All Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function ItemList({ items, collName, onMove, onDelete, editingId, setEditingId, editForm, setEditForm, onSave, onCancel, fields }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {items.length === 0 && (
                <div className="p-16 text-center text-slate-400 font-medium">
                    No items found in this section.
                </div>
            )}
            {items.map((item, index) => (
                <div key={item.id} className="p-6 flex items-start gap-4 group hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col gap-1 border-r border-slate-100 pr-3 mt-1">
                        <button onClick={() => onMove(collName, index, 'up')} disabled={index === 0} className="p-1 text-slate-300 hover:text-indigo-600 disabled:opacity-30 transition-colors"><ArrowUp size={16} /></button>
                        <button onClick={() => onMove(collName, index, 'down')} disabled={index === items.length - 1} className="p-1 text-slate-300 hover:text-indigo-600 disabled:opacity-30 transition-colors"><ArrowDown size={16} /></button>
                    </div>

                    {/* Preview Column - for videos, studio, and clients */}
                    {(collName === 'videos' || collName === 'studio' || collName === 'clients') && (
                        <div className="w-24 h-16 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                            {collName === 'videos' && item.youtubeId && (
                                <img
                                    src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                                    alt="Video thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            )}
                            {collName === 'studio' && item.url && (
                                <img
                                    src={item.url}
                                    alt={item.name}
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => { e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs">No preview</div>'; }}
                                />
                            )}
                            {collName === 'clients' && item.url && (
                                <img
                                    src={item.url}
                                    alt="Client logo"
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => { e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs">No preview</div>'; }}
                                />
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {editingId === item.id ? (
                            <div className="space-y-3">
                                {fields.map(f => (
                                    <div key={f.key}>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{f.label}</label>
                                        <input
                                            type="text"
                                            value={editForm[f.key] || ""}
                                            onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-50"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-1">
                                {/* Special display for videos - show YouTube title */}
                                {collName === 'videos' && item.youtubeId ? (
                                    <>
                                        <div className="font-bold text-slate-800 text-base mb-1">
                                            {item.title || 'YouTube Video'}
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono">
                                            ID: {item.youtubeId}
                                        </div>
                                        <a
                                            href={`https://youtube.com/watch?v=${item.youtubeId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-700 underline mt-1 inline-block"
                                        >
                                            View on YouTube →
                                        </a>
                                    </>
                                ) : (
                                    /* Default display for other types */
                                    fields.map((f, i) => (
                                        <div key={f.key} className={i === 0 ? "font-bold text-slate-800 text-lg truncate" : "text-sm text-slate-400 truncate mt-0.5"}>
                                            {item[f.key]}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-1 pt-1">
                        {editingId === item.id ? (
                            <>
                                <button onClick={() => onSave(collName, item.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"><Save size={20} /></button>
                                <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Edit2 size={18} /></button>
                                <button onClick={() => onDelete(collName, item.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function Section({ title, icon, children }) {
    return (
        <div className="space-y-6">
            <h3 className="flex items-center gap-3 text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">
                <span className="text-indigo-500 bg-indigo-50 p-1.5 rounded-lg">{icon}</span> {title}
            </h3>
            {children}
        </div>
    );
}

function Field({ label, value, onChange, textarea }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-tight">{label}</label>
            {textarea ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 outline-none transition-all h-40 leading-relaxed font-medium" />
            ) : (
                <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all font-semibold" />
            )}
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, textarea, containerClass = "" }) {
    return (
        <div className={containerClass}>
            <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-tight">{label}</label>
            {textarea ? (
                <textarea placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none transition-all h-20" />
            ) : (
                <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none transition-all" />
            )}
        </div>
    )
}
