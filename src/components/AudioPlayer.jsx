import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";

const tracks = [
    {
        name: "Commercial",
        url: "https://sayingthings.s3.amazonaws.com/vo-audio/cfa8e725-8bb0-4e9b-864c-c67e5be8c28a_CommercialNathanPulsVoiceOvermp3",
    },
    {
        name: "Radio",
        url: "https://sayingthings.s3.amazonaws.com/vo-audio/68c5aec6-64a0-4ebe-bc12-d0c8789961b4_RadioNathanPulsVoiceOvermp3",
    },
    {
        name: "Narration",
        url: "https://sayingthings.s3.amazonaws.com/vo-audio/e64c7cf3-7899-47db-8cc9-60d9179de0dd_NarrationNathanPulsVoiceOvermp3",
    },
    {
        name: "Animation",
        url: "https://sayingthings.s3.amazonaws.com/vo-audio/d0b3077f-16aa-4b60-9c94-c73c2fcf88e2_AnimationNathanPulsVoiceOvermp3",
    },
];

export default function AudioPlayer() {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
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
        <div className="w-full max-w-3xl mx-auto p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl">
            <audio
                ref={audioRef}
                src={currentTrack.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />

            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        {currentTrack.name}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Nathan Puls Voice Over</p>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-xs text-slate-400 w-10">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-center gap-6">
                    <button onClick={prevTrack} className="p-2 text-slate-400 hover:text-white transition">
                        <SkipBack size={24} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    <button onClick={nextTrack} className="p-2 text-slate-400 hover:text-white transition">
                        <SkipForward size={24} />
                    </button>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-2">
                    <div className="space-y-2">
                        {tracks.map((track, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentTrackIndex(i);
                                    setIsPlaying(true);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${currentTrackIndex === i
                                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                        : "hover:bg-slate-800 text-slate-400 hover:text-white"
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
                                                className="w-1 bg-indigo-400 rounded-full"
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
