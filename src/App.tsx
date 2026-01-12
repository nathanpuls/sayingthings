

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="login" element={<Auth />} />
          <Route path="join" element={<Auth />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="settings" element={<Settings />} />

          {/* 
            RESERVED NAMESPACES
            Any future system routes must be defined BEFORE the wildcard username route.
            
            Reserved words list (do not allow these as usernames):
            - Core: admin, login, register, auth, dashboard, settings, app, api
            - Pages: welcome, about, contact, support, search, help, legal, terms, privacy
            - Entities: builders, users, teams, projects, built
            - System: x, sys, status, blog, docs
            
            Consider using a common prefix like '/app' or '/sys' for groups of internal pages
            to avoid polluting the root namespace.
          */}

          <Route path=":username" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
