// FILE: js/auth.js
// Handles all user authentication logic: login, registration, logout, and session management.

// We will create js/supabase.js next. For now, this import will not resolve.
import { supabase } from './supabase.js';

// --- ELEMENT SELECTORS ---
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
// A single selector for all logout buttons across the site
const logoutButtons = document.querySelectorAll('#logout-btn');
const errorMessageEl = document.querySelector('#error-message');

// --- HELPER FUNCTIONS ---
/**
 * Displays a message to the user, typically for errors or success notifications.
 * @param {string} message - The message to display.
 * @param {boolean} [isError=true] - Toggles between error (red) and success (green) styling.
 */
const showMessage = (message, isError = true) => {
    if (errorMessageEl) {
        errorMessageEl.textContent = message;
        errorMessageEl.className = isError ? 'mt-4 text-center text-red-500 text-sm h-4' : 'mt-4 text-center text-green-500 text-sm h-4';
    }
};

// --- CORE AUTH FUNCTIONS ---

/**
 * Handles the user login process.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
const handleLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        showMessage(error.message);
        return;
    }

    if (data.user) {
        window.location.href = 'dashboard.html';
    }
};

/**
 * Handles the user registration process.
 * On success, it also creates a corresponding user profile in the 'users' table.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
const handleRegister = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        showMessage(error.message);
        return;
    }

    // On successful signup, Supabase automatically creates a profile via a database trigger.
    // So, we can just log the user in.
    if (data.user) {
        alert('Registration successful! Please check your email to verify your account.');
        // Redirect to login page after showing the alert
        window.location.href = 'login.html';
    }
};

/**
 * Handles the user logout process and redirects to the home page.
 */
const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
        alert('Failed to log out. Please try again.');
    } else {
        window.location.href = 'index.html';
    }
};

// --- EVENT LISTENERS ---

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value.trim();
        handleLogin(email, password);
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value.trim();
        const confirmPassword = registerForm['confirm-password'].value.trim();

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            showMessage("Password must be at least 6 characters long.");
            return;
        }
        handleRegister(email, password);
    });
}

// Attach the logout event listener to every logout button on the site
logoutButtons.forEach(button => {
    button.addEventListener('click', handleLogout);
});


// --- SESSION MANAGEMENT ---

/**
 * A utility function to get the current logged-in user.
 * @returns {object|null} The user object or null if not logged in.
 */
export const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

/**
 * Protects a page by checking for a valid user session.
 * If no user is logged in, it redirects to the login page.
 * @returns {object|null} The user object if logged in, otherwise null.
 */
export const protectPage = async () => {
    const user = await getUser();
    if (!user) {
        // Define pages that don't require login
        const onAuthPage = window.location.pathname.endsWith('login.html') || 
                           window.location.pathname.endsWith('register.html') || 
                           window.location.pathname.endsWith('index.html') || 
                           window.location.pathname === '/';
        
        if (!onAuthPage) {
            window.location.href = 'login.html';
        }
    }
    return user;
};
