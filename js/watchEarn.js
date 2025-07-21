// FILE: js/watchEarn.js
// Fetches and displays videos for the "Watch & Earn" page.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure user is logged in
    const user = await protectPage();
    if (!user) return;

    // --- ELEMENT SELECTORS ---
    const videoListEl = document.getElementById('video-list');
    const loaderEl = document.getElementById('loader');

    /**
     * Fetches videos from the database and renders them on the page.
     * It filters out the user's own videos and videos they have already viewed.
     */
    const fetchVideos = async () => {
        // 1. Fetch videos that are active and not uploaded by the current user
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*')
            .neq('user_id', user.id) // 'neq' means "not equal to"
            .eq('status', 'active');

        if (error) {
            console.error('Error fetching videos:', error.message);
            if (loaderEl) loaderEl.style.display = 'none';
            videoListEl.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load videos. Please try again later.</p>';
            return;
        }

        // 2. Fetch the IDs of videos the user has already submitted a view for
        const { data: watchedViews, error: watchedError } = await supabase
            .from('views')
            .select('video_id')
            .eq('user_id', user.id);

        if (watchedError) {
            // Log the error but don't stop the process, as the page can still function
            console.error('Error fetching watched videos:', watchedError.message);
        }

        // Create a Set for quick lookups of watched video IDs
        const watchedVideoIds = new Set((watchedViews || []).map(v => v.video_id));

        // 3. Filter the fetched videos to exclude any that are in the watched set
        const availableVideos = videos.filter(video => !watchedVideoIds.has(video.id));
        
        // Hide the loader
        if (loaderEl) loaderEl.style.display = 'none';

        // 4. Display a message if there are no new videos to watch
        if (availableVideos.length === 0) {
            videoListEl.innerHTML = '<p class="col-span-full text-center text-gray-500">No new videos to watch right now. Check back later!</p>';
            return;
        }

        // 5. Render a card for each available video
        availableVideos.forEach(video => {
            let videoId = '';
            try {
                // Extract the YouTube video ID from the URL to create a thumbnail link
                const url = new URL(video.video_url);
                videoId = url.searchParams.get('v');
            } catch (e) {
                console.warn('Invalid URL format:', video.video_url);
            }
            
            // Use the YouTube thumbnail service or a placeholder if the URL is invalid
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://placehold.co/320x180/e2e8f0/4a5568?text=No+Preview';

            const card = `
                <div class="card bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                    <img src="${thumbnailUrl}" alt="Video thumbnail" class="w-full h-48 object-cover">
                    <div class="p-6 flex-grow flex flex-col">
                        <h3 class="font-bold text-lg text-gray-800 flex-grow">Community Video</h3>
                        <p class="text-sm text-gray-500 mb-4">Watch for 3 minutes to earn coins.</p>
                        <a href="watch.html?video_id=${video.id}" class="mt-auto text-center w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300">
                            Watch & Earn <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                </div>
            `;
            videoListEl.innerHTML += card;
        });
    };

    // --- INITIALIZATION ---
    fetchVideos();
});
