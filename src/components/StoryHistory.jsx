import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiTrash2, FiEye } from 'react-icons/fi';
import './StoryHistory.css';

function StoryHistory() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/stories');
      if (!response.ok) throw new Error('Failed to fetch stories');
      const data = await response.json();
      setStories(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/stories/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete story');

      setStories(prev => prev.filter(story => story.id !== id));
      toast.success('Story deleted successfully');
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStory = async (storyId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/stories/${storyId}`);
      if (!response.ok) throw new Error('Failed to fetch story');
      const story = await response.json();
      
      // Store the story in localStorage for the detail view
      localStorage.setItem('currentStory', JSON.stringify(story));
      
      // Navigate to the story detail page
      navigate(`/story/${storyId}`);
    } catch (error) {
      console.error('Error viewing story:', error);
      toast.error('Failed to view story');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!stories || stories.length === 0) {
    return (
      <div className="empty-state">
        <p>No stories found. Create your first story!</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Create Story
        </button>
      </div>
    );
  }

  return (
    <div className="story-history">
      <h2>Story History</h2>
      <div className="story-grid">
        {stories.map(story => (
          <div key={story.id} className="story-card">
            <div className="story-card-header">
              <h3>{story.title || `Story #${story.id}`}</h3>
              <span className="story-date">{formatDate(story.createdAt)}</span>
            </div>

            <div className="story-preview">
              {story.imageUrls && story.imageUrls[0] && (
                <div className="image-container">
                  <img 
                    src={getImageUrl(story.imageUrls[0])}
                    alt={`Preview for ${story.title}`}
                    className="story-thumbnail"
                    onError={(e) => {
                      console.error(`Failed to load image: ${story.imageUrls[0]}`);
                      e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                    }}
                  />
                </div>
              )}
              <p>{story.story?.slice(0, 150)}...</p>
            </div>

            <div className="story-card-footer">
              <div className="story-status">
                {story.isComplete ? (
                  <span className="status complete">Completed</span>
                ) : (
                  <span className="status ongoing">Ongoing</span>
                )}
              </div>

              <div className="story-actions">
                <button
                  className="action-btn view"
                  onClick={() => handleViewStory(story.id)}
                  title="View story"
                >
                  <FiEye />
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(story.id)}
                  title="Delete story"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StoryHistory; 