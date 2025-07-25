// FILE: js/history.js
// FINAL FIX v2: This version will display the exact database error on the screen.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await protectPage();
    if (!user) return;

    const historyTableBody = document.getElementById('history-table-body');
    const loaderEl = document.getElementById('loader');
    const noHistoryEl = document.getElementById('no-history');

    const fetchHistory = async () => {
        // This is a single, simple, and secure call to our database function.
        const { data: videos, error } = await supabase
            .rpc('get_user_campaign_history');

        if (loaderEl) loaderEl.style.display = 'none';

        if (error) {
            // --- NEW: Display the specific error message directly on the page ---
            console.error('Error fetching history:', error); // Keep logging for our records
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center p-4 text-red-500">
                        <p class="font-bold">Failed to load history. The database returned this error:</p>
                        <p class="mt-2 font-mono text-xs">${error.message}</p>
                    </td>
                </tr>
            `;
            return;
        }

        if (videos.length === 0) {
            if (noHistoryEl) noHistoryEl.classList.remove('hidden');
            return;
        }

        videos.forEach(video => {
            const date = new Date(video.created_at).toLocaleDateString();
            const viewsCount = video.view_count || 0;
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
