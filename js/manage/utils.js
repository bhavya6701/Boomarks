// File handling and core bookmark operations
function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function processForExport(nodes) {
    return nodes.map(node => ({
        title: node.title,
        url: node.url,
        dateAdded: node.dateAdded,
        children: node.children ? processForExport(node.children) : []
    }));
}

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
                await importBookmarks(node.children, folder.id);
            }
        }
    }
}

async function deleteFolderRecursively(folder) {
    if (folder.children) {
        for (const child of folder.children) {
            await deleteFolderRecursively(child);
        }
    }
    if (folder.id !== 'root________') {
        await browser.bookmarks.remove(folder.id);
    }
}

function showStatus(document, message, style) {
    const status = document.createElement('div');
    status.className = `fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${style} font-medium`;
    status.textContent = message;
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 1500);
}


export { downloadFile, readFile, processForExport, importBookmarks, deleteFolderRecursively, showStatus };