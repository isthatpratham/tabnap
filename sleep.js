document.addEventListener('DOMContentLoaded', () => {
    const wakeBtn = document.getElementById('wake-btn');

    // Get original URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const originalUrl = urlParams.get('url');

    if (originalUrl) {
        wakeBtn.addEventListener('click', () => {
            // Get the current tab and update its URL to the original URL
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.update(tabs[0].id, { url: originalUrl });
                }
            });
        });
    } else {
        // If there's no original URL, disable the button or handle error
        wakeBtn.textContent = 'Error: No URL found';
        wakeBtn.disabled = true;
        wakeBtn.style.backgroundColor = '#4b5563'; // Gray out
        wakeBtn.style.cursor = 'not-allowed';
    }
});
