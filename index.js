// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();

// --- NEW: CORS Configuration ---
// List of websites that are allowed to connect to this server
const allowedOrigins = [
    'https://bharatboosthub.github.io', // <--- IMPORTANT: REPLACE THIS with your actual frontend URL if it's different
    // You can add more URLs here if needed
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

// Use the new CORS options
app.use(cors(corsOptions));
app.use(express.json());


// --- DATABASE CONNECTION ---
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("Error: DATABASE_URL is not defined.");
    process.exit(1);
}
const client = new MongoClient(dbUrl, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });
let db;

async function connectToDb() {
    try {
        await client.connect();
        db = client.db("bharatBoostHub");
        console.log("Successfully connected to MongoDB Atlas!");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    }
}


// --- API ENDPOINTS ---
app.get('/', (req, res) => {
    res.send('Welcome to the Bharat Boost Hub API! Server is running and configured for CORS.');
});

// GET videos from the database
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await db.collection('videos').find({}).toArray();
        res.json(videos);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch videos", error: err.message });
    }
});

// POST a new video to the database
app.post('/api/videos', async (req, res) => {
    const { youtubeId, uploaderId } = req.body;
    if (!youtubeId || !uploaderId) {
        return res.status(400).json({ message: 'youtubeId and uploaderId are required' });
    }
    const newVideo = { _id: `vid_${Date.now()}`, youtubeId, uploaderId, createdAt: new Date() };
    try {
        const result = await db.collection('videos').insertOne(newVideo);
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
