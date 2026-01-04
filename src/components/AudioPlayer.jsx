import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";
import { demos as staticDemos } from "../content/demos";
// Import firebase stuff safely - if config is missing it might error, but we handle try/catch
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function AudioPlayer() {
    const [tracks, setTracks] = useState(staticDemos);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    useEffect(() => {
        // Real-time subscription to Firestore
        try {
            // Fallback to simple query if index missing, although orderBy("order") should work if fields exist
            const q = query(collection(db, "demos"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const fetchedDemos = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    // Client-side sort to be safe against missing indexes
                    fetchedDemos.sort((a, b) => (a.order || 0) - (b.order || 0));
                    setTracks(fetchedDemos);
                }
            }, (error) => {
                console.log("Using static demos (Firebase fetch error):", error);
            });

            return () => unsubscribe();
        } catch (error) {
            console.log("Using static demos (Firebase not configured)");
        }
    }, []);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    const currentTrack = tracks[currentTrackIndex];

    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play().catch(() => setIsPlaying(false));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentTrackIndex]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
        if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    };

    const handleEnded = () => {
        nextTrack();
    };

    const nextTrack = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    };

    const prevTrack = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-2xl border border-slate-200 shadow-2xl">
            <audio
                ref={audioRef}
                src={currentTrack.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />

            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                        {currentTrack.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Nathan Puls Voice Over</p>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 w-10 text-right">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs text-slate-500 w-10">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-center gap-6">
                    <button onClick={prevTrack} className="p-2 text-slate-400 hover:text-indigo-600 transition">
                        <SkipBack size={24} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="p-4 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    <button onClick={nextTrack} className="p-2 text-slate-400 hover:text-indigo-600 transition">
                        <SkipForward size={24} />
                    </button>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                    <div className="space-y-2">
                        {tracks.map((track, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentTrackIndex(i);
                                    setIsPlaying(true);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${currentTrackIndex === i
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    : "hover:bg-slate-50 text-slate-600 hover:text-indigo-600"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono opacity-50">0{i + 1}</span>
                                    <span className="font-medium">{track.name}</span>
                                </div>
                                {currentTrackIndex === i && isPlaying && (
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((bar) => (
                                            <motion.div
                                                key={bar}
                                                animate={{ height: [4, 12, 4] }}
                                                transition={{ duration: 0.5, repeat: Infinity, delay: bar * 0.1 }}
                                                className="w-1 bg-indigo-500 rounded-full"
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
}
