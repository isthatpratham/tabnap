document.addEventListener('DOMContentLoaded', () => {
    const tabList = document.getElementById('tab-list');
    const sleepAllBtn = document.getElementById('sleep-all-btn');
    const activeCountEl = document.getElementById('active-count');
    const sleepingCountEl = document.getElementById('sleeping-count');

    function loadTabs() {
        tabList.innerHTML = ''; // Clear the list for refresh

        // Query all tabs in all windows
        chrome.tabs.query({}, (tabs) => {
            let activeCount = 0;
            let sleepingCount = 0;
            let activeTabsHtmlCount = 0;

            const extensionSleepUrl = chrome.runtime.getURL('sleep.html');

            tabs.forEach(tab => {
                const isSleepPage = tab.url && tab.url.startsWith(extensionSleepUrl);
                const isChromePage = tab.url && tab.url.startsWith('chrome://');

                // Update counts
                if (isSleepPage) {
                    sleepingCount++;
                } else {
                    // Both normal pages and chrome:// pages count as active (not sleeping)
                    activeCount++;
                }

                // Only render non-sleeping tabs in the active list
                if (!isSleepPage) {
                    activeTabsHtmlCount++;

                    // Create list item container
                    const li = document.createElement('li');
                    li.className = 'tab-item';

                    // Create favicon
                    const icon = document.createElement('img');
                    icon.className = 'tab-icon';
                    icon.src = tab.favIconUrl || 'icons/icon16.png'; // Fallback
                    icon.onerror = () => {
                        icon.src = 'icons/icon16.png';
                    };

                    // Create container for text details
                    const detailsDiv = document.createElement('div');
                    detailsDiv.className = 'tab-details';

                    // Tab Title
                    const title = document.createElement('div');
                    title.className = 'tab-title';
                    title.textContent = tab.title || 'Untitled Tab';

                    // Domain Name
                    const domain = document.createElement('div');
                    domain.className = 'tab-domain';
                    try {
                        if (tab.url && !isChromePage) {
                            const url = new URL(tab.url);
                            domain.textContent = url.hostname;
                        } else {
                            domain.textContent = tab.url ? tab.url.split('/')[2] || 'System Page' : 'unknown domain';
                        }
                    } catch (e) {
                        domain.textContent = tab.url || '';
                    }

                    detailsDiv.appendChild(title);
                    detailsDiv.appendChild(domain);

                    li.appendChild(icon);
                    li.appendChild(detailsDiv);

                    // Add Sleep Button
                    // Don't show sleep button on generic Chrome pages or active tab
                    if (!isChromePage && !tab.active) {
                        const sleepBtn = document.createElement('button');
                        sleepBtn.className = 'sleep-btn';
                        sleepBtn.textContent = 'Sleep';

                        sleepBtn.onclick = (e) => {
                            e.stopPropagation(); // Prevent any parent clicks

                            // 1. Capture original URL
                            const originalUrl = tab.url;

                            // 2. Replace tab content with sleep.html containing the original URL in query params
                            const sleepPageUrl = chrome.runtime.getURL(`sleep.html?url=${encodeURIComponent(originalUrl)}`);

                            chrome.tabs.update(tab.id, { url: sleepPageUrl }, () => {
                                // Refresh the tab list
                                loadTabs();
                            });
                        };

                        li.appendChild(sleepBtn);
                    }

                    tabList.appendChild(li);
                }
            });

            // Update statistics UI
            activeCountEl.textContent = activeCount;
            sleepingCountEl.textContent = sleepingCount;

            if (activeTabsHtmlCount === 0) {
                tabList.innerHTML = '<li class="empty-state">No active tabs found.</li>';
            }
        });
    }

    // Handle "Sleep All Other Tabs"
    if (sleepAllBtn) {
        sleepAllBtn.addEventListener('click', () => {
            chrome.tabs.query({}, (tabs) => {
                const extensionUrl = chrome.runtime.getURL('');

                tabs.forEach(tab => {
                    const isSleepPage = tab.url && tab.url.startsWith(extensionUrl);
                    const isChromePage = tab.url && tab.url.startsWith('chrome://');

                    // Exclude active tab, already sleeping tabs, and chrome:// tabs
                    if (!tab.active && !isSleepPage && !isChromePage) {
                        const originalUrl = tab.url;
                        const sleepPageUrl = chrome.runtime.getURL(`sleep.html?url=${encodeURIComponent(originalUrl)}`);
                        chrome.tabs.update(tab.id, { url: sleepPageUrl });
                    }
                });

                // Wait a tiny bit for updates to register, then reload the list
                setTimeout(() => {
                    loadTabs();
                }, 300);
            });
        });
    }

    // Initial load
    loadTabs();
});
