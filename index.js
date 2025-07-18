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
let videos = [
    { id: 'vid_dummy_1', youtubeId: 'BBJa32lCaaY', uploaderId: 'user_dummy_alpha' },
    { id: 'vid_dummy_2', youtubeId: 'okp_kt_zw4w', uploaderId: 'user_dummy_beta' },
];

// --- API ENDPOINTS (The URLs our frontend will call) ---

// --- NEW "WELCOME MAT" ROUTE ---
// This tells the server what to do when someone visits the main root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Bharat Boost Hub API! The server is running correctly. Use the /api/videos endpoint to get data.');
});


// 1. An endpoint to get the list of all videos
app.get('/api/videos', (req, res) => {
    res.json(videos);
});

// 2. An endpoint to upload (add) a new video
app.post('/api/videos', (req, res) => {
    const { youtubeId, uploaderId } = req.body;

    if (!youtubeId || !uploaderId) {
        return res.status(400).json({ message: 'youtubeId and uploaderId are required' });
    }

    const newVideo = {
        id: `vid_${Date.now()}`,
        youtubeId: youtubeId,
        uploaderId: uploaderId
    };

    videos.push(newVideo);
    res.status(201).json(newVideo);
});

// Define a port for our server to listen on
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export the app for Vercel/Render's serverless environment
module.exports = app;
