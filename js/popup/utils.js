function flattenBookmarks(nodes, result = []) {
    nodes.forEach(node => {
        if (node.url) {
            result.push({
                title: node.title || node.url,
                url: node.url
            });
        }
        if (node.children) flattenBookmarks(node.children, result);
    });
    return result;
}

function renderBookmarks(bookmarkList, bookmarks) {
    // Clear the existing list
    bookmarkList.innerHTML = '';

    // Loop through bookmarks and create elements safely
    bookmarks.forEach(b => {
        const li = document.createElement("li");
        li.classList.add("p-3", "hover:bg-blue-50", "cursor-pointer");

        // Event listener instead of inline onclick
        li.addEventListener("click", () => {
            window.open(b.url, "_blank");
        });

        // Title
        const titleDiv = document.createElement("div");
        titleDiv.classList.add("font-medium");
        titleDiv.textContent = b.title;

        // URL
        const urlDiv = document.createElement("div");
        urlDiv.classList.add("text-sm", "text-gray-500", "truncate");
        urlDiv.textContent = b.url;

        // Append elements
        li.appendChild(titleDiv);
        li.appendChild(urlDiv);
        bookmarkList.appendChild(li);
    });

    return bookmarkList;
}


export { flattenBookmarks, renderBookmarks };