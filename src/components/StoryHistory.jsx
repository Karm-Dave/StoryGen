import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiTrash2, FiEdit, FiEye, FiChevronRight } from 'react-icons/fi';

function StoryHistory({ onStorySelect, onViewChange }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleContinue = (story) => {
    onStorySelect(story);
    onViewChange('create');
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

  return (
    <div className="story-history">
      <h2>Story History</h2>
      
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && stories.length === 0 && (
        <div className="empty-state">
          <p>No stories found. Create your first story!</p>
          <button 
            className="btn btn-primary"
            onClick={() => onViewChange('create')}
          >
            Create Story
          </button>
        </div>
      )}

      <div className="story-grid">
        {stories.map(story => (
          <div key={story.id} className="story-card">
            <div className="story-card-header">
              <h3>{story.title}</h3>
              <span className="story-date">{formatDate(story.createdAt)}</span>
            </div>

            <div className="story-preview">
              {story.imageUrls[0] && (
                <img 
                  src={story.imageUrls[0]} 
                  alt={`Preview for ${story.title}`}
                  className="story-thumbnail"
                />
              )}
              <p>{story.story.slice(0, 150)}...</p>
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
                  onClick={() => handleContinue(story)}
                  title="View story"
                >
                  <FiEye />
                </button>
                {!story.isComplete && (
                  <button
                    className="action-btn edit"
                    onClick={() => handleContinue(story)}
                    title="Continue story"
                  >
                    <FiEdit />
                  </button>
                )}
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