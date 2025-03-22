import { supabase } from '../supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');
    const statusMessage = document.getElementById('status-message');

    // Handles authentication (signup/signin)
    async function handleAuth(action) {
        const email = emailInput.value;
        const password = passwordInput.value;

        // Check for empty fields
        if (!email || !password) {
            showStatus('Please fill all fields');
            return;
        }

        try {
            // Call the appropriate action (signup or signin)
            const { error } = action === 'signup'
                ? await supabase.auth.signUp({ email, password })
                : await supabase.auth.signInWithPassword({ email, password });

            // Handle errors
            if (error) throw error;

            // Redirect to the popup page after successful auth
            window.location.assign('../popup/popup.html');
        } catch (error) {
            showStatus(error.message);  // Show error message
        }
    }

    // Event listeners for sign-in and sign-up buttons
    signinBtn.addEventListener('click', () => handleAuth('signin'));
    signupBtn.addEventListener('click', () => handleAuth('signup'));

    // Displays status messages
    function showStatus(message) {
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden');
        setTimeout(() => statusMessage.classList.add('hidden'), 3000);  // Hide after 3 seconds
    }
});
