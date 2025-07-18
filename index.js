// Import the Express library to create a server
const express = require('express');
// Import the 'cors' library to allow our frontend to talk to our backend
const cors = require('cors');

// Create an instance of an Express application
const app = express();

// Tell our app to use the cors middleware
app.use(cors());
// Tell our app to understand JSON in request bodies
app.use(express.json());

// --- IN-MEMORY DATABASE (A simple array to store data) ---
// In a real app, this would be a real database (like MongoDB, Firebase, etc.)
let videos = [
    // Pre-populate with some data so it's not empty
    { id: 'vid_dummy_1', youtubeId: 'BBJa32lCaaY', uploaderId: 'user_dummy_alpha' },
    { id: 'vid_dummy_2', youtubeId: 'okp_kt_zw4w', uploaderId: 'user_dummy_beta' },
];

let users = {
    // We can simulate a user's data here
    "user123": { coins: 50 }
};

// --- API ENDPOINTS (The URLs our frontend will call) ---

// 1. An endpoint to get the list of all videos
app.get('/api/videos', (req, res) => {
    // Simply send back the array of videos
    res.json(videos);
});

// 2. An endpoint to upload (add) a new video
app.post('/api/videos', (req, res) => {
    // Get the youtubeId from the request body sent by the frontend
    const { youtubeId, uploaderId } = req.body;

    if (!youtubeId || !uploaderId) {
        return res.status(400).json({ message: 'youtubeId and uploaderId are required' });
    }

    const newVideo = {
        id: `vid_${Date.now()}`, // Create a unique ID
        youtubeId: youtubeId,
        uploaderId: uploaderId
    };

    // Add the new video to our 'database' array
    videos.push(newVideo);

    // In a real app, you would deduct coins here from the user's database entry.

    // Send a success response back to the frontend
    res.status(201).json(newVideo);
});

// Define a port for our server to listen on
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export the app for Vercel's serverless environment
module.exports = app;
