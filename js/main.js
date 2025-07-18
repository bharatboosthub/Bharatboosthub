/*
 * Bharat Boost Hub - Main Application Logic
 * /js/main.js
 * Last Updated: July 18, 2025 - Direct Redirect Fix
 */

// Import only the necessary functions. We will handle routing manually.
import {
    auth,
    db,
    getCurrentUserData,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    doc,
    setDoc,
    serverTimestamp,
    // Add other functions from firebase.js that are used in other pages
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    ref,
    uploadBytes,
    getDownloadURL
} from './firebase.js';


// --- Main Execution Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // --- Manual Page Protection ---
    // Before initializing anything, check if the user should be on this page.
    const protectedPages = ['dashboard.html', 'upload.html', 'watch.html', 'coins.html'];
    const isProtected = protectedPages.includes(currentPage);

    // This check runs immediately.
    // If on a protected page and not logged in, redirect immediately.
    if (isProtected && !auth.currentUser) {
        window.location.href = 'login.html';
        return; // Stop any other code from running
    }

    // If the checks pass, initialize the page's content.
    initializePageContent(currentPage);
});


/**
 * Initializes the specific logic for the current page.
 */
function initializePageContent(currentPage) {
    // Attach the logout listener to the logout button if it exists.
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                // Force redirect to login page after logout.
                window.location.href = 'login.html';
            });
        });
    }

    // Run the correct function based on the current page.
    switch (currentPage) {
        case 'login.html':
        case '': // Also handle the root URL
            initializeLoginPage();
            break;
        case 'dashboard.html':
            initializeDashboardPage();
            break;
        // Add other cases for other pages here...
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
    updateUserInfoInHeader();
}


/**
 * Contains all logic for the login page.
 */
function initializeLoginPage() {
    // If a user is already logged in and somehow gets to the login page, send them away.
    if (auth.currentUser) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Logic to switch between login and sign-up forms
    if (showSignupBtn) showSignupBtn.addEventListener('click', (e) => { e.preventDefault(); showView(signupView); });
    if (showLoginBtn) showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); showView(loginView); });
    function showView(view) {
        loginView.classList.toggle('active', view === loginView);
        signupView.classList.toggle('active', view === signupView);
    }

    // --- Sign-Up Form Logic ---
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const feedbackEl = document.getElementById('signup-feedback');
            
            feedbackEl.textContent = 'Creating account...';

            createUserWithEmailAndPassword(auth, email, password)
                .then(userCredential => {
                    const user = userCredential.user;
                    const userRef = doc(db, "users", user.uid);
                    // Create the user profile in the database
                    return setDoc(userRef, {
                        uid: user.uid,
                        displayName: name,
                        email: user.email,
                        photoURL: null,
                        coinBalance: 100,
                        createdAt: serverTimestamp()
                    });
                })
                .then(() => {
                    // **THE FIX**: Force redirect immediately after the profile is created.
                    window.location.href = 'dashboard.html';
                })
                .catch(error => {
                    let msg = 'An error occurred.';
                    if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
                    else if (error.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
                    feedbackEl.textContent = msg;
                });
        });
    }

    // --- Login Form Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const feedbackEl = document.getElementById('login-feedback');
            feedbackEl.textContent = 'Signing in...';

            signInWithEmailAndPassword(auth, email, password)
                .then(userCredential => {
                    // **THE FIX**: Force redirect immediately on successful login.
                    window.location.href = 'dashboard.html';
                })
                .catch(error => {
                    feedbackEl.textContent = 'Invalid email or password.';
                });
        });
    }
}


// --- Other Page Initializers (No changes needed below) ---

async function initializeDashboardPage() {
    const user = await getCurrentUserData();
    if (user) {
        const displayNameEl = document.getElementById('user-displayName');
        const coinBalanceEl = document.getElementById('user-coinBalance');
        if (displayNameEl) displayNameEl.textContent = user.displayName.split(' ')[0];
        if (coinBalanceEl) coinBalanceEl.textContent = user.coinBalance;
    }
}

function initializeUploadPage() {
    const fetchBtn = document.getElementById('fetch-video-btn');
    const campaignForm = document.getElementById('campaign-form');
    if (fetchBtn) fetchBtn.addEventListener('click', handleFetchVideo);
    if (campaignForm) {
        campaignForm.addEventListener('submit', handleCampaignSubmit);
        ['views-wanted', 'likes-wanted', 'subs-wanted'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.addEventListener('input', calculateTotalCost);
        });
    }
}

function initializeWatchPage() {
    loadAvailableVideos();
    const closeModalBtn = document.getElementById('close-modal-btn');
    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('watch-modal').classList.add('hidden');
            const playerDiv = document.getElementById('youtube-player');
            if(playerDiv) playerDiv.innerHTML = '';
        });
    }
}

function initializeCoinsPage() {
    loadCampaignHistory();
    loadEarningsHistory();
}

async function updateUserInfoInHeader() {
    const user = auth.currentUser;
    if (!user) return;
    const coinBalanceEl = document.getElementById('user-coinBalance');
    if (coinBalanceEl) {
        const userData = await getCurrentUserData();
        if (userData) {
            coinBalanceEl.textContent = userData.coinBalance;
        }
    }
}

// ... the rest of the file (handleFetchVideo, etc.) remains the same ...
async function handleFetchVideo(){
    const urlInput = document.getElementById('youtube-url');
    const urlError = document.getElementById('url-error');
    const loader = document.getElementById('loader');
    const fetchBtn = document.getElementById('fetch-video-btn');
    const videoUrl = urlInput.value.trim();
    let videoId = '';
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
    const apiUrl = `https://youtube138.p.rapidapi.com/video/details/?id=${videoId}&hl=en&gl=US`;
    const options = { method: 'GET', headers: { 'X-RapidAPI-Key': 'bc73a476e6msh10240cb95786540p14f225jsn6eef43bdb1d6', 'X-RapidAPI-Host': 'youtube138.p.rapidapi.com' } };
    try {
        const response = await fetch(apiUrl, options);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json();
        if (data && data.title && data.thumbnails) {
            document.getElementById('video-thumbnail').src = data.thumbnails.pop().url;
            document.getElementById('video-title').textContent = data.title;
            document.getElementById('video-id-display').textContent = `Video ID: ${videoId}`;
            const campaignForm = document.getElementById('campaign-form');
            let hiddenInput = document.getElementById('video-id-hidden');
            if(!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = 'video-id-hidden';
                campaignForm.appendChild(hiddenInput);
            }
            hiddenInput.value = videoId;
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
async function calculateTotalCost(){
    const views = parseInt(document.getElementById('views-wanted').value) || 0;
    const likes = parseInt(document.getElementById('likes-wanted').value) || 0;
    const subs = parseInt(document.getElementById('subs-wanted').value) || 0;
    const totalCost = (views * 5) + (likes * 10) + (subs * 15);
    document.getElementById('total-cost').textContent = `${totalCost} Coins`;
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
async function handleCampaignSubmit(event){
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
    const totalCost = (views * 5) + (likes * 10) + (subs * 15);
    if (user.coinBalance < totalCost) {
        alert("You do not have enough coins.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Launch Campaign';
        return;
    }
    try {
        const campaignData = {
            ownerId: user.uid,
            ownerName: user.displayName,
            videoId: document.getElementById('video-id-hidden').value,
            videoTitle: document.getElementById('video-title').textContent,
            thumbnailUrl: document.getElementById('video-thumbnail').src,
            goals: { views, likes, subscribers: subs },
            progress: { views: 0, likes: 0, subscribers: 0 },
            totalCost,
            status: 'active',
            createdAt: serverTimestamp(),
            completedBy: []
        };
        await addDoc(collection(db, "campaigns"), campaignData);
        const newBalance = user.coinBalance - totalCost;
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { coinBalance: newBalance });
        document.getElementById('success-modal').classList.remove('hidden');
    } catch (error) {
        console.error("Campaign Submission Error:", error);
        alert(`An error occurred: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Launch Campaign';
    }
}
async function loadAvailableVideos(){
    const videoList = document.getElementById('video-list');
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    const noVideosMessage = document.getElementById('no-videos-message');
    const user = auth.currentUser;
    if (!user) return;
    try {
        const q = query(collection(db, "campaigns"), where("status", "==", "active"), where("ownerId", "!=", user.uid));
        const querySnapshot = await getDocs(q);
        let availableVideos = [];
        querySnapshot.forEach(doc => {
            const campaign = { id: doc.id, ...doc.data() };
            if (!campaign.completedBy || !campaign.completedBy.includes(user.uid)) {
                availableVideos.push(campaign);
            }
        });
        loadingPlaceholder.classList.add('hidden');
        videoList.innerHTML = '';
        if (availableVideos.length === 0) {
            noVideosMessage.classList.remove('hidden');
        } else {
            noVideosMessage.classList.add('hidden');
            availableVideos.forEach(video => {
                const totalReward = (video.goals.views > video.progress.views ? 5 : 0) + (video.goals.likes > video.progress.likes ? 10 : 0) + (video.goals.subscribers > video.progress.subscribers ? 15 : 0);
                const card = document.createElement('div');
                card.className = 'video-card bg-white rounded-lg shadow-md overflow-hidden';
                card.innerHTML = `<img src="${video.thumbnailUrl}" alt="Video Thumbnail" class="w-full h-48 object-cover"><div class="p-4"><h3 class="font-bold text-lg truncate" title="${video.videoTitle}">${video.videoTitle}</h3><div class="mt-4 flex justify-between items-center"><span class="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Earn ${totalReward} Coins</span><button class="watch-btn bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-700" data-video-id="${video.videoId}" data-campaign-id="${video.id}">Watch</button></div></div>`;
                videoList.appendChild(card);
            });
            document.querySelectorAll('.watch-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    openWatchModal(e.target.dataset.videoId, e.target.dataset.campaignId);
                });
            });
        }
    } catch (error) {
        console.error("Error loading videos:", error);
        loadingPlaceholder.classList.add('hidden');
        videoList.innerHTML = `<p class="text-red-500 col-span-full">Failed to load videos. Please try again later.</p>`;
    }
}
let timerInterval;
function openWatchModal(videoId, campaignId){
    document.getElementById('watch-modal').classList.remove('hidden');
    new YT.Player('youtube-player', { height: '100%', width: '100%', videoId: videoId, playerVars: { 'playsinline': 1, 'autoplay': 1, 'controls': 0 } });
    const timerDisplay = document.getElementById('timer-display');
    const proofSection = document.getElementById('proof-section');
    const uploadBtn = document.getElementById('upload-screenshot-btn');
    proofSection.classList.add('hidden');
    uploadBtn.disabled = true;
    let timeLeft = 180;
    clearInterval(timerInterval);
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
            const uploadScreenshotBtn = document.getElementById('upload-screenshot-btn');
            const screenshotFile = document.getElementById('screenshot-file');
            uploadScreenshotBtn.onclick = () => screenshotFile.click();
            screenshotFile.onchange = (e) => {
                if (e.target.files[0]) handleProofUpload(e.target.files[0], campaignId);
            };
        }
    }, 1000);
}
async function handleProofUpload(file, campaignId){
    const user = auth.currentUser;
    if (!user || !file) return;
    const uploadStatus = document.getElementById('upload-status');
    uploadStatus.textContent = 'Uploading proof...';
    uploadStatus.classList.remove('text-green-600', 'text-red-500');
    try {
        const filePath = `screenshots/${campaignId}/${user.uid}_${Date.now()}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        const campaignRef = doc(db, "campaigns", campaignId);
        const campaignSnap = await getDoc(campaignRef);
        if(!campaignSnap.exists()) throw new Error("Campaign not found.");
        const campaignData = campaignSnap.data();
        const newProgress = { ...campaignData.progress };
        let coinsEarned = 0;
        if(campaignData.goals.views > newProgress.views) { newProgress.views++; coinsEarned += 5; }
        if(campaignData.goals.likes > newProgress.likes) { newProgress.likes++; coinsEarned += 10; }
        if(campaignData.goals.subscribers > newProgress.subscribers) { newProgress.subscribers++; coinsEarned += 15; }
        await updateDoc(campaignRef, { progress: newProgress, completedBy: [...(campaignData.completedBy || []), user.uid] });
        const userData = await getCurrentUserData();
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { coinBalance: userData.coinBalance + coinsEarned });
        await addDoc(collection(db, "earnings"), { userId: user.uid, campaignId, videoTitle: campaignData.videoTitle, coinsEarned, proofUrl: downloadURL, createdAt: serverTimestamp() });
        uploadStatus.textContent = `Success! You earned ${coinsEarned} coins.`;
        uploadStatus.classList.add('text-green-600');
        setTimeout(() => {
            document.getElementById('watch-modal').classList.add('hidden');
            location.reload();
        }, 2000);
    } catch (error) {
        console.error("Proof Upload Error:", error);
        uploadStatus.textContent = `Error: ${error.message}`;
        uploadStatus.classList.add('text-red-500');
    }
}
async function loadCampaignHistory(){
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
                const statusClass = campaign.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
                const row = document.createElement('tr');
                row.className = 'bg-white border-b';
                row.innerHTML = `<td class="px-6 py-4 flex items-center space-x-3"><img class="h-10 w-16 object-cover rounded" src="${campaign.thumbnailUrl}" alt="thumbnail"><span class="font-medium text-gray-900 truncate" title="${campaign.videoTitle}">${campaign.videoTitle}</span></td><td class="px-6 py-4">${campaign.goals.views} / ${campaign.goals.likes} / ${campaign.goals.subscribers}</td><td class="px-6 py-4">${campaign.progress.views} / ${campaign.progress.likes} / ${campaign.progress.subscribers}</td><td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${campaign.status}</span></td><td class="px-6 py-4">${new Date(campaign.createdAt.seconds * 1000).toLocaleDateString()}</td>`;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading campaign history:", error);
        loadingRow.classList.add('hidden');
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Failed to load history.</td></tr>`;
    }
}
async function loadEarningsHistory(){
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
                row.innerHTML = `<td class="px-6 py-4 font-medium text-gray-900">Watched Video</td><td class="px-6 py-4 truncate" title="${earning.videoTitle}">${earning.videoTitle}</td><td class="px-6 py-4 font-semibold text-green-600">+${earning.coinsEarned}</td><td class="px-6 py-4">${new Date(earning.createdAt.seconds * 1000).toLocaleDateString()}</td>`;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading earnings history:", error);
        loadingRow.classList.add('hidden');
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Failed to load history.</td></tr>`;
    }
}
```

After updating your `js/main.js` file with this code, please try logging in or signing up again. It should now redirect you to the dashboard without any issu
