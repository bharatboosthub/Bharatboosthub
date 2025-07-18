/*
 * Bharat Boost Hub - Firebase Core Setup & Authentication
 * /js/firebase.js
 * Last Updated: July 18, 2025 - Simplified Redirect Logic
 */

// Import necessary functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getAuth, 
    // **REMOVED onAuthStateChanged to prevent redirect conflicts
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
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
        // Explicit redirect
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Google Login Error:", error);
    }
};

const handleLogout = () => {
    signOut(auth)
    .then(() => {
        // Explicit redirect on logout
        window.location.href = 'login.html';
    })
    .catch((error) => {
        console.error("Logout Error:", error);
    });
};

const getCurrentUserData = async () => {
    const user = auth.currentUser;
    if (!user) {
        // If there's no user on a protected page, redirect to login
        const protectedPages = ['dashboard.html', 'upload.html', 'watch.html', 'coins.html'];
        if (protectedPages.includes(window.location.pathname.split('/').pop())) {
             window.location.href = 'login.html';
        }
        return null;
    }
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
};


// **FIXED**: The onAuthStateChanged listener has been completely removed.
// All redirects are now handled explicitly in main.js or the functions above.


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

**What this change does:**

* It **removes the conflicting `onAuthStateChanged` listener** entirely.
* The only code that can now redirect you is the `window.location.href = 'dashboard.html';` line inside the `main.js` file, which runs *only* after a successful login or sign-up.
* I also added a redirect inside the `handleLogout` function to ensure logging out works correctly.
* I added a check inside `getCurrentUserData` to protect your pages.

This approach is simpler and removes the possibility of a race condition. Please update your `js/firebase.js` file with this code, and try one more time. This should resolve the issue for go
