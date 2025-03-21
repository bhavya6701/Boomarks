import { downloadFile, readFile, processForExport, importBookmarks, deleteFolderRecursively, showStatus } from './utils.js';

// UI rendering and event handlers
document.addEventListener('DOMContentLoaded', async () => {
    const treeContainer = document.getElementById('bookmark-tree');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');

    // Load bookmarks
    const bookmarks = await browser.bookmarks.getTree();
    renderTree(bookmarks);

    // Export functionality
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

    // Import functionality
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

    // Delete event handler
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

    function renderTree(nodes, parent = treeContainer, depth = 0) {
        nodes.forEach(node => {
            const isFolder = !node.url;
            const card = document.createElement('div');
            card.className = isFolder ?
                'folder-card bg-gray-800 p-3 rounded-lg mb-2 border border-gray-700' :
                'bookmark-item bg-gray-800 p-2 rounded mb-1';

            const content = document.createElement('div');
            content.className = 'flex items-center justify-between gap-3';

            if (node.url) {
                content.innerHTML = `
                    <a href="${node.url}" target="_blank"
                        class="text-blue-400 hover:text-blue-300 truncate flex-1">
                        ${node.title}
                    </a>
                    <button 
                        data-id="${node.id}"
                        class="delete-btn px-2.5 py-1.5 text-sm text-red-400 hover:bg-gray-700/50 rounded-md"
                    >
                        Delete
                    </button>`;
            } else {
                content.innerHTML = `
                    <div class="flex items-center gap-2 text-gray-200 flex-1">
                        <span class="text-xl">📁</span>
                        <span class="font-medium">${node.title}</span>
                    </div>
                    ${node.id !== 'root________' ? `
                        <button 
                            data-id="${node.id}"
                            class="delete-btn px-2.5 py-1.5 text-sm text-red-400 hover:bg-gray-700/50 rounded-md"
                        >
                            Delete
                        </button>` : ''}`;
            }

            card.appendChild(content);
            if (node.children?.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = `ml-4 mt-2 space-y-2 ${!isFolder ? 'border-l-2 border-gray-700 pl-3' : ''}`;
                renderTree(node.children, childrenContainer, depth + 1);
                card.appendChild(childrenContainer);
            }
            parent.appendChild(card);
        });
    }
});