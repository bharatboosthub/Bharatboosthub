/*
 * Bharat Boost Hub - Firebase Core Setup & Authentication
 * /js/firebase.js
 * Last Updated: July 18, 2025
 */

// Import necessary functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
    // Added functions for email/password auth
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
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


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBOnW5Mv5YYquR1I9_Nn1ViprMVV0OubbM",
    authDomain: "bharat-boost-hub.firebaseapp.com",
    projectId: "bharat-boost-hub",
    storageBucket: "bharat-boost-hub.appspot.com",
    messagingSenderId: "1047323522415",
    appId: "1:1047323522415:web:4972c0bce15ae7253de49a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// --- Core User and Auth Functions ---

const handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                coinBalance: 100,
                createdAt: serverTimestamp()
            });
        }
        // The onAuthStateChanged listener will handle the redirect automatically
    } catch (error) {
        console.error("Google Login Error:", error);
        // You can add a user-facing error message here if needed
    }
};

const handleLogout = () => {
    signOut(auth).catch((error) => {
        console.error("Logout Error:", error);
    });
};

const getCurrentUserData = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
};


// --- This is now the ONLY auth state listener for the entire site ---
// It handles all redirects, preventing loops.
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['dashboard.html', 'upload.html', 'watch.html', 'coins.html'];
    
    if (user) {
        // If user is logged in and tries to visit login.html, redirect them to the dashboard.
        if (currentPage === 'login.html') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // If user is not logged in and tries to visit a protected page, redirect them to login.
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
});


// Export all necessary functions to be used by main.js
export {
    auth,
    db,
    storage,
    handleGoogleLogin,
    handleLogout,
    getCurrentUserData,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
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
```

After saving this file, please let me know, and I will provide the final corrected file, **`main.js`
