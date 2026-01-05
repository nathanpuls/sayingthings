import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AudioPlayer from "../components/AudioPlayer";
import VideoCard from "../components/VideoCard";
import { Mic, Video, Users, MessageSquare, User, Mail, Phone, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, doc } from "firebase/firestore";

export default function Home() {
  const { uid } = useParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore Data States
  const [studioGear, setStudioGear] = useState([]);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);

  // Set initial active video when videos load
  useEffect(() => {
    if (videos.length > 0 && !activeVideo) {
      setActiveVideo(videos[0]);
    }
  }, [videos]);

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    // Firestore Subscriptions
    const syncCollection = (collName, setter) => {
      // If uid exists, fetch from users/{uid}/{collName}, else default to root {collName}
      const ref = uid
        ? collection(db, "users", uid, collName)
        : collection(db, collName);

      return onSnapshot(query(ref), (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setter(docs.sort((a, b) => (a.order || 0) - (b.order || 0)));
      });
    };

    const unsubStudio = syncCollection("studio", setStudioGear);
    const unsubClients = syncCollection("clients", setClients);
    const unsubReviews = syncCollection("reviews", setReviews);
    const unsubVideos = syncCollection("videos", setVideos);

    const settingsRef = uid
      ? doc(db, "users", uid, "settings", "siteContent")
      : doc(db, "settings", "siteContent");

    const unsubContent = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) setSiteContent(doc.data());
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubStudio();
      unsubClients();
      unsubReviews();
      unsubVideos();
      unsubContent();
    };
  }, [uid]);

  const navLinks = [
    { name: "Demos", href: "#demos" },
    { name: "Projects", href: "#projects" },
    { name: "Studio", href: "#studio" },
    { name: "Clients", href: "#clients" },
    { name: "Reviews", href: "#reviews" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <style>{`
        :root {
          --theme-primary: ${siteContent.themeColor || '#4f46e5'};
        }
      `}</style>
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-4 border-b border-slate-200" : "bg-transparent py-6"
          }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary)] bg-clip-text text-transparent group-hover:opacity-80 transition">
              {siteContent.siteName}
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-[var(--theme-primary)] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-600 hover:text-indigo-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden shadow-lg"
            >
              <div className="flex flex-col gap-4 p-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-slate-600 hover:text-indigo-600"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero / Demos */}
      <section id="demos" className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 -z-10" />
        <div className="container mx-auto max-w-4xl text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-900">
            {siteContent.heroTitle.split(' ').map((word, i) => (
              <span key={i}>{i === 1 ? <span className="text-[var(--theme-primary)]">{word}</span> : word}{' '}</span>
            ))}
          </h1>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">
            {siteContent.heroSubtitle}
          </p>
          <AudioPlayer />
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-20 px-6 bg-slate-100/50">
        <div className="container mx-auto">
          <SectionHeader title="Projects" icon={<Video />} />
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            {/* Main Player */}
            <div className="flex-1">
              {activeVideo ? (
                <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-black aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0&autoplay=1`}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                  Select a video
                </div>
              )}
              {activeVideo && (
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{activeVideo.title}</h3>
                </div>
              )}
            </div>

            {/* Playlist Sidebar */}
            <div className="lg:w-1/3 flex flex-col gap-3 h-[500px] overflow-y-auto pr-2">
              {videos.map((vid) => (
                <button
                  key={vid.id}
                  onClick={() => setActiveVideo(vid)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left border ${activeVideo?.id === vid.id
                    ? "bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]"
                    : "bg-white border-slate-100 hover:border-[var(--theme-primary)]/50 hover:bg-slate-50"
                    }`}
                >
                  <div className="relative w-24 aspect-video rounded-md overflow-hidden flex-shrink-0 bg-slate-200">
                    <img
                      src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold truncate ${activeVideo?.id === vid.id ? "text-[var(--theme-primary)]" : "text-slate-700"}`}>
                      {vid.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">Play Video</p>
                  </div>
                  {activeVideo?.id === vid.id && (
                    <div className="w-2 h-2 rounded-full bg-[var(--theme-primary)]"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="py-20 px-6">
        <div className="container mx-auto">
          <SectionHeader title="Studio" icon={<Mic />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {studioGear.map((item) => (
              <div key={item.id} className="glass-card rounded-xl p-6 flex flex-col items-center gap-4 text-center group bg-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                <div className="h-32 flex items-center justify-center p-2">
                  <img src={item.url} alt={item.name} className="max-h-full max-w-full object-contain filter transition group-hover:scale-105" />
                </div>
                <h3 className="font-semibold text-slate-800">{item.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section id="clients" className="py-20 px-6 bg-slate-100/50">
        <div className="container mx-auto">
          <SectionHeader title="Clients" icon={<Users />} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto items-center">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg p-4 h-24 flex items-center justify-center hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-md border border-slate-100">
                <img src={client.url} alt="Client Logo" className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 px-6">
        <div className="container mx-auto">
          <SectionHeader title="Reviews" icon={<MessageSquare />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {reviews.map((review) => (
              <div key={review.id} className="glass-card p-8 rounded-xl relative bg-white border border-slate-100 shadow-sm">
                <p className="text-lg italic text-slate-600 mb-6 font-serif leading-relaxed">"{review.text}"</p>
                <div className="text-sm font-semibold text-[var(--theme-primary)]">{review.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 bg-slate-100/50">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader title="About" icon={<User />} />
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <img src={siteContent.profileImage} alt={siteContent.siteName} className="rounded-2xl shadow-xl border border-slate-200 w-full" />
            </div>
            <div className="w-full md:w-1/2 text-lg text-slate-600 leading-relaxed">
              <p className="mb-6 font-semibold text-xl text-slate-800">{siteContent.aboutTitle}</p>
              <p className="whitespace-pre-line">
                {siteContent.aboutText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <SectionHeader title="Contact" icon={<Mail />} />
          <div className="glass-card p-10 rounded-2xl relative overflow-hidden bg-white border border-slate-100 shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <img src={siteContent.profileCartoon} className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-bold mb-8 text-slate-900">{siteContent.siteName}</h3>
            <div className="flex flex-col gap-4 items-center">
              <a href={`mailto:${siteContent.contactEmail}`} className="flex items-center gap-3 text-lg text-slate-600 hover:text-[var(--theme-primary)] transition-colors font-medium">
                <Mail className="w-6 h-6 text-[var(--theme-primary)]" />
                {siteContent.contactEmail}
              </a>
              <a href={`tel:${siteContent.contactPhone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-3 text-lg text-slate-600 hover:text-[var(--theme-primary)] transition-colors font-medium">
                <Phone className="w-6 h-6 text-[var(--theme-primary)]" />
                {siteContent.contactPhone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-slate-400 text-sm bg-slate-50 border-t border-slate-200">
        <p>Designed by <a href="https://nathanpuls.com" className="hover:text-indigo-600 text-slate-500">Nathan Puls</a></p>
      </footer>
    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <span className="p-3 bg-slate-100 rounded-full text-[var(--theme-primary)] shadow-sm">{icon}</span>
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{title}</h2>
    </div>
  )
}
