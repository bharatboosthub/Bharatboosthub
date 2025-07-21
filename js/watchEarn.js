// FILE: js/watchEarn.js
// FIXED: This version now fetches and displays the real video titles and thumbnails.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await protectPage();
    if (!user) return;

    const videoListEl = document.getElementById('video-list');
    const loaderEl = document.getElementById('loader');

    const fetchVideos = async () => {
        // --- MODIFIED: Select all columns, including the new title and thumbnail_url ---
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*') // We need all columns to get the title and thumbnail
            .neq('user_id', user.id)
            .eq('status', 'active');

        if (error) {
            console.error('Error fetching videos:', error.message);
            if (loaderEl) loaderEl.style.display = 'none';
            videoListEl.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load videos.</p>';
            return;
        }

        const { data: watchedViews, error: watchedError } = await supabase
            .from('views')
            .select('video_id')
            .eq('user_id', user.id);

        if (watchedError) {
            console.error('Error fetching watched videos:', watchedError.message);
        }

        const watchedVideoIds = new Set((watchedViews || []).map(v => v.video_id));
        const availableVideos = videos.filter(video => !watchedVideoIds.has(video.id));
        
        if (loaderEl) loaderEl.style.display = 'none';

        if (availableVideos.length === 0) {
            videoListEl.innerHTML = '<p class="col-span-full text-center text-gray-500">No new videos to watch right now. Check back later!</p>';
            return;
        }

        availableVideos.forEach(video => {
            // --- NEW: Use the real thumbnail and title from the database ---
            // If the thumbnail_url is missing for any reason, use a placeholder.
            const thumbnailUrl = video.thumbnail_url || 'https://placehold.co/320x180/e2e8f0/4a5568?text=No+Preview';
            // If the title is missing, use a generic title.
            const videoTitle = video.title || 'Community Video';

            const card = `
                <div class="card bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                    <img src="${thumbnailUrl}" alt="Video thumbnail for ${videoTitle}" class="w-full h-48 object-cover">
                    <div class="p-6 flex-grow flex flex-col">
                        <h3 class="font-bold text-lg text-gray-800 flex-grow" title="${videoTitle}">
                            ${videoTitle}
                        </h3>
                        <a href="watch.html?video_id=${video.id}" class="mt-4 text-center w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300">
                            Watch & Earn <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                </div>
            `;
            videoListEl.innerHTML += card;
        });
    };

    fetchVideos();
});
