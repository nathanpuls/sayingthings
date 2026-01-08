import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import EmbedPlayer from "./pages/EmbedPlayer";
import EmbedAudioClip from "./pages/EmbedAudioClip";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/u/:uid" element={<Home />} />
        <Route path="/embed/audioplayer/:uid" element={<EmbedPlayer />} />
        <Route path="/embed/audioclip/:uid" element={<EmbedAudioClip />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
