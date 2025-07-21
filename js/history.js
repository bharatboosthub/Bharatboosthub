// FILE: js/history.js
// Fetches and displays the user's campaign history.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure user is logged in
    const user = await protectPage();
    if (!user) return;

    // --- ELEMENT SELECTORS ---
    const historyTableBody = document.getElementById('history-table-body');
    const loaderEl = document.getElementById('loader');
    const noHistoryEl = document.getElementById('no-history');

    /**
     * Fetches the user's video campaigns and their associated view counts.
     */
    const fetchHistory = async () => {
        // Fetch videos uploaded by the current user.
        // We also perform a join-like operation to get the count of views for each video.
        // Supabase allows fetching related data and counts like this.
        const { data: videos, error } = await supabase
            .from('videos')
            .select(`
                id,
                created_at,
                video_url,
                status,
                views ( count )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }); // Show the newest campaigns first

        // Hide the loader once the data is fetched
        if (loaderEl) loaderEl.style.display = 'none';

        if (error) {
            console.error('Error fetching history:', error.message);
            historyTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Could not load your campaign history.</td></tr>`;
            return;
        }

        // If the user has no videos, show the "no history" message
        if (videos.length === 0) {
            if (noHistoryEl) noHistoryEl.classList.remove('hidden');
            return;
        }

        // --- RENDER HISTORY TABLE ---
        videos.forEach(video => {
            const date = new Date(video.created_at).toLocaleDateString();
            // The count is nested inside the 'views' array from the query
            const viewsCount = video.views[0]?.count || 0;
            const watchTime = viewsCount * 3; // 3 minutes per view

            // Extract YouTube video ID for the thumbnail
            let videoId = '';
            try {
                const url = new URL(video.video_url);
                videoId = url.searchParams.get('v');
            } catch (e) { /* Fails gracefully if URL is malformed */ }
            
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/default.jpg` : 'https://placehold.co/120x90/e2e8f0/4a5568?text=No+Preview';

            // Style the status badge based on its value
            const statusClass = video.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

            // Create the HTML for the table row
            const row = `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-16 w-24">
                                <img class="h-16 w-24 rounded-md object-cover" src="${thumbnailUrl}" alt="Video thumbnail">
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900 truncate max-w-xs">
                                    <a href="${video.video_url}" target="_blank" class="hover:text-indigo-600" title="${video.video_url}">${video.video_url}</a>
                                </div>
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
            // Append the new row to the table body
            historyTableBody.innerHTML += row;
        });
    };

    // --- INITIALIZATION ---
    fetchHistory();
});
