import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './StoryDetail.css';

function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        // First try to get the story from localStorage
        const cachedStory = localStorage.getItem('currentStory');
        if (cachedStory) {
          const parsedStory = JSON.parse(cachedStory);
          if (parsedStory.id === id) {
            setStory(parsedStory);
            setLoading(false);
            return;
          }
        }

        // If not in localStorage or ID doesn't match, fetch from API
        const response = await fetch(`http://localhost:5000/api/stories/${id}`);
        if (!response.ok) throw new Error('Failed to load story');
        const data = await response.json();
        setStory(data);
      } catch (error) {
        console.error('Error fetching story:', error);
        toast.error('Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  const handleBack = () => {
    localStorage.removeItem('currentStory');
    navigate('/history');
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="error-state">
        <p>Story not found</p>
        <button onClick={handleBack} className="back-button">
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="story-detail">
      <button onClick={handleBack} className="back-button">
        Back to History
      </button>
      
      <div className="story-header">
        <h1>{story.title || `Story #${story.id}`}</h1>
        <div className="story-meta">
          <span className="genre">Genre: {story.genre || 'General'}</span>
          <span className="language">Language: {story.language || 'English'}</span>
          <span className="date">
            Created: {new Date(story.createdAt || story.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="story-images">
        {story.imageUrls && story.imageUrls.map((url, index) => (
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
        <p>{story.story}</p>
      </div>

      <div className="story-footer">
        <span className="status">
          Status: {story.isComplete ? 'Completed' : 'Ongoing'}
        </span>
      </div>
    </div>
  );
}

export default StoryDetail; 