import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Database } from "../lib/database.types";
import AudioPlayer from "../components/AudioPlayer";
import { Mic } from "lucide-react";
import { resolveUser } from "../lib/users";

type Demo = Database['public']['Tables']['demos']['Row'];
type SiteSettings = Database['public']['Tables']['site_settings']['Row'];

export default function EmbedAudioClip() {
    const { uid } = useParams();
    // TODO: We might capture a clipId param here too in the future
    const [demos, setDemos] = useState<Demo[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    // Audio Playback State
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const init = async () => {
            if (!uid) return;

            setLoading(true);
            const resolvedId = await resolveUser(uid);

            if (!resolvedId) {
                setLoading(false);
                return;
            }


            // Fetch Demos
            const { data: demosData } = await supabase
                .from('demos')
                .select('*')
                .eq('user_id', resolvedId)
                .order('order', { ascending: true });

            if (demosData) setDemos(demosData);

            // Fetch Settings
            const { data: settingsData } = await supabase
                .from('site_settings')
                .select('*')
                .eq('user_id', resolvedId)
                .single();

            if (settingsData) {
                setSettings(settingsData);
            }

            setLoading(false);
        };

        init();
    }, [uid]);


    // Audio Logic
    const currentTrack = demos[currentTrackIndex];

    const getPlayableUrl = (url: string) => {
        if (!url) return "";
        const driveMatch = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^\&]+)/);
        if (driveMatch && (url.includes("drive.google.com") || url.includes("docs.google.com"))) {
            return `https://docs.google.com/uc?id=${driveMatch[1]}`;
        }
        if (url.includes("dropbox.com") && url.includes("dl=0")) {
            return url.replace("dl=0", "raw=1");
        }
        return url;
    };

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
        }
    };

    const handleNext = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % demos.length);
        setIsPlaying(true); // Auto-play next
    };

    const handlePrev = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + demos.length) % demos.length);
        setIsPlaying(true);
    };

    const handleSeek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
            if (!isPlaying) {
                audioRef.current.play().catch(console.error);
                setIsPlaying(true);
            }
        }
    };

    // Sync Audio Element
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(() => setIsPlaying(false));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrackIndex]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 w-full h-full bg-transparent">
                <style>{`html, body { background: transparent !important; }`}</style>
                <div className="animate-pulse">
                    <Mic className="text-slate-400 opacity-50" size={32} />
                </div>
            </div>
        );
    }

    if (demos.length === 0) {
        return <div className="text-center p-4 text-slate-500 text-sm">No demos found.</div>;
    }

    return (
        <div className="w-full h-full bg-transparent flex items-start justify-center p-1">
            <style>{`
                :root {
                    --theme-primary: ${settings?.theme_color || '#6366f1'};
                }
                body {
                    background: transparent;
                }
            `}</style>

            <audio
                ref={audioRef}
                src={currentTrack ? getPlayableUrl(currentTrack.url) : undefined}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                    if (isPlaying) e.currentTarget.play().catch(console.error);
                }}
                onEnded={handleNext}
            />

            <div className="w-full max-w-md">
                <AudioPlayer
                    tracks={demos}
                    currentTrackIndex={currentTrackIndex}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    onPlayPause={handlePlayPause}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onSeek={handleSeek}
                    onTrackSelect={(index) => {
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                    }}
                    ownerName={settings?.site_name || "Voice Over Artist"}
                />
            </div>
        </div>
    );
}
