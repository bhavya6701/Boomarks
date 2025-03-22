// File handling and core bookmark operations

// Downloads content as a file
function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

// Reads the content of a file
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Processes bookmark nodes for export
function processForExport(nodes) {
    return nodes.map(node => ({
        title: node.title,
        url: node.url,
        dateAdded: node.dateAdded,
        children: node.children ? processForExport(node.children) : []  // Recursively process children
    }));
}

// Imports bookmarks into the browser
async function importBookmarks(nodes, parentId = null) {
    for (const node of nodes) {
        if (node.url) {
            await browser.bookmarks.create({
                parentId: parentId,
                title: node.title,
                url: node.url
            });
        } else {
            const folder = await browser.bookmarks.create({
                parentId: parentId,
                title: node.title
            });
            if (node.children?.length > 0) {
                await importBookmarks(node.children, folder.id);  // Recursively import children
            }
        }
    }
}

// Recursively deletes a folder and its contents
async function deleteFolderRecursively(folder) {
    if (folder.children) {
        for (const child of folder.children) {
            await deleteFolderRecursively(child);  // Recursively delete children
        }
    }
    if (folder.id !== 'root________') {
        await browser.bookmarks.remove(folder.id);  // Avoid deleting the root folder
    }
}

// Displays a status message in the UI
function showStatus(document, message, style) {
    const status = document.createElement('div');
    status.className = `fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${style} font-medium`;
    status.textContent = message;
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 1500);  // Remove status after 1.5 seconds
}

export { downloadFile, readFile, processForExport, importBookmarks, deleteFolderRecursively, showStatus };
