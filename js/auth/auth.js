import { supabase } from '../supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');
    const statusMessage = document.getElementById('status-message');

    async function handleAuth(action) {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showStatus('Please fill all fields');
            return;
        }

        try {
            const { error } = action === 'signup' ?
                await supabase.auth.signUp({ email, password }) :
                await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;

            // Redirect to popup after successful auth
            window.location.assign('../../popup.html');
        } catch (error) {
            showStatus(error.message);
        }
    }

    signinBtn.addEventListener('click', () => handleAuth('signin'));
    signupBtn.addEventListener('click', () => handleAuth('signup'));

    function showStatus(message) {
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden');
        setTimeout(() => statusMessage.classList.add('hidden'), 3000);
    }
});