// FILE: js/dashboard.js
// Fetches and displays data for the main dashboard page.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // First, ensure the user is logged in. If not, protectPage will redirect them.
    const user = await protectPage();
    if (!user) return; // Stop execution if no user is found

    // --- ELEMENT SELECTORS ---
    const userEmailEl = document.getElementById('user-email');
    const coinBalanceEl = document.getElementById('coin-balance');
    const totalViewsEl = document.getElementById('total-views');
    const watchTimeEl = document.getElementById('watch-time');
    const subscribersGainedEl = document.getElementById('subscribers-gained');
    const activeCampaignsEl = document.getElementById('active-campaigns');

    // --- DATA FETCHING FUNCTIONS ---

    /**
     * Fetches the logged-in user's coin balance from the 'users' table.
     */
    const fetchCoinBalance = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('coin_balance')
            .eq('id', user.id)
            .single(); // .single() expects one row, which is perfect here

        if (error) {
            console.error('Error fetching coin balance:', error.message);
            if (coinBalanceEl) coinBalanceEl.textContent = 'N/A';
        } else if (data && coinBalanceEl) {
            coinBalanceEl.textContent = data.coin_balance;
        }
    };

    /**
     * Fetches analytics for the user's campaigns.
     * It counts their active campaigns and the total views their videos have received.
     */
    const fetchAnalytics = async () => {
        // Get all videos uploaded by the current user
        const { data: userVideos, error: videosError, count } = await supabase
            .from('videos')
            .select('id', { count: 'exact' }) // We only need the ID and the total count
            .eq('user_id', user.id);

        if (videosError) {
            console.error("Error fetching user videos:", videosError.message);
            return;
        }

        // Update the "Active Campaigns" card
        if (activeCampaignsEl) activeCampaignsEl.textContent = count ?? 0;

        // If the user has no videos, set analytics to 0 and stop
        if (!userVideos || userVideos.length === 0) {
            if (totalViewsEl) totalViewsEl.textContent = 0;
            if (watchTimeEl) watchTimeEl.textContent = 0;
            if (subscribersGainedEl) subscribersGainedEl.textContent = 0; // Mock data
            return;
        }

        // Get an array of the user's video IDs
        const videoIds = userVideos.map(v => v.id);

        // Get a count of all rows in the 'views' table that match the user's video IDs
        const { count: viewsCount, error: viewsError } = await supabase
            .from('views')
            .select('*', { count: 'exact', head: true }) // head:true makes it faster as it only returns the count
            .in('video_id', videoIds);

        if (viewsError) {
            console.error("Error fetching views count:", viewsError.message);
            return;
        }

        // Update the analytics cards with the fetched data
        if (totalViewsEl) totalViewsEl.textContent = viewsCount ?? 0;
        if (watchTimeEl) watchTimeEl.textContent = ((viewsCount ?? 0) * 3 / 60).toFixed(1); // 3 minutes per view, converted to hours
        if (subscribersGainedEl) subscribersGainedEl.textContent = 0; // This is mock data as we don't track subs
    };

    // --- INITIALIZATION ---

    // Display user email immediately
    if (userEmailEl) {
        userEmailEl.textContent = user.email;
    }

    // Call the functions to fetch and display the data
    fetchCoinBalance();
    fetchAnalytics();
});
