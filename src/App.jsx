import { useState, useEffect } from "react";
import AudioPlayer from "./components/AudioPlayer";
import { Mic, Video, Users, MessageSquare, User, Mail, Phone, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const studioGear = [
  { name: "Neumann TLM 103", img: "studio-images/neumann-tlm-103.png" },
  { name: "Rode NTG-3", img: "studio-images/rode-ntg-3.jpg" },
  { name: "Macbook Pro", img: "studio-images/macbook-pro.png" },
  { name: "Apogee Duet", img: "studio-images/apogee-duet.png" },
  { name: "Logic Pro X", img: "studio-images/logic-pro-x.jpeg" },
  { name: "Source Connect", img: "studio-images/source-connect.jpeg" },
];

const clients = [
  "client-images/apple.jpeg",
  "client-images/farmers-only.jpeg",
  "client-images/florida-state-parks.jpeg",
  "client-images/freeletics.jpeg",
  "client-images/gatorade.png",
  "client-images/hp.jpeg",
  "client-images/ziploc.jpeg",
  "client-images/lavazza.jpeg",
  "client-images/smart-design.jpeg",
  "client-images/waste-management.jpeg",
];

const reviews = [
  { text: "Nathan is a joy to work with.", author: "BookheadEd Learning" },
  { text: "Above and beyond.", author: "Segal Benz" },
  { text: "Never thought of putting an accent on my recording.", author: "Mr. Wizard, Inc" },
  { text: "Fast delivery, followed direction perfectly!", author: "Sonya Fernandes" },
  { text: "Great flexibility and quality.", author: "Jasper Dekker / Smart Design" },
];

const videos = [
  "lskrj62JbNI", // Freeletics
  "C-GdK49QZVs", // Getinge
  "QVTGS9ZAk60", // Florida State Parks
  "friJGg6UDvo", // Farmers Only
];

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-slate-950/80 backdrop-blur-md shadow-lg py-4" : "bg-transparent py-6"
          }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 group">
            {/* Logo placeholder or text */}
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent group-hover:opacity-80 transition">
              Nathan Puls
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
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
              className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden"
            >
              <div className="flex flex-col gap-4 p-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-slate-300 hover:text-indigo-400"
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
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 -z-10" />
        <div className="container mx-auto max-w-4xl text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Saying <span className="text-indigo-400">Things</span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Professional Voice Over services tailored to bring your script to life.
          </p>
          <AudioPlayer />
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-20 px-6 bg-slate-900/30">
        <div className="container mx-auto">
          <SectionHeader title="Projects" icon={<Video />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {videos.map((id) => (
              <div key={id} className="rounded-xl overflow-hidden shadow-2xl border border-slate-800 hover:border-indigo-500/50 transition-all">
                <div className="aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${id}`}
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="py-20 px-6">
        <div className="container mx-auto">
          <SectionHeader title="Studio" icon={<Mic />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {studioGear.map((item) => (
              <div key={item.name} className="glass-card rounded-xl p-6 flex flex-col items-center gap-4 text-center group">
                <div className="h-32 flex items-center justify-center p-2">
                  <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain filter group-hover:brightness-110 transition" />
                </div>
                <h3 className="font-semibold text-slate-200">{item.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section id="clients" className="py-20 px-6 bg-slate-900/30">
        <div className="container mx-auto">
          <SectionHeader title="Clients" icon={<Users />} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto items-center">
            {clients.map((src, i) => (
              <div key={i} className="bg-white/90 rounded-lg p-4 h-24 flex items-center justify-center hover:scale-105 transition-transform duration-300 shadow-lg">
                <img src={src} alt="Client Logo" className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all" />
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
            {reviews.map((review, i) => (
              <div key={i} className="glass-card p-8 rounded-xl relative">
                <p className="text-lg italic text-slate-300 mb-6">"{review.text}"</p>
                <div className="text-sm font-semibold text-indigo-400">{review.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 bg-slate-900/30">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader title="About" icon={<User />} />
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <img src="images/profile.jpeg" alt="Nathan Puls" className="rounded-2xl shadow-2xl border border-slate-700 w-full" />
            </div>
            <div className="w-full md:w-1/2 text-lg text-slate-300 leading-relaxed">
              <p className="mb-6 font-semibold text-xl text-white">It all started with acting in Los Angeles.</p>
              <p>
                Now, with over a decade of experience in voice over and improv comedy I'm excited to bring your script to life!
                Currently based in the vibrant city of Houston, I'm ready to collaborate with you to create something truly amazing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <SectionHeader title="Contact" icon={<Mail />} />
          <div className="glass-card p-10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-50">
              <img src="images/profile-cartoon-no-bg.png" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-bold mb-8">Nathan Puls</h3>
            <div className="flex flex-col gap-4 items-center">
              <a href="mailto:nathan@sayingthings.com" className="flex items-center gap-3 text-lg hover:text-indigo-400 transition-colors">
                <Mail className="w-6 h-6 text-indigo-500" />
                nathan@sayingthings.com
              </a>
              <a href="tel:+13233958384" className="flex items-center gap-3 text-lg hover:text-indigo-400 transition-colors">
                <Phone className="w-6 h-6 text-indigo-500" />
                323-395-8384
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-slate-500 text-sm bg-slate-950">
        <p>Designed by <a href="https://nathanpuls.com" className="hover:text-indigo-400">Nathan Puls</a></p>
      </footer>
    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <span className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">{icon}</span>
      <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
    </div>
  )
}
