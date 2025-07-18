// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
// Import the MongoDB client
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// Get the database URL from the .env file
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("Error: DATABASE_URL is not defined. Make sure you have a .env file with the connection string.");
    process.exit(1);
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(dbUrl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db; // Variable to hold the database connection

// Connect to the database when the server starts
async function connectToDb() {
    try {
        await client.connect();
        // Use a database named "bharatBoostHub" and a collection named "videos"
        db = client.db("bharatBoostHub"); 
        console.log("Successfully connected to MongoDB Atlas!");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1); // Exit if we can't connect
    }
}

// --- API ENDPOINTS ---

app.get('/', (req, res) => {
    res.send('Welcome to the Bharat Boost Hub API! The server is connected to the database.');
});

// Get videos from the database
app.get('/api/videos', async (req, res) => {
    try {
        const videosCollection = db.collection('videos');
        const videos = await videosCollection.find({}).toArray();
        res.json(videos);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch videos", error: err.message });
    }
});

// Add a new video to the database
app.post('/api/videos', async (req, res) => {
    const { youtubeId, uploaderId } = req.body;

    if (!youtubeId || !uploaderId) {
        return res.status(400).json({ message: 'youtubeId and uploaderId are required' });
    }

    const newVideo = {
        _id: `vid_${Date.now()}`, // Use a custom ID
        youtubeId: youtubeId,
        uploaderId: uploaderId,
        createdAt: new Date(),
    };
    
    try {
        const videosCollection = db.collection('videos');
        const result = await videosCollection.insertOne(newVideo);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to add video", error: err.message });
    }
});

const PORT = process.env.PORT || 3001;

// Start the server only after the database is connected
connectToDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
