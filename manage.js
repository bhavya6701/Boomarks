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
            console.log(jsonString);
            downloadFile(jsonString, 'bookmarks.json');
            showStatus('Export successful!', 'bg-green-800 text-green-200');
        } catch (error) {
            showStatus('Export failed!', 'bg-red-800 text-red-200');
            console.error('Export error:', error);
        }
    });

    // File download helper
    function downloadFile(content, fileName) {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }

    // File reader helper
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

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
                showStatus('Import successful!', 'bg-green-800 text-green-200');
                setTimeout(async () => {
                    const newBookmarks = await browser.bookmarks.getTree();
                    treeContainer.innerHTML = '';
                    renderTree(newBookmarks);
                }, 500);
            } catch (error) {
                showStatus('Import failed!', 'bg-red-800 text-red-200');
                console.error('Import error:', error);
            }
        };
        input.click();
    });

    // Process bookmarks for export
    function processForExport(nodes) {
        return nodes.map(node => ({
            title: node.title,
            url: node.url,
            dateAdded: node.dateAdded,
            children: node.children ? processForExport(node.children) : []
        }));
    }

    // Import bookmarks from JSON structure
    async function importBookmarks(nodes, parentId = null) {
        for (const node of nodes) {
            if (node.url) {
                // Import bookmark
                await browser.bookmarks.create({
                    parentId: parentId,
                    title: node.title,
                    url: node.url
                });
            } else {
                // Create folder first
                const folder = await browser.bookmarks.create({
                    parentId: parentId,
                    title: node.title
                });

                // Recursively import children
                if (node.children && node.children.length > 0) {
                    await importBookmarks(node.children, folder.id);
                }
            }
        }
    }

    // Update the delete event handler
    treeContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            try {
                const [node] = await browser.bookmarks.get(id);

                if (node.url) {
                    // Bookmark deletion (existing correct code)
                    if (confirm("Delete this bookmark?")) {
                        await browser.bookmarks.remove(id);
                        e.target.closest('.bookmark-item').remove();
                        showStatus('Bookmark deleted!', 'bg-green-800 text-green-200');
                    }
                } else {
                    // Folder deletion - modified to handle non-empty folders
                    if (confirm("Delete this folder and ALL its contents?")) {
                        // Get full folder structure
                        const [fullFolder] = await browser.bookmarks.getSubTree(id);

                        // Recursive deletion from deepest level first
                        await deleteFolderRecursively(fullFolder);

                        // Remove from UI
                        e.target.closest('.folder-card').remove();
                        showStatus('Folder deleted!', 'bg-green-800 text-green-200');
                    }
                }
            } catch (error) {
                showStatus('Deletion failed!', 'bg-red-800 text-red-200');
                console.error('Delete error:', error);
            }
        }
    });

    // New recursive deletion function
    async function deleteFolderRecursively(folder) {
        // Process children first (depth-first deletion)
        console.log(folder)
        if ('children' in folder) {
            for (const child of folder['children']) {
                console.log(child)
                if ('children' in folder) {
                    console.log("working till here")
                    console.log(child)
                    await deleteFolderRecursively(child);
                    console.log("working till here 2")
                }
            }
        }

        // Delete the folder itself (only if not root)
        if (folder.id !== 'root________') {
            console.log("working till here 3")
            await browser.bookmarks.remove(folder.id);
        }
    }

    // Remove the old deleteChildren function

    // Update renderTree function to differentiate items
    function renderTree(nodes, parent = treeContainer, depth = 0) {
        nodes.forEach(node => {
            const isFolder = !node.url;
            const card = document.createElement('div');

            if (isFolder) {
                card.className = `folder-card bg-gray-800 p-3 rounded-lg mb-2 border border-gray-700`;
            } else {
                card.className = 'bookmark-item bg-gray-800 p-2 rounded mb-1'; // New class for bookmarks
            }

            const content = document.createElement('div');
            content.className = 'flex items-center justify-between gap-3';

            if (node.url) {
                // Bookmark item
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
                </button>
            `;
            } else {
                // Folder item
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
                    </button>
                ` : ''}
            `;
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

    function showStatus(message, style) {
        const status = document.createElement('div');
        status.className = `fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${style} font-medium`;
        status.textContent = message;
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 2000);
    }
});