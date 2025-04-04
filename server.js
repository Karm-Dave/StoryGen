// Load stories from disk on startup
const loadStories = () => {
  try {
    const storiesPath = path.join(__dirname, 'stories');
    if (!fs.existsSync(storiesPath)) {
      fs.mkdirSync(storiesPath, { recursive: true });
    }
    
    const storyFiles = fs.readdirSync(storiesPath)
      .filter(file => file.endsWith('.json'));
    
    return storyFiles.map(file => {
      try {
        const storyData = JSON.parse(fs.readFileSync(path.join(storiesPath, file), 'utf8'));
        return {
          ...storyData,
          id: path.parse(file).name
        };
      } catch (error) {
        console.error(`Error loading story file ${file}:`, error);
        return null;
      }
    }).filter(story => story !== null);
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
};

// Initialize stories array with existing stories
let stories = loadStories();

// Save story to disk
const saveStory = (story) => {
  try {
    const storyPath = path.join(__dirname, 'stories', `${story.id}.json`);
    fs.writeFileSync(storyPath, JSON.stringify(story, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving story:', error);
    return false;
  }
};

// End story endpoint
app.post('/api/end-story', async (req, res) => {
  try {
    const { storyId, prompt } = req.body;
    
    // Find the story
    const storyIndex = stories.findIndex(s => s.id === storyId);
    if (storyIndex === -1) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const story = stories[storyIndex];
    
    // Generate conclusion using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a creative writer. Write a satisfying conclusion to the story that ties up loose ends and provides closure. Make sure to maintain the same writing style and tone as the rest of the story."
        },
        {
          role: "user",
          content: `Here is the story so far:\n\n${story.story}\n\n${prompt || 'Write a satisfying conclusion to this story.'}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const conclusion = completion.choices[0].message.content;
    
    // Update the story with the conclusion
    const updatedStory = {
      ...story,
      story: `${story.story}\n\n${conclusion}`,
      isComplete: true,
      endedAt: new Date().toISOString()
    };
    
    // Save the updated story
    if (!saveStory(updatedStory)) {
      throw new Error('Failed to save story');
    }
    
    // Update in memory
    stories[storyIndex] = updatedStory;
    
    res.json({ fullStory: updatedStory });
  } catch (error) {
    console.error('Error ending story:', error);
    res.status(500).json({ error: 'Failed to end story' });
  }
});

// Get all stories endpoint
app.get('/api/stories', (req, res) => {
  try {
    // Reload stories from disk to ensure we have the latest
    stories = loadStories();
    res.json(stories);
  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
}); 