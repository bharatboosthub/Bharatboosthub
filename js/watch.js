// FILE: js/watch.js
// Handles the logic for watching a video, the timer, and screenshot upload.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure user is logged in
    const user = await protectPage();
    if (!user) return;

    // --- ELEMENT SELECTORS ---
    const loaderEl = document.getElementById('loader');
    const contentEl = document.getElementById('content');
    const watchVideoBtn = document.getElementById('watch-video-btn');
    const timerEl = document.getElementById('timer');
    const screenshotFileEl = document.getElementById('screenshot-file');
    const submitProofBtn = document.getElementById('submit-proof-btn');
    const uploadProofForm = document.getElementById('upload-proof-form');
    const messageEl = document.getElementById('message');

    // Get the video_id from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video_id');

    // If there's no video_id, redirect back to the list
    if (!videoId) {
        window.location.href = 'watch-earn.html';
        return;
    }

    /**
     * Displays a message to the user.
     * @param {string} text - The message to display.
     * @param {boolean} [isError=false] - Toggles the style between success and error.
     */
    const showMessage = (text, isError = false) => {
        messageEl.textContent = text;
        messageEl.className = `mt-6 text-center text-sm h-5 ${isError ? 'text-red-500' : 'text-green-500'}`;
    };

    // --- DATA FETCHING ---
    // Fetch the video URL from the database using the videoId
    const { data: video, error } = await supabase
        .from('videos')
        .select('video_url')
        .eq('id', videoId)
        .single();

    if (error || !video) {
        console.error('Error fetching video URL:', error);
        contentEl.innerHTML = '<p class="text-red-500">Could not find the requested video.</p>';
        loaderEl.style.display = 'none';
        contentEl.classList.remove('hidden');
        return;
    }

    // Set the "Open YouTube" button link and show the main content
    watchVideoBtn.href = video.video_url;
    loaderEl.style.display = 'none';
    contentEl.classList.remove('hidden');

    // --- TIMER LOGIC ---
    let timerInterval;
    const startTimer = () => {
        let duration = 180; // 3 minutes in seconds
        timerInterval = setInterval(() => {
            const minutes = String(Math.floor(duration / 60)).padStart(2, '0');
            const seconds = String(duration % 60).padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;

            if (--duration < 0) {
                clearInterval(timerInterval);
                timerEl.textContent = '00:00';
                timerEl.classList.remove('text-indigo-600');
                timerEl.classList.add('text-green-600');
                // Enable the upload form once the timer is done
                screenshotFileEl.disabled = false;
                screenshotFileEl.classList.remove('cursor-not-allowed');
                submitProofBtn.disabled = false;
                submitProofBtn.classList.remove('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
                showMessage('Timer finished! You can now upload your proof.', false);
            }
        }, 1000);
    };

    // The timer starts only after the user clicks the "Open YouTube" button for the first time
    watchVideoBtn.addEventListener('click', startTimer, { once: true });


    // --- SCREENSHOT UPLOAD LOGIC ---
    uploadProofForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = screenshotFileEl.files[0];

        if (!file) {
            showMessage('Please select a screenshot file.', true);
            return;
        }

        submitProofBtn.disabled = true;
        submitProofBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';

        // Create a unique file name to avoid conflicts
        const fileName = `${user.id}/${videoId}-${Date.now()}`;

        // 1. Upload the screenshot to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('screenshots') // The bucket name must match what you created in Supabase
            .upload(fileName, file);

        if (uploadError) {
            showMessage('Failed to upload screenshot. Please try again.', true);
            console.error('Upload error:', uploadError);
            submitProofBtn.disabled = false;
            submitProofBtn.textContent = 'Submit for Verification';
            return;
        }

        // 2. Get the public URL of the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('screenshots')
            .getPublicUrl(fileName);

        // 3. Create a record in the 'views' table to log the action
        const { error: viewError } = await supabase
            .from('views')
            .insert([{
                user_id: user.id,
                video_id: videoId,
                screenshot_url: publicUrl,
                status: 'pending' // In a real app, an admin would verify this
            }]);

        if (viewError) {
            showMessage('Upload successful, but failed to record view. Please contact support.', true);
            console.error('View record error:', viewError);
            submitProofBtn.disabled = false;
            submitProofBtn.textContent = 'Submit for Verification';
            return;
        }

        // --- AUTO-VERIFICATION & COIN AWARD (for this project) ---
        // In a production app, this logic would be a secure backend function or manual process.
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('coin_balance')
            .eq('id', user.id)
            .single();
        
        if (userError) {
            showMessage('Verification pending. We could not fetch your balance to add coins.', true);
        } else {
            const newBalance = (userData.coin_balance || 0) + 1; // Award 1 coin
            await supabase.from('users').update({ coin_balance: newBalance }).eq('id', user.id);
            // Mark the view as verified
            await supabase.from('views').update({ status: 'verified' }).match({ user_id: user.id, video_id: videoId });
        }

        showMessage('Verification successful! 1 coin has been added to your balance.', false);
        
        // Redirect back to the video list after a delay
        setTimeout(() => {
            window.location.href = 'watch-earn.html';
        }, 3000);
    });
});
