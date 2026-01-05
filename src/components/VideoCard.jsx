import { useState } from "react";
import { Play } from "lucide-react";

export default function VideoCard({ video }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [imgSrc, setImgSrc] = useState(`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`);

    return (
        <div
            className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl border border-slate-200 hover:border-[var(--theme-primary)] transition-all bg-white group"
        >
            <div className="aspect-video relative bg-slate-100">
                {isPlaying ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                ) : (
                    <button
                        onClick={() => setIsPlaying(true)}
                        className="w-full h-full relative block cursor-pointer group"
                        aria-label={`Play ${video.title}`}
                    >
                        {/* Thumbnail */}
                        <img
                            src={imgSrc}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={() => setImgSrc(`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`)}
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />

                        {/* Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-[var(--theme-primary)]/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all duration-300 ring-4 ring-white/30">
                                <Play fill="currentColor" size={28} className="ml-1" />
                            </div>
                        </div>

                        {/* Title Badge (Optional, since title might be under it, but nice to have on internal view) */}
                        <div className="absolute bottom-4 left-4 right-4">
                            {/* Intentionally left blank or simple gradient, but usually clean is better */}
                        </div>
                    </button>
                )}
            </div>
            {/* Title / Meta */}
            {/* If the user wants just the player, we might not need this footer, but Home.jsx didn't have a footer before. 
                Home.jsx wrapped the iframe in a div, no title text below unless it was implied. 
                I'll stick to just the player area unless requested, but typically a card needs a title. 
                The previous implementation in Home.jsx was JUST the iframe container. 
                However, data has `video.title`. I'll add a minimal footer if title exists.
            */}
            {video.title && (
                <div className="p-4 bg-white border-t border-slate-50">
                    <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-[var(--theme-primary)] transition-colors">
                        {video.title}
                    </h3>
                </div>
            )}
        </div>
    );
}
