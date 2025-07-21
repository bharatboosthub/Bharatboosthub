// FILE: js/supabase.js
// This file initializes the Supabase client, which is the bridge between your
// frontend and the Supabase backend (database, authentication, storage).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- SUPABASE CREDENTIALS ---
// These credentials connect the app to your specific Supabase project.

const supabaseUrl = 'https://cwsaghxbdsincdnaecme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2FnaHhiZHNpbmNkbmFlY21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTk0NDYsImV4cCI6MjA2ODYzNTQ0Nn0.cFwm7rAka0Yp9bsMxj18folaSL1QrlxFzya_H_LV7HI';

// --- ERROR HANDLING & CLIENT INITIALIZATION ---

// Check if the credentials have been replaced. If not, log a warning to the console.
// This helps tremendously during development to catch configuration errors early.
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn(
        "********************************************************************************\n" +
        "** WARNING: Supabase credentials are not configured in `js/supabase.js`       **\n" +
        "** The application will not work until you replace the placeholder values.    **\n" +
        "********************************************************************************"
    );
}

/**
 * The Supabase client instance.
 * This object is exported so it can be imported and used by all other
 * JavaScript files in the project to interact with the Supabase backend.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
