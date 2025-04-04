import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { FiPlusCircle, FiClock, FiBarChart2, FiMoon, FiSun } from 'react-icons/fi';
import StoryCreator from './components/StoryCreator';
import StoryHistory from './components/StoryHistory';
import Statistics from './components/Statistics';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('create');
  const [currentStory, setCurrentStory] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleStoryCreated = (story) => {
    setCurrentStory(story);
  };

  const handleStoryUpdated = (story) => {
    setCurrentStory(story);
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Story Generator</h1>
          <button 
            onClick={toggleDarkMode} 
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-link ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => setActiveView('create')}
          >
            <FiPlusCircle />
            Create Story
          </button>
          <button
            className={`nav-link ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            <FiClock />
            History
          </button>
          <button
            className={`nav-link ${activeView === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveView('statistics')}
          >
            <FiBarChart2 />
            Statistics
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {activeView === 'create' && (
          <StoryCreator
            onStoryCreated={handleStoryCreated}
            currentStory={currentStory}
            onStoryUpdated={handleStoryUpdated}
          />
        )}
        {activeView === 'history' && (
          <StoryHistory
            onStorySelect={setCurrentStory}
            onViewChange={setActiveView}
          />
        )}
        {activeView === 'statistics' && <Statistics />}
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#ffffff' : '#1e293b',
          },
        }}
      />
    </div>
  );
}

export default App;