// FILE: js/upload.js
// Handles the logic for the video upload form.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure the user is logged in before allowing any action
    const user = await protectPage();
    if (!user) return;

    // --- ELEMENT SELECTORS ---
    const uploadForm = document.getElementById('upload-form');
    const messageEl = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');

    /**
     * Displays a message to the user.
     * @param {string} text - The message to display.
     * @param {boolean} [isError=false] - Toggles the message style between success and error.
     */
    const showMessage = (text, isError = false) => {
        messageEl.textContent = text;
        messageEl.className = `mt-6 text-center text-sm h-5 ${isError ? 'text-red-500' : 'text-green-500'}`;
    };

    /**
     * Resets the submit button to its original state.
     */
    const resetButton = () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Start Campaign (5 <i class="fas fa-coins text-yellow-300 ml-2"></i>)';
    };

    // --- FORM SUBMISSION HANDLER ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

        const videoUrl = document.getElementById('video-url').value.trim();

        // --- FINAL FIX: This regex correctly handles all standard YouTube URL formats,
        // including those with extra query parameters like '?si=' or '&t='.
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|embed\/)?([\w-]{11})/;
        if (!youtubeRegex.test(videoUrl)) {
            showMessage('Please enter a valid YouTube video URL.', true);
            resetButton();
            return;
        }

        // --- DATABASE OPERATIONS ---

        // 1. Get the user's current coin balance
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('coin_balance')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            showMessage('Error fetching your balance. Please try again.', true);
            console.error('User fetch error:', userError);
            resetButton();
            return;
        }

        // 2. Check if the user has enough coins
        if (userData.coin_balance < 5) {
            showMessage('You do not have enough coins (5 required). Earn more by watching videos.', true);
            resetButton();
            return;
        }
        
        // 3. Deduct coins from the user's balance
        const newBalance = userData.coin_balance - 5;
        const { error: updateError } = await supabase
            .from('users')
            .update({ coin_balance: newBalance })
            .eq('id', user.id);

        if (updateError) {
            showMessage('Failed to deduct coins. Please try again.', true);
            console.error('Coin deduction error:', updateError);
            resetButton();
            return;
        }

        // 4. If coins are deducted, add the video to the 'videos' table
        const { error: videoError } = await supabase
            .from('videos')
            .insert([{ user_id: user.id, video_url: videoUrl, status: 'active' }]);

        // 5. IMPORTANT: If video insertion fails, refund the coins to the user
        if (videoError) {
            await supabase.from('users').update({ coin_balance: userData.coin_balance }).eq('id', user.id);
            showMessage('Failed to create campaign. Your coins have been refunded.', true);
            console.error('Video insertion error:', videoError);
            resetButton();
            return;
        }
        
        // --- SUCCESS ---
        showMessage('Campaign created successfully! Your video is now being promoted.', false);
        uploadForm.reset();
        
        // Redirect to the dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    });
});
