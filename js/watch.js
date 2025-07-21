// FILE: js/watch.js
// This version calls a secure backend Edge Function for AI verification.

import { supabase } from './supabase.js';
import { protectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await protectPage();
    if (!user) return;

    const loaderEl = document.getElementById('loader');
    const contentEl = document.getElementById('content');
    const watchVideoBtn = document.getElementById('watch-video-btn');
    const timerEl = document.getElementById('timer');
    const screenshotFileEl = document.getElementById('screenshot-file');
    const submitProofBtn = document.getElementById('submit-proof-btn');
    const uploadProofForm = document.getElementById('upload-proof-form');
    const messageEl = document.getElementById('message');

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video_id');

    if (!videoId) {
        window.location.href = 'watch-earn.html';
        return;
    }

    const showMessage = (text, isError = false) => {
        messageEl.textContent = text;
        messageEl.className = `mt-6 text-center text-sm h-5 ${isError ? 'text-red-500' : 'text-green-500'}`;
    };

    const { data: video, error } = await supabase
        .from('videos')
        .select('video_url')
        .eq('id', videoId)
        .single();

    if (error || !video) {
        window.location.href = 'watch-earn.html';
        return;
    }

    watchVideoBtn.href = video.video_url;
    loaderEl.style.display = 'none';
    contentEl.classList.remove('hidden');

    let timerInterval;
    const startTimer = () => {
        let duration = 180;
        timerInterval = setInterval(() => {
            const minutes = String(Math.floor(duration / 60)).padStart(2, '0');
            const seconds = String(duration % 60).padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;

            if (--duration < 0) {
                clearInterval(timerInterval);
                timerEl.textContent = '00:00';
                timerEl.classList.add('text-green-600');
                screenshotFileEl.disabled = false;
                submitProofBtn.disabled = false;
                showMessage('Timer finished! You can now upload your proof.', false);
            }
        }, 1000);
    };

    watchVideoBtn.addEventListener('click', startTimer, { once: true });

    uploadProofForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = screenshotFileEl.files[0];
        if (!file) {
            showMessage('Please select a screenshot file.', true);
            return;
        }

        submitProofBtn.disabled = true;
        submitProofBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading & Verifying...';

        const fileName = `${user.id}/${videoId}-${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
            .from('screenshot')
            .upload(fileName, file);

        if (uploadError) {
            showMessage('Failed to upload screenshot. Please try again.', true);
            console.error('Upload error:', uploadError);
            submitProofBtn.disabled = false;
            submitProofBtn.textContent = 'Submit for Verification';
            return;
        }

        // --- NEW: Call the backend Edge Function for verification ---
        try {
            const { data, error } = await supabase.functions.invoke('verify-screenshot', {
                body: { filePath: fileName, videoId: videoId },
            });

            if (error) throw error;

            if (data.verified) {
                showMessage('Verification successful! 5 coins have been added.', false);
                setTimeout(() => { window.location.href = 'watch-earn.html'; }, 3000);
            } else {
                showMessage(data.message || 'AI verification failed. Please ensure the screenshot is clear and shows the like/subscribe buttons.', true);
                submitProofBtn.disabled = false;
                submitProofBtn.textContent = 'Submit for Verification';
            }
        } catch (error) {
            console.error('Function invocation error:', error);
            showMessage('An error occurred during verification. Please try again.', true);
            submitProofBtn.disabled = false;
            submitProofBtn.textContent = 'Submit for Verification';
        }
    });
});
