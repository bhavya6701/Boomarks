import { renderBookmarks, flattenBookmarks } from './utils.js';
import { supabase } from '../supabase-client.js';

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    console.log(session);
    if (!session) window.location.assign('../../auth.html');
}

document.addEventListener('DOMContentLoaded', async () => {
    checkSession();

    const search = document.getElementById('search');
    const bookmarkList = document.getElementById('bookmark-list');
    const manageBtn = document.getElementById('manage-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Fetch and display bookmarks
    const bookmarks = await browser.bookmarks.getTree();
    renderBookmarks(bookmarkList, flattenBookmarks(bookmarks));

    // Search functionality
    search.addEventListener('input', () => {
        const query = search.value.toLowerCase();
        renderBookmarks(bookmarkList, flattenBookmarks(bookmarks).filter(b =>
            b.title.toLowerCase().includes(query) ||
            b.url.toLowerCase().includes(query)
        ));
    });

    // Manage button click
    manageBtn.addEventListener('click', () => {
        browser.tabs.create({
            url: browser.runtime.getURL('manage.html')
        });
    });

    // Logout button click
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'auth.html';
    });
});