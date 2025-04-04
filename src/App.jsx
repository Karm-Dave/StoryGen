import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageDropzone from './components/ImageDropzone';
import StoryHistory from './components/StoryHistory';
import Statistics from './components/Statistics';
import './App.css';

function App() {
  // State for story creation
  const [images, setImages] = useState([]);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(null);
  const [error, setError] = useState('');
  
  // State for genres and languages
  const [genres] = useState(['General', 'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Horror', 'Adventure']);
  const [languages] = useState(['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese']);
  const [selectedGenre, setSelectedGenre] = useState('general');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [enableBranching, setEnableBranching] = useState(false);
  
  // Navigation and display state
  const [activeTab, setActiveTab] = useState('create');
  const [favorites, setFavorites] = useState([]);
  const [recentStories, setRecentStories] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const loadStories = async () => {
      try {
        console.log('Loading stories from backend...'); // Debug log
        const response = await axios.get('http://localhost:5000/api/stories');
        console.log('Received stories:', response.data); // Debug log
        
        if (response.data && Array.isArray(response.data)) {
          // Sort stories by creation date (newest first)
          const sortedStories = response.data.sort((a, b) => 
            new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
          );
          console.log('Setting stories:', sortedStories.length); // Debug log
          setRecentStories(sortedStories);
        } else {
          console.error('Invalid stories data received:', response.data);
        }
      } catch (error) {
        console.error('Error loading stories:', error);
        setError('Failed to load stories. Please try refreshing the page.');
      }
    };

    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
        localStorage.removeItem('favorites');
      }
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      try {
        setDarkMode(JSON.parse(savedDarkMode));
      } catch (error) {
        console.error('Error loading dark mode:', error);
        localStorage.removeItem('darkMode');
      }
    }

    loadStories();
  }, []);

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('recentStories', JSON.stringify(recentStories));
  }, [recentStories]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Handle image upload
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setLoading(true);
    setError('');
    setUploadedFiles(files);
    
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });
    
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.files && response.data.files.length > 0) {
        setImages(response.data.files);
        setIsReadyToGenerate(true);
      } else {
        throw new Error('No files were uploaded');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.response?.data?.error || 'Failed to upload images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate story
  const handleGenerate = async () => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    Array.from(uploadedFiles).forEach((file) => {
      formData.append('images', file);
    });
    formData.append('prompt', prompt);
    formData.append('genre', selectedGenre);
    formData.append('language', selectedLanguage);
    formData.append('branching', String(enableBranching));
    formData.append('shouldGenerate', 'true');

    try {
      const response = await axios.post('http://localhost:5000/api/generate-story', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const newStory = {
        ...response.data,
        id: response.data.id,
        timestamp: response.data.timestamp,
        isFavorite: false
      };
      
      setStory(newStory);
      setRecentStories(prev => [newStory, ...prev.slice(0, 9)]);
      setActiveTab('story');
    } catch (error) {
      console.error('Error generating story:', error);
      setError(error.response?.data?.error || 'Failed to generate story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Continue story
  const handleContinue = async () => {
    if (!story) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/continue-story', {
        storyId: story.id,
        prompt: prompt || 'Continue the story'
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const updatedStory = response.data.fullStory;
      setStory(updatedStory);
      
      // Update the story in recent stories
      setRecentStories(prev => 
        prev.map(s => s.id === updatedStory.id ? updatedStory : s)
      );
      
      // Update in favorites if it exists there
      if (favorites.some(f => f.id === updatedStory.id)) {
        setFavorites(prev =>
          prev.map(f => f.id === updatedStory.id ? updatedStory : f)
        );
      }
      
      setPrompt(''); // Clear the prompt after successful continuation
    } catch (error) {
      console.error('Error continuing story:', error);
      setError(error.response?.data?.error || 'Failed to continue story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle story selection
  const handleStorySelect = (selectedStory) => {
    setStory(selectedStory);
    setActiveTab('story');
  };

  // Toggle favorite
  const handleToggleFavorite = (storyToToggle) => {
    const isFavorite = favorites.some(fav => fav.id === storyToToggle.id);
    const updatedStory = { ...storyToToggle, isFavorite: !isFavorite };
    
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.id !== storyToToggle.id));
    } else {
      setFavorites([...favorites, updatedStory]);
    }
    
    if (story && story.id === storyToToggle.id) {
      setStory(updatedStory);
    }
    
    setRecentStories(prev => 
      prev.map(s => s.id === storyToToggle.id ? updatedStory : s)
    );
  };

  // Delete all stories
  const handleDeleteAllStories = () => {
    if (window.confirm('Are you sure you want to delete all stories? This action cannot be undone.')) {
      setRecentStories([]);
      setFavorites([]);
      localStorage.removeItem('recentStories');
      localStorage.removeItem('favorites');
    }
  };

  // Handle story deletion
  const handleDeleteStory = (storyToDelete) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      // Remove from recent stories
      setRecentStories(prev => prev.filter(s => s.id !== storyToDelete.id));
      
      // Remove from favorites if it exists there
      if (favorites.some(f => f.id === storyToDelete.id)) {
        setFavorites(prev => prev.filter(f => f.id !== storyToDelete.id));
      }
      
      // If the deleted story is currently being viewed, clear it
      if (story && story.id === storyToDelete.id) {
        setStory(null);
        setActiveTab('create');
      }
    }
  };

  // Handle end story
  const handleEndStory = async () => {
    if (!story) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/end-story', {
        storyId: story.id,
        prompt: prompt || 'Write a satisfying conclusion to this story.'
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const concludedStory = response.data.fullStory;
      
      // Update the story in recent stories
      setRecentStories(prev => 
        prev.map(s => s.id === concludedStory.id ? concludedStory : s)
      );
      
      // Update in favorites if it exists there
      if (favorites.some(f => f.id === concludedStory.id)) {
        setFavorites(prev =>
          prev.map(f => f.id === concludedStory.id ? concludedStory : f)
        );
      }
      
      // Show the concluded story before clearing
      setStory(concludedStory);
      
      // Wait a moment to show the conclusion
      setTimeout(() => {
        setStory(null);
        setActiveTab('create');
      }, 2000);
    } catch (error) {
      console.error('Error ending story:', error);
      setError(error.response?.data?.error || 'Failed to end story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render story content
  const renderStoryContent = () => {
    if (!story) return null;

    return (
      <div className="story-content">
        <h2>{story.title}</h2>
        <div className="story-images">
          {story.imageUrls && story.imageUrls.map((url, index) => (
            <img
              key={index}
              src={`http://localhost:5000${url}`}
              alt={`Story image ${index + 1}`}
              className="story-image"
            />
          ))}
        </div>
        <div className="story-text">
          {story.story.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="story-actions">
          <div className="action-buttons">
            <button
              onClick={() => handleToggleFavorite(story)}
              className={`favorite-btn ${story.isFavorite ? 'active' : ''}`}
            >
              {story.isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
            </button>
            <button
              onClick={() => handleDeleteStory(story)}
              className="delete-btn"
            >
              🗑️ Delete Story
            </button>
          </div>
          <div className="continue-story">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter prompt to continue the story..."
              className="continue-prompt"
            />
            <div className="story-controls">
              <button
                onClick={handleContinue}
                disabled={loading}
                className="continue-btn"
              >
                {loading ? 'Continuing...' : 'Continue Story'}
              </button>
              <button
                onClick={handleEndStory}
                disabled={loading}
                className="end-btn"
              >
                {loading ? 'Ending...' : 'End Story'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
            className={`nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ⭐ Favorites
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
            <div className="create-header">
              <h2>Create New Story</h2>
            </div>
            
            <div className="story-settings-panel">
              <h3>Story Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label htmlFor="genre">Genre:</label>
                  <select
                    id="genre"
                    className="genre-select"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    {genres.map((genre) => (
                      <option key={genre} value={genre.toLowerCase()}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="setting-item">
                  <label htmlFor="language">Language:</label>
                  <select
                    id="language"
                    className="language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang.toLowerCase()}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={enableBranching}
                      onChange={(e) => setEnableBranching(e.target.checked)}
                    />
                    Enable branching storylines
                  </label>
                </div>
              </div>
            </div>

            <div className="story-settings-panel">
              <h3>Upload Images</h3>
              <ImageDropzone onImageUpload={handleImageUpload} />
              {images.length > 0 && (
                <div className="uploaded-images">
                  {images.map((image, index) => (
                    <img key={index} src={image} alt={`Uploaded ${index + 1}`} />
                  ))}
                </div>
              )}
            </div>

            <div className="story-settings-panel">
              <h3>Story Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt to guide your story..."
                className="prompt-textarea"
                rows={4}
              />
            </div>

            <div className="story-action-buttons">
              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={loading || !isReadyToGenerate}
              >
                {loading ? 'Generating...' : 'Generate Story'}
              </button>
              {story && (
                <>
                  <button
                    className="continue-btn"
                    onClick={handleContinue}
                    disabled={loading}
                  >
                    Continue Story
                  </button>
                  <button
                    className="end-btn"
                    onClick={() => setStory(null)}
                  >
                    End Story
                  </button>
                </>
              )}
            </div>

            {error && (
              <div className="error-message">
                {error}
                <button onClick={() => setError('')}>✕</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'story' && story && (
          <div className="story-display">
            <div className="story-header">
              <h3>{story.title || 'Your Story'}</h3>
              <button
                onClick={() => handleToggleFavorite(story)}
                className={`favorite-btn ${favorites.some(f => f.id === story.id) ? 'active' : ''}`}
              >
                {favorites.some(f => f.id === story.id) ? '★' : '☆'}
              </button>
            </div>
            
            {renderStoryContent()}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-page">
            <div className="history-header">
              <h2>Story History</h2>
              <button className="delete-all-btn" onClick={handleDeleteAllStories}>
                Delete All Stories
              </button>
            </div>
            <StoryHistory
              stories={recentStories}
              onStorySelect={handleStorySelect}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteStory}
            />
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-page">
            <h2>Favorite Stories</h2>
            <StoryHistory
              stories={favorites}
              onStorySelect={handleStorySelect}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteStory}
            />
          </div>
        )}

        {activeTab === 'stats' && <Statistics stories={recentStories} favorites={favorites} />}
      </main>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
}

export default App;