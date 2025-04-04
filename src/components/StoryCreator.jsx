import React, { useState } from 'react';
import axios from 'axios';
import { FaUpload, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './StoryCreator.css';

function StoryCreator() {
  const [images, setImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('fantasy');
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);
  const [generatedStory, setGeneratedStory] = useState(null);

  const genres = [
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'scifi', name: 'Science Fiction' },
    { id: 'mystery', name: 'Mystery' },
    { id: 'romance', name: 'Romance' },
    { id: 'horror', name: 'Horror' }
  ];

  const languages = [
    { id: 'english', name: 'English' },
    { id: 'spanish', name: 'Spanish' },
    { id: 'french', name: 'French' },
    { id: 'german', name: 'German' },
    { id: 'italian', name: 'Italian' }
  ];

  const validateImages = (files) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    return files.every(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type. Please use JPG, PNG, or GIF.`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('You can only upload up to 5 images at a time.');
      return;
    }
    
    if (!validateImages(files)) {
      return;
    }
    
    setImages(files);
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      toast.error('Please select images to upload first.');
      return;
    }

    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // You could add a progress bar here if desired
        },
      });
      
      if (response.data.files && response.data.files.length > 0) {
        setUploadedImages(response.data.files);
        toast.success('Images uploaded successfully!');
      } else {
        throw new Error('No files were uploaded');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    
    // Send the actual image files
    images.forEach((image) => {
      formData.append('images', image);
    });
    
    formData.append('prompt', prompt);
    formData.append('genre', genre);
    formData.append('language', language);

    try {
      const response = await axios.post('http://localhost:5000/api/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data) {
        setGeneratedStory(response.data);
        toast.success('Story generated successfully!');
      } else {
        throw new Error('Failed to generate story');
      }
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to generate story. Please check your API key and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImages([]);
    setUploadedImages([]);
    setPrompt('');
    setGeneratedStory(null);
    toast.success('Form cleared successfully!');
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  return (
    <div className="story-creator">
      <h2>Create a New Story</h2>
      
      <div className="story-form">
        <div className="form-group">
          <label>Upload Images</label>
          <div className="upload-section" onClick={() => document.getElementById('image-upload').click()}>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <FaUpload className="upload-icon" />
            <p>Click to upload images (up to 5)</p>
            <p className="upload-hint">Supported formats: JPG, PNG, GIF (max 5MB each)</p>
          </div>
          
          {images.length > 0 && (
            <button onClick={handleUpload} className="upload-button">
              Upload Images
            </button>
          )}
          
          {uploadedImages.length > 0 && (
            <div className="preview-container">
              {uploadedImages.map((url, index) => (
                <div key={index} className="preview-item">
                  <img 
                    src={getImageUrl(url)} 
                    alt={`Preview ${index + 1}`}
                    onError={(e) => {
                      console.error(`Failed to load image: ${url}`);
                      e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                    }}
                  />
                  <button
                    className="remove-button"
                    onClick={() => {
                      setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                      toast.success('Image removed');
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Story Prompt (Optional)</label>
          <textarea
            className="form-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt to guide the story generation..."
          />
        </div>

        <div className="form-group">
          <label>Genre</label>
          <select
            className="form-select"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Language</label>
          <select
            className="form-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button
            onClick={handleGenerate}
            className="generate-button"
            disabled={loading || uploadedImages.length === 0}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" />
                Generating...
              </>
            ) : (
              'Generate Story'
            )}
          </button>
          <button onClick={handleClear} className="clear-button">
            Clear
          </button>
        </div>
      </div>

      {generatedStory && (
        <div className="generated-story">
          <h3>{generatedStory.title}</h3>
          <div className="story-images">
            {generatedStory.imageUrls && generatedStory.imageUrls.map((url, index) => (
              <div key={index} className="image-container">
                <img
                  src={getImageUrl(url)}
                  alt={`Story image ${index + 1}`}
                  onError={(e) => {
                    console.error(`Failed to load image: ${url}`);
                    e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                  }}
                />
              </div>
            ))}
          </div>
          <div className="story-content">
            <p>{generatedStory.story}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoryCreator; 