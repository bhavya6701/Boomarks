import { renderBookmarks, flattenBookmarks } from './utils.js';
import { supabase } from '../supabase-client.js';

// Check if the user session exists, otherwise redirect to the authentication page
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) window.location.assign('../auth/auth.html');
}

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    checkSession();

    // DOM elements
    const search = document.getElementById('search');
    const bookmarkList = document.getElementById('bookmark-list');
    const manageBtn = document.getElementById('manage-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Fetch and display bookmarks
    const bookmarks = await browser.bookmarks.getTree();
    renderBookmarks(bookmarkList, flattenBookmarks(bookmarks));

    // Search functionality: Filter bookmarks based on title or URL
    search.addEventListener('input', () => {
        const query = search.value.toLowerCase();
        renderBookmarks(bookmarkList, flattenBookmarks(bookmarks).filter(b =>
            b.title.toLowerCase().includes(query) ||
            b.url.toLowerCase().includes(query)
        ));
    });

    // Manage button click: Open manage page in a new tab
    manageBtn.addEventListener('click', () => {
        browser.tabs.create({
            url: browser.runtime.getURL('src/manage/manage.html')
        });
    });

    // Logout button click: Sign out and redirect to the auth page
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.assign('../auth/auth.html');
    });
});
