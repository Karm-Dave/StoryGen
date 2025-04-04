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
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    const savedStories = localStorage.getItem('recentStories');
    if (savedStories) {
      setRecentStories(JSON.parse(savedStories));
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
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
      
      const continuedStory = {
        ...story,
        story: story.story + '\n\n' + response.data.continuation,
        timestamp: new Date().toISOString()
      };
      
      setStory(continuedStory);
      setRecentStories(prev => 
        prev.map(s => s.id === story.id ? continuedStory : s)
      );
    } catch (error) {
      console.error('Error continuing story:', error);
      setError('Failed to continue story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle story selection
  const handleStorySelect = (selectedStory) => {
    setStory(selectedStory);
    setImages(selectedStory.imageUrls || []);
    setSelectedGenre(selectedStory.genre || 'general');
    setSelectedLanguage(selectedStory.language || 'english');
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

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
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
            
            <div className="story-content">
              <div className="story-images">
                {images.map((image, index) => (
                  <img key={index} src={image} alt={`Story image ${index + 1}`} />
                ))}
              </div>
              <p>{story.story}</p>
            </div>
            
            <div className="story-action-buttons">
              <button
                className="continue-btn"
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? 'Continuing...' : 'Continue Story'}
              </button>
              <button
                className="end-btn"
                onClick={() => {
                  setStory(null);
                  setActiveTab('create');
                }}
              >
                End Story
              </button>
            </div>
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
            />
          </div>
        )}

        {activeTab === 'stats' && <Statistics />}
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