import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiUpload, FiImage, FiSend, FiX } from 'react-icons/fi';
import './StoryCreator.css';

const StoryCreator = ({ onStoryCreated, currentStory, onStoryUpdated }) => {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Cleanup preview URLs when component unmounts
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (fileList) => {
    const validFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    setFiles(validFiles);
    
    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => {
      // Revoke old URLs
      prev.forEach(url => URL.revokeObjectURL(url));
      return urls;
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0 && !currentStory) {
      toast.error('Please select at least one image');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('images', file);
        });
      }

      if (prompt) {
        formData.append('prompt', prompt);
      }

      if (currentStory) {
        formData.append('storyId', currentStory.id);
      }

      const endpoint = currentStory 
        ? `http://localhost:5000/api/stories/${currentStory.id}/continue`
        : 'http://localhost:5000/api/generate';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create story');
      }

      const data = await response.json();
      
      if (currentStory) {
        onStoryUpdated(data);
      } else {
        onStoryCreated(data);
      }

      // Reset form
      setFiles([]);
      setPreviewUrls(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      setPrompt('');
      toast.success(currentStory ? 'Story continued successfully!' : 'Story created successfully!');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const handleEndStory = async () => {
    if (!currentStory) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/stories/${currentStory.id}/end`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to end story');
      }

      const data = await response.json();
      onStoryUpdated(data);
      toast.success('Story ended successfully!');
    } catch (error) {
      console.error('Error ending story:', error);
      toast.error('Failed to end story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-story">
      <h2>{currentStory ? 'Continue Story' : 'Create New Story'}</h2>
      
      <form onSubmit={handleSubmit} onDragEnter={handleDrag}>
        <div 
          className={`upload-section ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <FiUpload className="upload-icon" />
            <label className="file-input-label">
              Choose Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </label>
            <p className="upload-hint">
              or drag and drop your images here
            </p>
          </div>

          {previewUrls.length > 0 && (
            <div className="preview-images">
              {previewUrls.map((url, index) => (
                <div key={index} className="preview-image">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => handleRemoveImage(index)}
                    disabled={loading}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={currentStory 
              ? "Enter a prompt to continue the story..."
              : "Enter a prompt for your story (optional)"}
            className="form-control"
            rows="4"
            disabled={loading}
          />
        </div>

        <div className="story-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || (files.length === 0 && !currentStory)}
          >
            {loading ? (
              <span className="loading-spinner" />
            ) : (
              <>
                <FiSend />
                {currentStory ? 'Continue Story' : 'Generate Story'}
              </>
            )}
          </button>

          {currentStory && !currentStory.isComplete && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleEndStory}
              disabled={loading}
            >
              <FiX />
              End Story
            </button>
          )}
        </div>
      </form>

      {currentStory && (
        <div className="current-story">
          <h3>{currentStory.title}</h3>
          <p>{currentStory.story}</p>
          <div className="story-images">
            {currentStory.imageUrls.map((url, index) => (
              <div key={index} className="story-image">
                <img src={url} alt={`Story image ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator; 