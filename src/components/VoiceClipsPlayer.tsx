import { useState, useRef, useEffect } from 'react';
import { Play, Pause, ChevronDown, Copy, Code, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Clip {
    name: string;
    start: number;
    end: number;
}

interface Track {
    id: string;
    name: string;
    url: string;
    clips: Clip[];
}

interface VoiceClipsPlayerProps {
    tracks: Track[];
    themeColor?: string;
}

export default function VoiceClipsPlayer({ tracks, themeColor = '#6366f1' }: VoiceClipsPlayerProps) {
    // Helper functions for URL-friendly track names
    const trackNameToSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '-');
    };

    const slugToTrackName = (slug: string) => {
        return slug.replace(/-/g, ' ');
    };

    // Get initial track from URL parameter or default to first track
    const getInitialTrack = () => {
        const params = new URLSearchParams(window.location.search);
        const trackParam = params.get('track');
        if (trackParam) {
            const normalizedParam = slugToTrackName(trackParam);
            const track = tracks.find(t => t.name.toLowerCase() === normalizedParam.toLowerCase());
            if (track) return track;
        }
        return tracks[0] || null;
    };

    const [selectedTrack, setSelectedTrack] = useState<Track | null>(getInitialTrack());
    const [currentClipIndex, setCurrentClipIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Update URL when track changes
    useEffect(() => {
        if (selectedTrack) {
            const params = new URLSearchParams(window.location.search);
            params.set('track', trackNameToSlug(selectedTrack.name));
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', newUrl);
        }
    }, [selectedTrack]);

    const currentClip = currentClipIndex !== null && selectedTrack ? selectedTrack.clips[currentClipIndex] : null;

    // Load track when selected and auto-play
    useEffect(() => {
        if (selectedTrack && audioRef.current && selectedTrack.clips.length > 0) {
            const audio = audioRef.current;
            console.log('Loading track:', selectedTrack.name, 'URL:', selectedTrack.url);
            audio.src = selectedTrack.url;

            // Auto-play first clip after loading
            audio.onloadedmetadata = () => {
                const firstClip = selectedTrack.clips[0];
                console.log('Audio loaded, starting clip:', firstClip.name, 'at', firstClip.start);
                setCurrentClipIndex(0);
                audio.currentTime = firstClip.start;
                audio.play().then(() => {
                    console.log('Playback started');
                    setIsPlaying(true);
                }).catch(err => {
                    console.log('Auto-play prevented:', err);
                });
            };
        }
    }, [selectedTrack]);

    // Spacebar to play/pause
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Only handle spacebar
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault(); // Prevent page scroll

                const audio = audioRef.current;
                if (!audio || !selectedTrack || selectedTrack.clips.length === 0) return;

                if (isPlaying) {
                    audio.pause();
                    setIsPlaying(false);
                } else {
                    // If no clip is selected, start from the first one
                    if (currentClipIndex === null) {
                        setCurrentClipIndex(0);
                        audio.currentTime = selectedTrack.clips[0].start;
                    }
                    audio.play();
                    setIsPlaying(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, currentClipIndex, selectedTrack]);

    const playClip = (index: number) => {
        const audio = audioRef.current;
        if (!audio || !selectedTrack) return;

        const clip = selectedTrack.clips[index];

        // If clicking the currently playing clip, pause it
        if (currentClipIndex === index && isPlaying) {
            audio.pause();
            setIsPlaying(false);
            return;
        }

        // Play the clip
        setCurrentClipIndex(index);
        audio.currentTime = clip.start;
        audio.volume = 1; // Ensure volume is up

        console.log('Attempting to play clip:', clip.name, 'Time:', audio.currentTime, 'Volume:', audio.volume, 'Paused:', audio.paused);

        // Use a promise to ensure smooth transition
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Playback started successfully');
                setIsPlaying(true);
            }).catch(error => {
                console.error('Playback error:', error);
            });
        }
    };

    const copyToClipboard = (text: string, id?: string) => {
        navigator.clipboard.writeText(text).then(() => {
            if (id) {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            }
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        }).catch(() => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            if (id) {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            }
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        });
    };

    // Smooth progress updates using requestAnimationFrame
    useEffect(() => {
        let animationFrameId: number;

        const updateProgress = () => {
            const audio = audioRef.current;
            if (audio && currentClipIndex !== null && selectedTrack && isPlaying) {
                const clip = selectedTrack.clips[currentClipIndex];
                setCurrentTime(audio.currentTime);

                // Auto-advance to next clip when current one ends
                // For clips with huge end times (999999), check if audio actually ended
                const effectiveEnd = clip.end > 10000 && audio.duration
                    ? audio.duration
                    : clip.end;

                if (audio.currentTime >= effectiveEnd - 0.2 || audio.ended) {
                    if (currentClipIndex < selectedTrack.clips.length - 1) {
                        const nextClip = selectedTrack.clips[currentClipIndex + 1];
                        setCurrentClipIndex(currentClipIndex + 1);
                        audio.currentTime = nextClip.start;
                    } else {
                        audio.pause();
                        setIsPlaying(false);
                        setCurrentClipIndex(null);
                        return;
                    }
                }
            }

            animationFrameId = requestAnimationFrame(updateProgress);
        };

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(updateProgress);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, currentClipIndex, selectedTrack]);

    const getClipProgress = (clip: Clip) => {
        if (currentClipIndex === null || !selectedTrack) return 0;

        // If clip.end is very large (like 999999), use actual audio duration
        const audio = audioRef.current;
        const effectiveEnd = clip.end > 10000 && audio?.duration
            ? audio.duration
            : clip.end;

        const clipDuration = effectiveEnd - clip.start;
        const elapsed = currentTime - clip.start;
        return Math.max(0, Math.min(100, (elapsed / clipDuration) * 100));
    };

    return (
        <div
            className="relative w-full max-w-[380px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200"
            style={{ '--theme-color': themeColor } as React.CSSProperties}
        >
            <style>{`
                .voiceclips-clip-button:active,
                .voiceclips-clip-button:focus,
                .voiceclips-clip-button:focus-visible {
                    outline: none !important;
                    border-color: rgb(226 232 240) !important;
                }
            `}</style>
            <audio ref={audioRef} />

            <div className="p-5 space-y-4">
                {/* Track Selector Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                        <span className="font-semibold text-slate-900">
                            {selectedTrack?.name || 'Select a track'}
                        </span>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                            {tracks.map((track) => (
                                <button
                                    key={track.id}
                                    onClick={() => {
                                        setSelectedTrack(track);
                                        setDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${selectedTrack?.id === track.id ? 'bg-[var(--theme-color)]/10 text-[var(--theme-color)] font-semibold' : 'text-slate-700'
                                        }`}
                                >
                                    {track.name}
                                    <span className="text-xs text-slate-400 ml-2">
                                        ({track.clips.length} clips)
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Playback Controls */}
                {selectedTrack && selectedTrack.clips.length > 0 && (
                    <div className="flex items-center justify-start gap-3">
                        <button
                            onClick={() => {
                                if (currentClipIndex !== null && currentClipIndex > 0) {
                                    playClip(currentClipIndex - 1);
                                }
                            }}
                            disabled={currentClipIndex === null || currentClipIndex === 0}
                            className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                            </svg>
                        </button>

                        <button
                            onClick={() => {
                                if (currentClipIndex !== null) {
                                    playClip(currentClipIndex);
                                } else if (selectedTrack.clips.length > 0) {
                                    playClip(0);
                                }
                            }}
                            className="w-10 h-10 rounded-full bg-[var(--theme-color)] text-white flex items-center justify-center hover:opacity-90 transition-all shadow-md"
                        >
                            {isPlaying ? (
                                <Pause size={18} fill="currentColor" />
                            ) : (
                                <Play size={18} fill="currentColor" className="ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={() => {
                                if (currentClipIndex !== null && selectedTrack && currentClipIndex < selectedTrack.clips.length - 1) {
                                    playClip(currentClipIndex + 1);
                                }
                            }}
                            disabled={currentClipIndex === null || (selectedTrack && currentClipIndex === selectedTrack.clips.length - 1)}
                            className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                        </button>
                    </div>
                )}


                {/* Clips List with Full-Height Progress Bars */}
                {selectedTrack && selectedTrack.clips.length > 0 && (
                    <div className="space-y-1 h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
                        <style>{`
                            .scrollbar-thin::-webkit-scrollbar {
                                width: 6px;
                            }
                            .scrollbar-thin::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .scrollbar-thin::-webkit-scrollbar-thumb {
                                background-color: rgb(203 213 225);
                                border-radius: 3px;
                            }
                            .scrollbar-thin:hover::-webkit-scrollbar-thumb {
                                background-color: rgb(148 163 184);
                            }
                        `}</style>
                        {selectedTrack.clips.map((clip, index) => {
                            const isCurrentClip = index === currentClipIndex;
                            const clipProgress = isCurrentClip ? getClipProgress(clip) : 0;

                            return (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        const audio = audioRef.current;
                                        if (!audio || !selectedTrack) return;

                                        // If this is not the current clip, just start playing it from the beginning
                                        if (currentClipIndex !== index) {
                                            setCurrentClipIndex(index);
                                            audio.currentTime = clip.start;
                                            audio.play();
                                            setIsPlaying(true);
                                        } else {
                                            // If it's the current clip and playing, allow seeking
                                            if (isPlaying) {
                                                // Calculate click position as percentage
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const clickX = e.clientX - rect.left;
                                                const percentage = clickX / rect.width;

                                                // Calculate time within the clip
                                                // Use effective end for clips with huge end times
                                                const effectiveEnd = clip.end > 10000 && audio.duration
                                                    ? audio.duration
                                                    : clip.end;
                                                const clipDuration = effectiveEnd - clip.start;
                                                const seekTime = clip.start + (clipDuration * percentage);

                                                // Seek to that position
                                                audio.currentTime = Math.max(clip.start, Math.min(seekTime, effectiveEnd));
                                                audio.play();
                                            } else {
                                                // If it's paused, just resume from current position
                                                audio.play();
                                                setIsPlaying(true);
                                            }
                                        }
                                    }}
                                    className="voiceclips-clip-button w-full relative overflow-hidden rounded-lg border border-slate-200 hover:border-slate-300 transition-all group cursor-pointer focus:outline-none focus-visible:outline-none active:outline-none"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    {/* Full-height progress background */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                    >
                                        <div
                                            className="h-full"
                                            style={{
                                                width: `${clipProgress}%`,
                                                backgroundColor: `${themeColor}15`
                                            }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="relative flex items-center gap-3 px-3 py-2.5">
                                        {/* Discreet play button */}
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${isCurrentClip && isPlaying
                                                ? 'text-[var(--theme-color)]'
                                                : 'text-slate-400 group-hover:text-slate-600'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent triggering the parent button's seek behavior

                                                const audio = audioRef.current;
                                                if (!audio || !selectedTrack) return;

                                                if (isCurrentClip && isPlaying) {
                                                    // Pause if this clip is currently playing
                                                    audio.pause();
                                                    setIsPlaying(false);
                                                } else {
                                                    // Play this clip
                                                    if (currentClipIndex !== index) {
                                                        setCurrentClipIndex(index);
                                                        audio.currentTime = clip.start;
                                                    }
                                                    audio.play();
                                                    setIsPlaying(true);
                                                }
                                            }}
                                        >
                                            {isCurrentClip && isPlaying ? (
                                                <Pause size={14} fill="currentColor" />
                                            ) : (
                                                <Play size={14} fill="currentColor" className="ml-0.5" />
                                            )}
                                        </div>

                                        {/* Clip name - smaller font */}
                                        <span className={`text-sm font-medium truncate ${isCurrentClip && isPlaying ? 'text-[var(--theme-color)]' : 'text-slate-700'
                                            }`}>
                                            {clip.name}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Toast Notification Overlay */}
                <AnimatePresence>
                    {showCopied && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-16 left-0 right-0 z-[100] flex justify-center pointer-events-none"
                        >
                            <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl ring-1 ring-white/10">
                                Copied to clipboard!
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer and Notifications Area */}
                <div className="relative pt-4 border-t border-slate-100">

                    <div className="flex items-center justify-between">
                        <a
                            href="https://built.at"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold tracking-widest uppercase text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            Built.at
                        </a>

                        {selectedTrack && (
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="text-slate-300 hover:text-slate-500 transition-colors p-1"
                                title="Share this track"
                            >                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div >

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md p-6 flex flex-col justify-center border border-slate-200 rounded-2xl"
                    >
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-800">Share Player</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-tight uppercase">Copy link or embed code</p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                        Public Link
                                    </label>
                                    <div className="group relative flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={window.location.href}
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 outline-none focus:border-[var(--theme-color)] transition-colors font-medium"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(window.location.href, 'url')}
                                            className={`w-12 rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${copiedId === 'url' ? 'bg-green-500 text-white shadow-green-200' : 'bg-[var(--theme-color)] text-white hover:opacity-90 shadow-sm'} shadow-md`}
                                            title="Copy link"
                                        >
                                            {copiedId === 'url' ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                        Embed Code
                                    </label>
                                    <div className="group relative flex gap-2">
                                        <textarea
                                            readOnly
                                            rows={2}
                                            value={`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allow="autoplay" style="border-radius: 1rem;"></iframe>`}
                                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-500 outline-none resize-none font-mono leading-relaxed focus:border-[var(--theme-color)] transition-colors"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allow="autoplay" style="border-radius: 1rem;"></iframe>`, 'embed')}
                                            className={`w-12 rounded-xl transition-all flex items-center justify-center flex-shrink-0 self-stretch ${copiedId === 'embed' ? 'bg-green-500 text-white shadow-green-200' : 'bg-[var(--theme-color)] text-white hover:opacity-90 shadow-sm'} shadow-md`}
                                            title="Copy embed code"
                                        >
                                            {copiedId === 'embed' ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowShareModal(false)}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg active:scale-[0.98]"
                            >
                                Back to Clips
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
