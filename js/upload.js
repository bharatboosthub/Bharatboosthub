// FILE: js/upload.js
// This version now calls a backend function to fetch YouTube details after upload.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await protectPage();
    if (!user) return;

    const uploadForm = document.getElementById('upload-form');
    const messageEl = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');

    const showMessage = (text, isError = false) => {
        messageEl.textContent = text;
        messageEl.className = `mt-6 text-center text-sm h-5 ${isError ? 'text-red-500' : 'text-green-500'}`;
    };

    const resetButton = () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Start Campaign (5 <i class="fas fa-coins text-yellow-300 ml-2"></i>)';
    };

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

        const videoUrl = document.getElementById('video-url').value.trim();
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|embed\/)?([\w-]{11})/;
        if (!youtubeRegex.test(videoUrl)) {
            showMessage('Please enter a valid YouTube video URL.', true);
            resetButton();
            return;
        }

        const { data: userData, error: userError } = await supabase.from('users').select('coin_balance').eq('id', user.id).single();
        if (userError || !userData) {
            showMessage('Error fetching your balance. Please try again.', true);
            resetButton();
            return;
        }

        if (userData.coin_balance < 5) {
            showMessage('You do not have enough coins (5 required).', true);
            resetButton();
            return;
        }
        
        const newBalance = userData.coin_balance - 5;
        const { error: updateError } = await supabase.from('users').update({ coin_balance: newBalance }).eq('id', user.id);
        if (updateError) {
            showMessage('Failed to deduct coins. Please try again.', true);
            resetButton();
            return;
        }

        // --- MODIFIED: Insert video and get its ID back ---
        const { data: newVideo, error: videoError } = await supabase
            .from('videos')
            .insert([{ user_id: user.id, video_url: videoUrl }])
            .select('id') // Ask Supabase to return the 'id' of the new row
            .single();   // We expect only one row to be created

        if (videoError) {
            await supabase.from('users').update({ coin_balance: userData.coin_balance }).eq('id', user.id);
            showMessage('Failed to create campaign. Your coins have been refunded.', true);
            resetButton();
            return;
        }
        
        // --- NEW: Call the Edge Function to fetch details ---
        showMessage('Campaign created! Fetching video details...', false);

        try {
            await supabase.functions.invoke('fetch-youtube-details', {
                body: { videoUrl: videoUrl, videoRecordId: newVideo.id },
            });
            
            showMessage('Video details fetched successfully!', false);
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);

        } catch (fetchError) {
            // This is not a critical error, the campaign is still created.
            // The user can still proceed, even if the title/thumbnail fails to fetch.
            console.error("Failed to fetch YouTube details:", fetchError.message);
            showMessage('Campaign created, but could not fetch video details.', true);
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 3000);
        }
    });
});
