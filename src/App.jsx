import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FaHome, FaHistory, FaChartBar, FaSun, FaMoon } from 'react-icons/fa';
import './App.css';
import StoryCreator from './components/StoryCreator';
import StoryHistory from './components/StoryHistory';
import Statistics from './components/Statistics';
import StoryDetail from './components/StoryDetail';

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <Router>
      <div className="app">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
        <div className="sidebar">
          <nav>
            <Link to="/" className="nav-link">
              <FaHome className="nav-icon" />
              <span>Create Story</span>
            </Link>
            <Link to="/history" className="nav-link">
              <FaHistory className="nav-icon" />
              <span>Story History</span>
            </Link>
            <Link to="/statistics" className="nav-link">
              <FaChartBar className="nav-icon" />
              <span>Statistics</span>
            </Link>
          </nav>
        </div>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<StoryCreator />} />
            <Route path="/history" element={<StoryHistory />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/story/:id" element={<StoryDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;