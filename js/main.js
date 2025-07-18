/*
 * Bharat Boost Hub - Main Application Logic
 * /js/main.js
 */

// Import all necessary functions and services from firebase.js
import {
    auth,
    db,
    storage,
    handleGoogleLogin,
    handleLogout,
    getCurrentUserData,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL
} from './firebase.js';

// --- Global Variables & Constants ---
const RAPIDAPI_KEY = 'bc73a476e6msh10240cb95786540p14f225jsn6eef43bdb1d6';
const RAPIDAPI_HOST = 'youtube138.p.rapidapi.com';
const COIN_RATES = {
    view: 5,
    like: 10,
    subscriber: 15,
};
const WATCH_TIME_SECONDS = 180; // 3 minutes

// --- Main Execution Logic ---

// This function runs when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for common elements like login/logout buttons
    initializeCommonEventListeners();

    // Determine the current page and run its specific logic
    const currentPage = window.location.pathname.split('/').pop();
    switch (currentPage) {
        case 'index.html':
        case '':
            initializeIndexPage();
            break;
        case 'dashboard.html':
            initializeDashboardPage();
            break;
        case 'upload.html':
            initializeUploadPage();
            break;
        case 'watch.html':
            initializeWatchPage();
            break;
        case 'coins.html':
            initializeCoinsPage();
            break;
    }

    // Update user info on any page that has the display elements
    updateUserInfoInHeader();
});


// --- Initialization Functions for Each Page ---

/**
 * Attaches event listeners to elements that appear on multiple pages (e.g., header, footer).
 */
function initializeCommonEventListeners() {
    const googleLoginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

/**
 * Logic for the index.html page.
 */
function initializeIndexPage() {
    // Currently no specific JS needed for the index page beyond common listeners.
    console.log("Index page loaded.");
}

/**
 * Logic for the dashboard.html page.
 */
async function initializeDashboardPage() {
    console.log("Dashboard page loaded.");
    const user = await getCurrentUserData();
    if (user) {
        const displayNameEl = document.getElementById('user-displayName');
        const coinBalanceEl = document.getElementById('user-coinBalance');
        if (displayNameEl) displayNameEl.textContent = user.displayName.split(' ')[0]; // Show first name
        if (coinBalanceEl) coinBalanceEl.textContent = user.coinBalance;
    }
}

/**
 * Logic for the upload.html page.
 */
function initializeUploadPage() {
    console.log("Upload page loaded.");
    const fetchBtn = document.getElementById('fetch-video-btn');
    const campaignForm = document.getElementById('campaign-form');

    if (fetchBtn) {
        fetchBtn.addEventListener('click', handleFetchVideo);
    }
    if (campaignForm) {
        campaignForm.addEventListener('submit', handleCampaignSubmit);
        // Add listeners to calculate cost in real-time
        ['views-wanted', 'likes-wanted', 'subs-wanted'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.addEventListener('input', calculateTotalCost);
        });
    }
}

/**
 * Logic for the watch.html page.
 */
function initializeWatchPage() {
    console.log("Watch page loaded.");
    loadAvailableVideos();
    
    const closeModalBtn = document.getElementById('close-modal-btn');
    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('watch-modal').classList.add('hidden');
            // Stop the YouTube video if it's playing
            const playerDiv = document.getElementById('youtube-player');
            if(playerDiv) playerDiv.innerHTML = '';
        });
    }
}

/**
 * Logic for the coins.html (Campaign History) page.
 */
function initializeCoinsPage() {
    console.log("Coins/History page loaded.");
    loadCampaignHistory();
    loadEarningsHistory();
}


// --- Feature-Specific Functions ---

/**
 * Fetches user info and updates header elements if they exist.
 */
async function updateUserInfoInHeader() {
    const coinBalanceEl = document.getElementById('user-coinBalance');
    if (coinBalanceEl && auth.currentUser) {
        const user = await getCurrentUserData();
        if (user) {
            coinBalanceEl.textContent = user.coinBalance;
        }
    }
}

/**
 * Handles fetching video details from the YouTube API.
 */
async function handleFetchVideo() {
    const urlInput = document.getElementById('youtube-url');
    const urlError = document.getElementById('url-error');
    const loader = document.getElementById('loader');
    const fetchBtn = document.getElementById('fetch-video-btn');

    const videoUrl = urlInput.value.trim();
    let videoId = '';

    // Basic URL validation and ID extraction
    try {
        const url = new URL(videoUrl);
        if (url.hostname === 'youtu.be') {
            videoId = url.pathname.slice(1);
        } else if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
            videoId = url.searchParams.get('v');
        } else {
            throw new Error();
        }
    } catch (e) {
        urlError.textContent = 'Please enter a valid YouTube video URL.';
        urlError.classList.remove('hidden');
        return;
    }

    urlError.classList.add('hidden');
    loader.classList.remove('hidden');
    fetchBtn.disabled = true;

    // The provided API seems to be for search/autocomplete. A better API would be one that gets details by ID.
    // We will use the autocomplete endpoint and hope the first result matches the ID.
    const apiUrl = `https://youtube138.p.rapidapi.com/video/details/?id=${videoId}&hl=en&gl=US`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
        }
    };

    try {
        const response = await fetch(apiUrl, options);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json();

        if (data && data.title && data.thumbnails) {
            // Populate the form with fetched data
            document.getElementById('video-thumbnail').src = data.thumbnails.pop().url;
            document.getElementById('video-title').textContent = data.title;
            document.getElementById('video-id-display').textContent = `Video ID: ${videoId}`;
            
            // Store videoId in a hidden way for form submission
            const campaignForm = document.getElementById('campaign-form');
            let hiddenInput = document.getElementById('video-id-hidden');
            if(!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = 'video-id-hidden';
                campaignForm.appendChild(hiddenInput);
            }
            hiddenInput.value = videoId;


            // Show the campaign details form
            document.getElementById('url-step').classList.add('hidden');
            campaignForm.classList.remove('hidden');
        } else {
            throw new Error('Video not found or API response is invalid.');
        }

    } catch (error) {
        console.error('Fetch Video Error:', error);
        urlError.textContent = `Error: ${error.message}. Please check the URL and try again.`;
        urlError.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
        fetchBtn.disabled = false;
    }
}

/**
 * Calculates the total cost of a campaign based on user input.
 */
async function calculateTotalCost() {
    const views = parseInt(document.getElementById('views-wanted').value) || 0;
    const likes = parseInt(document.getElementById('likes-wanted').value) || 0;
    const subs = parseInt(document.getElementById('subs-wanted').value) || 0;

    const totalCost = (views * COIN_RATES.view) + (likes * COIN_RATES.like) + (subs * COIN_RATES.subscriber);
    document.getElementById('total-cost').textContent = `${totalCost} Coins`;
    
    // Check if user has enough coins
    const user = await getCurrentUserData();
    const costError = document.getElementById('cost-error');
    const submitBtn = document.getElementById('submit-campaign-btn');
    
    if (user && user.coinBalance < totalCost) {
        costError.classList.remove('hidden');
        submitBtn.disabled = true;
    } else {
        costError.classList.add('hidden');
        submitBtn.disabled = (totalCost === 0);
    }
}

/**
 * Handles the submission of the new campaign form.
 */
async function handleCampaignSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submit-campaign-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const user = await getCurrentUserData();
    if (!user) {
        alert("You must be logged in to create a campaign.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Launch Campaign';
        return;
    }

    const views = parseInt(document.getElementById('views-wanted').value) || 0;
    const likes = parseInt(document.getElementById('likes-wanted').value) || 0;
    const subs = parseInt(document.getElementById('subs-wanted').value) || 0;
    const totalCost = (views * COIN_RATES.view) + (likes * COIN_RATES.like) + (subs * COIN_RATES.subscriber);

    if (user.coinBalance < totalCost) {
        alert("You do not have enough coins.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Launch Campaign';
        return;
    }

    try {
        // 1. Add campaign to Firestore
        const campaignData = {
            ownerId: user.uid,
            ownerName: user.displayName,
            videoId: document.getElementById('video-id-hidden').value,
            videoTitle: document.getElementById('video-title').textContent,
            thumbnailUrl: document.getElementById('video-thumbnail').src,
            goals: {
                views: views,
                likes: likes,
                subscribers: subs,
            },
            progress: {
                views: 0,
                likes: 0,
                subscribers: 0,
            },
            totalCost: totalCost,
            status: 'active', // active, completed
            createdAt: serverTimestamp(),
            completedBy: [] // Array of UIDs who completed this task
        };
        await addDoc(collection(db, "campaigns"), campaignData);

        // 2. Deduct coins from user
        const newBalance = user.coinBalance - totalCost;
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            coinBalance: newBalance
        });

        // 3. Show success message
        document.getElementById('success-modal').classList.remove('hidden');

    } catch (error) {
        console.error("Campaign Submission Error:", error);
        alert(`An error occurred: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Launch Campaign';
    }
}

/**
 * Loads and displays available videos on the watch.html page.
 */
async function loadAvailableVideos() {
    const videoList = document.getElementById('video-list');
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    const noVideosMessage = document.getElementById('no-videos-message');
    
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Query for active campaigns not owned by the current user
        const q = query(
            collection(db, "campaigns"),
            where("status", "==", "active"),
            where("ownerId", "!=", user.uid)
        );

        const querySnapshot = await getDocs(q);
        let availableVideos = [];
        querySnapshot.forEach(doc => {
            const campaign = { id: doc.id, ...doc.data() };
            // Extra check to ensure user hasn't already completed this campaign
            if (!campaign.completedBy || !campaign.completedBy.includes(user.uid)) {
                availableVideos.push(campaign);
            }
        });

        loadingPlaceholder.classList.add('hidden');
        videoList.innerHTML = ''; // Clear previous content

        if (availableVideos.length === 0) {
            noVideosMessage.classList.remove('hidden');
        } else {
            noVideosMessage.classList.add('hidden');
            availableVideos.forEach(video => {
                const totalReward = (video.goals.views > video.progress.views ? COIN_RATES.view : 0) + 
                                    (video.goals.likes > video.progress.likes ? COIN_RATES.like : 0) + 
                                    (video.goals.subscribers > video.progress.subscribers ? COIN_RATES.subscriber : 0);

                const card = document.createElement('div');
                card.className = 'video-card bg-white rounded-lg shadow-md overflow-hidden';
                card.innerHTML = `
                    <img src="${video.thumbnailUrl}" alt="Video Thumbnail" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="font-bold text-lg truncate" title="${video.videoTitle}">${video.videoTitle}</h3>
                        <div class="mt-4 flex justify-between items-center">
                            <span class="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Earn ${totalReward} Coins</span>
                            <button class="watch-btn bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-700" data-video-id="${video.videoId}" data-campaign-id="${video.id}">Watch</button>
                        </div>
                    </div>
                `;
                videoList.appendChild(card);
            });
            
            // Add event listeners to the new buttons
            document.querySelectorAll('.watch-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const videoId = e.target.dataset.videoId;
                    const campaignId = e.target.dataset.campaignId;
                    openWatchModal(videoId, campaignId);
                });
            });
        }

    } catch (error) {
        console.error("Error loading videos:", error);
        loadingPlaceholder.classList.add('hidden');
        videoList.innerHTML = `<p class="text-red-500 col-span-full">Failed to load videos. Please try again later.</p>`;
    }
}

let timerInterval; // To hold the interval ID for the timer

/**
 * Opens the modal for watching a video and starts the timer.
 */
function openWatchModal(videoId, campaignId) {
    const modal = document.getElementById('watch-modal');
    modal.classList.remove('hidden');

    // Embed YouTube video
    new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'autoplay': 1,
            'controls': 0, // Hide controls to encourage watching
        },
    });
    
    // Reset and start timer
    const timerDisplay = document.getElementById('timer-display');
    const proofSection = document.getElementById('proof-section');
    const uploadBtn = document.getElementById('upload-screenshot-btn');
    
    proofSection.classList.add('hidden');
    uploadBtn.disabled = true;
    
    let timeLeft = WATCH_TIME_SECONDS;
    clearInterval(timerInterval); // Clear any existing timer

    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "Time's up!";
            proofSection.classList.remove('hidden');
            uploadBtn.disabled = false;
            
            // Attach listener for the screenshot upload
            const uploadScreenshotBtn = document.getElementById('upload-screenshot-btn');
            const screenshotFile = document.getElementById('screenshot-file');
            
            // Use a wrapper function to avoid re-attaching listeners
            const uploadHandler = () => {
                screenshotFile.click();
            };
            
            uploadScreenshotBtn.onclick = uploadHandler;

            screenshotFile.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    handleProofUpload(file, campaignId);
                }
            };
        }
    }, 1000);
}

/**
 * Handles the screenshot upload and rewards the user.
 */
async function handleProofUpload(file, campaignId) {
    const user = auth.currentUser;
    if (!user || !file) return;

    const uploadStatus = document.getElementById('upload-status');
    uploadStatus.textContent = 'Uploading proof...';
    uploadStatus.classList.remove('text-green-600', 'text-red-500');

    try {
        // 1. Upload file to Firebase Storage
        const filePath = `screenshots/${campaignId}/${user.uid}_${Date.now()}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 2. Update campaign document in Firestore
        const campaignRef = doc(db, "campaigns", campaignId);
        const campaignSnap = await getDoc(campaignRef);
        if(!campaignSnap.exists()) throw new Error("Campaign not found.");
        
        const campaignData = campaignSnap.data();
        const newProgress = { ...campaignData.progress };
        let coinsEarned = 0;

        // Increment progress and calculate earnings
        if(campaignData.goals.views > newProgress.views) { newProgress.views++; coinsEarned += COIN_RATES.view; }
        if(campaignData.goals.likes > newProgress.likes) { newProgress.likes++; coinsEarned += COIN_RATES.like; }
        if(campaignData.goals.subscribers > newProgress.subscribers) { newProgress.subscribers++; coinsEarned += COIN_RATES.subscriber; }

        await updateDoc(campaignRef, {
            progress: newProgress,
            completedBy: [...(campaignData.completedBy || []), user.uid]
        });

        // 3. Add coins to the user's balance
        const userData = await getCurrentUserData();
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            coinBalance: userData.coinBalance + coinsEarned
        });

        // 4. Record the transaction for history
        await addDoc(collection(db, "earnings"), {
            userId: user.uid,
            campaignId: campaignId,
            videoTitle: campaignData.videoTitle,
            coinsEarned: coinsEarned,
            proofUrl: downloadURL,
            createdAt: serverTimestamp()
        });

        uploadStatus.textContent = `Success! You earned ${coinsEarned} coins.`;
        uploadStatus.classList.add('text-green-600');
        
        // Close modal after a short delay
        setTimeout(() => {
            document.getElementById('watch-modal').classList.add('hidden');
            location.reload(); // Reload to refresh the video list
        }, 2000);

    } catch (error) {
        console.error("Proof Upload Error:", error);
        uploadStatus.textContent = `Error: ${error.message}`;
        uploadStatus.classList.add('text-red-500');
    }
}


/**
 * Loads and displays the user's campaign history on coins.html.
 */
async function loadCampaignHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const tableBody = document.getElementById('campaigns-table-body');
    const loadingRow = document.getElementById('campaigns-loading');
    const emptyRow = document.getElementById('campaigns-empty');

    try {
        const q = query(collection(db, "campaigns"), where("ownerId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        loadingRow.classList.add('hidden');
        if (querySnapshot.empty) {
            emptyRow.classList.remove('hidden');
        } else {
            querySnapshot.forEach(doc => {
                const campaign = doc.data();
                const progress = campaign.progress;
                const goals = campaign.goals;
                const statusClass = campaign.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
                
                const row = document.createElement('tr');
                row.className = 'bg-white border-b';
                row.innerHTML = `
                    <td class="px-6 py-4 flex items-center space-x-3">
                        <img class="h-10 w-16 object-cover rounded" src="${campaign.thumbnailUrl}" alt="thumbnail">
                        <span class="font-medium text-gray-900 truncate" title="${campaign.videoTitle}">${campaign.videoTitle}</span>
                    </td>
                    <td class="px-6 py-4">${goals.views} / ${goals.likes} / ${goals.subscribers}</td>
                    <td class="px-6 py-4">${progress.views} / ${progress.likes} / ${progress.subscribers}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${campaign.status}</span>
                    </td>
                    <td class="px-6 py-4">${new Date(campaign.createdAt.seconds * 1000).toLocaleDateString()}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading campaign history:", error);
        loadingRow.classList.add('hidden');
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Failed to load history.</td></tr>`;
    }
}

/**
 * Loads and displays the user's earnings history on coins.html.
 */
async function loadEarningsHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const tableBody = document.getElementById('earnings-table-body');
    const loadingRow = document.getElementById('earnings-loading');
    const emptyRow = document.getElementById('earnings-empty');

    try {
        const q = query(collection(db, "earnings"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        loadingRow.classList.add('hidden');
        if (querySnapshot.empty) {
            emptyRow.classList.remove('hidden');
        } else {
            querySnapshot.forEach(doc => {
                const earning = doc.data();
                const row = document.createElement('tr');
                row.className = 'bg-white border-b';
                row.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-900">Watched Video</td>
                    <td class="px-6 py-4 truncate" title="${earning.videoTitle}">${earning.videoTitle}</td>
                    <td class="px-6 py-4 font-semibold text-green-600">+${earning.coinsEarned}</td>
                    <td class="px-6 py-4">${new Date(earning.createdAt.seconds * 1000).toLocaleDateString()}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading earnings history:", error);
        loadingRow.classList.add('hidden');
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Failed to load history.</td></tr>`;
    }
}
