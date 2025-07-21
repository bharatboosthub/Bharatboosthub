// FILE: js/history.js
// FINAL FIX: This version uses a more reliable query to prevent loading errors.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await protectPage();
    if (!user) return;

    const historyTableBody = document.getElementById('history-table-body');
    const loaderEl = document.getElementById('loader');
    const noHistoryEl = document.getElementById('no-history');

    const fetchHistory = async () => {
        // --- FIXED: Simplified the database query to be more reliable ---
        // Instead of counting views in the same query, we fetch the video data directly.
        // This is much less likely to fail due to permission issues.
        const { data: videos, error } = await supabase
            .from('videos')
            .select(`
                id,
                created_at,
                video_url,
                status,
                title, 
                thumbnail_url
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (loaderEl) loaderEl.style.display = 'none';

        if (error) {
            console.error('Error fetching history:', error.message);
            historyTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Could not load your campaign history.</td></tr>`;
            return;
        }

        if (videos.length === 0) {
            if (noHistoryEl) noHistoryEl.classList.remove('hidden');
            return;
        }

        // --- NEW: Fetch all view counts in a separate, efficient query ---
        const videoIds = videos.map(v => v.id);
        const { data: viewsData, error: viewsError } = await supabase
            .from('views')
            .select('video_id', { count: 'exact' })
            .in('video_id', videoIds)
            .eq('status', 'verified'); // Only count verified views
        
        if(viewsError) {
            console.error("Could not fetch view counts:", viewsError.message);
        }

        // Create a map for easy lookup of view counts
        const viewCounts = new Map();
        if(viewsData) {
            // This part is a bit complex, but it correctly counts views for each video
            videos.forEach(video => {
                const count = viewsData.filter(v => v.video_id === video.id).length;
                viewCounts.set(video.id, count);
            });
        }


        videos.forEach(video => {
            const date = new Date(video.created_at).toLocaleDateString();
            const viewsCount = viewCounts.get(video.id) || 0; // Get the count from our map
            const watchTime = viewsCount * 3;

            const thumbnailUrl = video.thumbnail_url || 'https://placehold.co/120x90/e2e8f0/4a5568?text=No+Preview';
            const videoTitle = video.title || video.video_url;

            const statusClass = video.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

            const row = `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-16 w-24">
                                <img class="h-16 w-24 rounded-md object-cover" src="${thumbnailUrl}" alt="Thumbnail for ${videoTitle}">
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900 truncate max-w-xs" title="${videoTitle}">
                                    ${videoTitle}
                                </div>
                                <a href="${video.video_url}" target="_blank" class="text-xs text-indigo-600 hover:underline">Watch on YouTube</a>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${video.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${viewsCount}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${watchTime}</td>
                </tr>
            `;
            historyTableBody.innerHTML += row;
        });
    };

    fetchHistory();
});
