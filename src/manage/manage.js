import { downloadFile, readFile, processForExport, importBookmarks, deleteFolderRecursively, showStatus } from './utils.js';
import { supabase } from '../supabase-client.js';

// Check if the user session exists, otherwise show an alert and close the tab
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        alert('Please login/signup to access Advanced Management features!');
        const currentTab = await browser.tabs.getCurrent();
        browser.tabs.remove(currentTab.id);
        return;
    }
}

// UI rendering and event handlers
document.addEventListener('DOMContentLoaded', async () => {
    checkSession();

    const treeContainer = document.getElementById('bookmark-tree');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');

    // Load bookmarks and render the tree
    const bookmarks = await browser.bookmarks.getTree();
    renderTree(bookmarks);

    // Export functionality: Export bookmarks as JSON
    exportBtn.addEventListener('click', async () => {
        try {
            const bookmarks = await browser.bookmarks.getTree();
            const exportData = {
                version: 1,
                timestamp: Date.now(),
                bookmarks: processForExport(bookmarks)
            };
            const jsonString = JSON.stringify(exportData, null, 2);
            downloadFile(jsonString, 'bookmarks.json');
            showStatus(document, 'Export successful!', 'bg-green-800 text-green-200');
        } catch (error) {
            showStatus(document, 'Export failed!', 'bg-red-800 text-red-200');
            console.error('Export error:', error);
        }
    });

    // Import functionality: Import bookmarks from a JSON file
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const json = await readFile(file);
                const importData = JSON.parse(json);
                await importBookmarks(importData.bookmarks);
                showStatus(document, 'Import successful!', 'bg-green-800 text-green-200');
                setTimeout(async () => {
                    const newBookmarks = await browser.bookmarks.getTree();
                    treeContainer.innerHTML = '';
                    renderTree(newBookmarks);
                }, 500);
            } catch (error) {
                showStatus(document, 'Import failed!', 'bg-red-800 text-red-200');
                console.error('Import error:', error);
            }
        };
        input.click();
    });

    // Delete event handler: Handle delete action for bookmarks and folders
    treeContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            try {
                const [node] = await browser.bookmarks.get(id);
                if (node.url) {
                    if (confirm("Delete this bookmark?")) {
                        await browser.bookmarks.remove(id);
                        e.target.closest('.bookmark-item').remove();
                        showStatus(document, 'Bookmark deleted!', 'bg-green-800 text-green-200');
                    }
                } else {
                    if (confirm("Delete this folder and ALL its contents?")) {
                        const [fullFolder] = await browser.bookmarks.getSubTree(id);
                        await deleteFolderRecursively(fullFolder);
                        e.target.closest('.folder-card').remove();
                        showStatus(document, 'Folder deleted!', 'bg-green-800 text-green-200');
                    }
                }
            } catch (error) {
                showStatus(document, 'Deletion failed!', 'bg-red-800 text-red-200');
                console.error('Delete error:', error);
            }
        }
    });

    // Render bookmark tree recursively
    function renderTree(nodes, parent = treeContainer) {
        nodes.forEach(node => {
            const isFolder = !node.url;

            // Create card container
            const card = document.createElement('div');
            card.classList.add(
                isFolder ? 'folder-card' : 'bookmark-item',
                'bg-gray-800', 'p-2', 'rounded', 'mb-1'
            );
            if (isFolder) {
                card.classList.add('p-3', 'rounded-lg', 'mb-2', 'border', 'border-gray-700');
            }

            // Create content container
            const content = document.createElement('div');
            content.classList.add('flex', 'items-center', 'justify-between', 'gap-3');

            if (node.url) {
                // Bookmark item
                const link = document.createElement('a');
                link.href = node.url;
                link.target = '_blank';
                link.classList.add('text-blue-400', 'hover:text-blue-300', 'truncate', 'flex-1');
                link.textContent = node.title;

                const deleteBtn = createDeleteButton(node.id);
                content.appendChild(link);
                content.appendChild(deleteBtn);
            } else {
                // Folder item
                const folderContainer = document.createElement('div');
                folderContainer.classList.add('flex', 'items-center', 'gap-2', 'text-gray-200', 'flex-1');

                const folderIcon = document.createElement('span');
                folderIcon.classList.add('text-xl');
                folderIcon.textContent = '📁';

                const folderTitle = document.createElement('span');
                folderTitle.classList.add('font-medium');
                folderTitle.textContent = node.title;

                folderContainer.appendChild(folderIcon);
                folderContainer.appendChild(folderTitle);
                content.appendChild(folderContainer);

                if (node.id !== 'root________') {
                    content.appendChild(createDeleteButton(node.id));
                }
            }

            card.appendChild(content);

            // Recursively render children if present
            if (node.children?.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.classList.add('ml-4', 'mt-2', 'space-y-2');
                if (!isFolder) {
                    childrenContainer.classList.add('border-l-2', 'border-gray-700', 'pl-3');
                }
                renderTree(node.children, childrenContainer);
                card.appendChild(childrenContainer);
            }

            parent.appendChild(card);
        });
    }

    // Helper function to create delete buttons
    function createDeleteButton(id) {
        const button = document.createElement('button');
        button.dataset.id = id;
        button.classList.add('delete-btn', 'px-2.5', 'py-1.5', 'text-sm', 'text-red-400', 'hover:bg-gray-700/50', 'rounded-md');
        button.textContent = 'Delete';
        return button;
    }

});
