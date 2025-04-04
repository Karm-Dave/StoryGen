import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import History from './components/History';
import Statistics from './components/Statistics';
import StoryCreator from './components/StoryCreator';

function App() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [darkMode, setDarkMode] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);

  // Load stories on mount
  useEffect(() => {
    fetchStories();
  }, []);

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/stories');
      setStories(response.data);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryCreated = (newStory) => {
    setStories(prev => [newStory, ...prev]);
    setCurrentStory(newStory);
    setActiveTab('create');
  };

  const handleStoryUpdated = (updatedStory) => {
    setStories(prev => prev.map(story => 
      story.id === updatedStory.id ? updatedStory : story
    ));
    setCurrentStory(updatedStory);
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/stories/${storyId}`);
      setStories(prev => prev.filter(s => s.id !== storyId));
      
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(null);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      setError('Failed to delete story');
    }
  };

  const handleStorySelect = (selectedStory) => {
    setCurrentStory(selectedStory);
    setActiveTab('create');
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Story Generator</h1>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <nav className="nav-links">
          <button
            className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ✏️ Create Story
          </button>
          <button
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📚 History
          </button>
          <button
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistics
          </button>
        </nav>
      </div>
      
      <main className="main-content">
        {activeTab === 'create' && (
          <div className="create-story">
            <StoryCreator
              onStoryCreated={handleStoryCreated}
              currentStory={currentStory}
              onStoryUpdated={handleStoryUpdated}
            />
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="history-page">
            <div className="history-header">
              <h2>Story History</h2>
            </div>
            <History
              stories={stories}
              onStorySelect={handleStorySelect}
              onDelete={handleDeleteStory}
            />
          </div>
        )}
        
        {activeTab === 'stats' && <Statistics stories={stories} />}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;