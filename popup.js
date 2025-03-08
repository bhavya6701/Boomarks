document.addEventListener('DOMContentLoaded', async () => {
  const search = document.getElementById('search');
  const bookmarkList = document.getElementById('bookmark-list');
  const manageBtn = document.getElementById('manage-btn');

  // Fetch and display bookmarks
  const bookmarks = await browser.bookmarks.getTree();
  renderBookmarks(flattenBookmarks(bookmarks));

  // Search functionality
  search.addEventListener('input', () => {
      const query = search.value.toLowerCase();
      renderBookmarks(flattenBookmarks(bookmarks).filter(b =>
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

  function renderBookmarks(bookmarks) {
      bookmarkList.innerHTML = bookmarks.map(b => `
          <li 
              class="p-3 hover:bg-blue-50 cursor-pointer"
              onclick="window.open('${b.url}', '_blank')"
          >
              <div class="font-medium">${b.title}</div>
              <div class="text-sm text-gray-500 truncate">${b.url}</div>
          </li>
      `).join('');
  }
});