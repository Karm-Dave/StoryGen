import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import './StoryCreator.css';

const StoryCreator = ({ onStoryCreated, currentStory, onStoryUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });
    formData.append('prompt', prompt);

    try {
      const response = await fetch('http://localhost:5000/api/generate-story', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      onStoryCreated(data);
      toast.success('Story created successfully!');
      
      // Clear form
      setPrompt('');
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!currentStory) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/continue-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: currentStory.id,
          prompt: prompt || 'Continue the story',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to continue story');
      }

      const data = await response.json();
      onStoryUpdated(data);
      toast.success('Story continued successfully!');
      setPrompt('');
    } catch (error) {
      console.error('Error continuing story:', error);
      toast.error('Failed to continue story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndStory = async () => {
    if (!currentStory) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/end-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: currentStory.id,
          prompt: prompt || 'Write a satisfying conclusion',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end story');
      }

      const data = await response.json();
      onStoryUpdated(data);
      toast.success('Story ended successfully!');
      setPrompt('');
    } catch (error) {
      console.error('Error ending story:', error);
      toast.error('Failed to end story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="story-creator">
      <h2>{currentStory ? 'Continue Story' : 'Create New Story'}</h2>

      {!currentStory && (
        <div className="image-upload">
          <label htmlFor="image-input" className="upload-label">
            <div className="upload-placeholder">
              <span>📸 Click to upload images</span>
              <small>or drag and drop them here</small>
            </div>
            <input
              type="file"
              id="image-input"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
          </label>

          {previewUrls.length > 0 && (
            <div className="image-previews">
              {previewUrls.map((url, index) => (
                <div key={index} className="preview-container">
                  <img src={url} alt={`Preview ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="prompt-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={currentStory ? "Enter prompt to continue the story..." : "Enter a prompt to start your story..."}
          className="prompt-input"
        />

        <div className="action-buttons">
          {currentStory ? (
            <>
              <button
                onClick={handleContinue}
                disabled={loading}
                className="continue-btn"
              >
                {loading ? 'Processing...' : 'Continue Story'}
              </button>
              {!currentStory.isComplete && (
                <button
                  onClick={handleEndStory}
                  disabled={loading}
                  className="end-btn"
                >
                  End Story
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || selectedFiles.length === 0}
              className="submit-btn"
            >
              {loading ? 'Processing...' : 'Generate Story'}
            </button>
          )}
        </div>
      </div>

      {currentStory && (
        <div className="current-story">
          <h3>Current Story</h3>
          <div className="story-preview">
            {currentStory.imageUrls && (
              <div className="story-images">
                {currentStory.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={`http://localhost:5000${url}`}
                    alt={`Story image ${index + 1}`}
                    className="story-image"
                  />
                ))}
              </div>
            )}
            <div className="story-text">
              {currentStory.story}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator; 