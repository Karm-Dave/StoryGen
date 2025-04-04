import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaTrash, FaPlus, FaStop } from 'react-icons/fa';
import './History.css';

function History({ stories, onDelete }) {
  const navigate = useNavigate();

  const handleViewStory = (storyId) => {
    navigate(`/story/${storyId}`);
  };

  const handleContinueStory = async (storyId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/stories/${storyId}/continue`);
      window.location.reload();
    } catch (error) {
      console.error('Error continuing story:', error);
      alert('Failed to continue story');
    }
  };

  const handleEndStory = async (storyId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/stories/${storyId}/end`);
      window.location.reload();
    } catch (error) {
      console.error('Error ending story:', error);
      alert('Failed to end story');
    }
  };

  if (!stories || stories.length === 0) {
    return <div className="no-stories">No stories found</div>;
  }

  return (
    <div className="stories-grid">
      {stories.map((story) => (
        <div key={story.id} className="story-card">
          <div className="story-header">
            <h3>{story.title || `Story #${story.id}`}</h3>
            <span className="story-date">
              {new Date(story.createdAt || story.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <div className="story-images">
            {story.imageUrls && story.imageUrls.map((url, index) => (
              <div key={index} className="image-container">
                <img
                  src={`http://localhost:5000${url}`}
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
            {story.story && (
              <p className="story-text">{story.story}</p>
            )}
          </div>

          <div className="story-actions">
            <button
              onClick={() => handleViewStory(story.id)}
              className="view-btn"
              title="View Story"
            >
              <FaEye />
            </button>
            {!story.isComplete && (
              <>
                <button
                  onClick={() => handleContinueStory(story.id)}
                  className="continue-btn"
                  title="Continue Story"
                >
                  <FaPlus />
                </button>
                <button
                  onClick={() => handleEndStory(story.id)}
                  className="end-btn"
                  title="End Story"
                >
                  <FaStop />
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(story.id)}
              className="delete-btn"
              title="Delete Story"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default History; 