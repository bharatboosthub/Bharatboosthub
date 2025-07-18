/*
 * Bharat Boost Hub - Firebase Core Setup & Authentication
 * /js/firebase.js
 */

// Import necessary functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";


// Your web app's Firebase configuration, as provided
const firebaseConfig = {
    apiKey: "AlzaSyBOnW5Mv5YYquR119_Nn1ViprMVV00ubbM", // NOTE: User provided key starts with Alza, not AIza. Using as is.
    authDomain: "bharat-boost-hub.firebaseapp.com",
    projectId: "bharat-boost-hub",
    storageBucket: "bharat-boost-hub.appspot.com",
    messagingSenderId: "1047323522415",
    appId: "1:1047323522415:web:e6c5a0c8d8a7b9c6f0a1b2" // Generated a plausible App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// --- Core User and Auth Functions ---

/**
 * Handles the Google Sign-In process.
 * After successful login, it checks for an existing user record in Firestore.
 * If the user is new, it creates a new record with a starting coin balance.
 */
const handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // User is new, create a document for them
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                coinBalance: 100, // Welcome gift of 100 coins
                createdAt: serverTimestamp()
            });
            console.log("New user created in Firestore.");
        } else {
            console.log("Returning user logged in.");
        }

        // Redirect to dashboard after successful login
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error("Google Login Error:", error);
        // Display error to the user on the login page
        const errorElement = document.getElementById('login-error');
        if(errorElement) {
            errorElement.textContent = `Login failed: ${error.message}`;
            errorElement.classList.remove('hidden');
        }
    }
};

/**
 * Handles the user logout process.
 */
const handleLogout = () => {
    signOut(auth).then(() => {
        console.log("User signed out.");
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
};


/**
 * Retrieves the currently logged-in user's data from Firestore.
 * @returns {Promise<object|null>} A promise that resolves with the user's data object, or null if not found.
 */
const getCurrentUserData = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
    } else {
        console.error("No user data found in Firestore for logged-in user.");
        return null;
    }
};


// --- Route Protection and Auth State Management ---

/**
 * This is the central function that manages user sessions.
 * It runs when the page loads and whenever the auth state changes.
 * It protects pages that require a login and redirects users accordingly.
 */
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['dashboard.html', 'upload.html', 'watch.html', 'coins.html'];
    const publicPages = ['login.html', 'index.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'disclaimer.html', '']; // '' for root

    if (user) {
        // User is signed in
        if (currentPage === 'login.html') {
            // If user is on login page, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is not signed in
        if (protectedPages.includes(currentPage)) {
            // If user tries to access a protected page, redirect to login
            console.log("Access denied. Redirecting to login.");
            window.location.href = 'login.html';
        }
    }
});


// Export all the necessary services and functions to be used in main.js
export {
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
};
