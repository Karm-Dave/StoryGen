import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './StoryCreator.css';

const StoryCreator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState('');
  const [storyParts, setStoryParts] = useState([]);
  const [showContinueOptions, setShowContinueOptions] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const generateStory = async () => {
    if (!title || !description || images.length === 0) {
      toast.error('Please fill in all fields and upload at least one image');
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      images.forEach((image) => formData.append('images', image));

      const response = await fetch('http://localhost:5000/api/generate-story', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      setGeneratedStory(data.story);
      setStoryParts([data.story]);
      setShowContinueOptions(true);
      toast.success('Story generated successfully!');
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const continueStory = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/continue-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previousParts: storyParts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to continue story');
      }

      const data = await response.json();
      setGeneratedStory(data.story);
      setStoryParts([...storyParts, data.story]);
      toast.success('Story continued successfully!');
    } catch (error) {
      console.error('Error continuing story:', error);
      toast.error('Failed to continue story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const endStory = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/end-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previousParts: storyParts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end story');
      }

      const data = await response.json();
      const finalStory = [...storyParts, data.conclusion].join('\n\n');
      
      // Save the complete story
      await fetch('http://localhost:5000/api/save-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          story: finalStory,
          images: images.map(img => img.name),
        }),
      });

      toast.success('Story completed and saved!');
      navigate('/history');
    } catch (error) {
      console.error('Error ending story:', error);
      toast.error('Failed to end story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setImages([]);
    setGeneratedStory('');
    setStoryParts([]);
    setShowContinueOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="story-creator">
      <h2>Create New Story</h2>
      <div className="story-form">
        <div className="form-group">
          <label htmlFor="title">Story Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter story title"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Story Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your story"
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>Upload Images (Max 5)</label>
          <div
            className="upload-section"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <FaPlus className="upload-icon" />
            <p>Click to upload images</p>
          </div>
          <div className="preview-grid">
            {images.map((image, index) => (
              <div key={index} className="preview-item">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                />
                <button
                  className="remove-image"
                  onClick={() => removeImage(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="generate-button"
            onClick={generateStory}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="spinner" />
                Generating...
              </>
            ) : (
              'Generate Story'
            )}
          </button>
          <button className="clear-button" onClick={clearForm}>
            Clear
          </button>
        </div>

        {generatedStory && (
          <div className="generated-story">
            <h3>Generated Story</h3>
            <p>{generatedStory}</p>
          </div>
        )}

        {showContinueOptions && (
          <div className="continue-options">
            <button
              className="continue-button"
              onClick={continueStory}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <FaSpinner className="spinner" />
                  Generating...
                </>
              ) : (
                'Continue Story'
              )}
            </button>
            <button
              className="end-button"
              onClick={endStory}
              disabled={isGenerating}
            >
              End Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator; 