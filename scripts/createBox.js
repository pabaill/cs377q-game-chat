// scripts/content.js

// Function to create and append the draggable box
function createDraggableBox(messages) {
    // Create container div
    const container = document.createElement('div');
    container.id = 'dragBoxContainer';
    container.classList.add('draggable-box');
    container.style.position = 'fixed';
    container.style.top = '50px';
    container.style.left = '50px';
    container.style.width = '300px';
    container.style.height = '200px';
    container.style.backgroundColor = '#ffffff';
    container.style.border = '1px solid #cccccc';
    container.style.borderRadius = '5px';
    container.style.zIndex = '9999';
    container.style.overflow = 'auto';
    container.style.cursor = 'move';
    container.style.resize = 'both';
    container.style.color = 'black';

    // Create title bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('title-bar');
    titleBar.style.backgroundColor = '#f0f0f0';
    titleBar.style.padding = '5px';
    titleBar.style.cursor = 'move';
    titleBar.style.userSelect = 'none';
    titleBar.style.borderBottom = '1px solid #cccccc';
    titleBar.style.borderRadius = '5px 5px 0 0';
    titleBar.style.display = 'flex';
    titleBar.style.justifyContent = 'space-between';
    titleBar.innerHTML = '<span>Chat Summarizer</span><span class="close-btn" id="closeBtn">&times;</span>';

    // Create content div
    const content = document.createElement('div');
    content.classList.add('content');
    content.style.padding = '10px';
    content.innerHTML = messages.join('<br>');

    // Append title bar and content to container
    container.appendChild(titleBar);
    container.appendChild(content);

    // Add event listeners for dragging
    let offsetX, offsetY;
    let isDragging = false;

    titleBar.addEventListener('mousedown', (event) => {
        offsetX = event.clientX - container.getBoundingClientRect().left;
        offsetY = event.clientY - container.getBoundingClientRect().top;
        isDragging = true;
    });

    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            container.style.left = (event.clientX - offsetX) + 'px';
            container.style.top = (event.clientY - offsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Close button functionality
    const closeBtn = titleBar.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        container.remove();
    });
    closeBtn.style.cursor = 'pointer';

    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.classList.add('load-more-btn');

    // Add event listener to the load more button
    loadMoreBtn.addEventListener('click', () => {
        // Here you can implement the logic to load more chat messages
        
    });

    // Append the load more button to the modal content
    content.appendChild(loadMoreBtn);

    // Append container to body
    document.body.appendChild(container);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === 'updateBox') {
        chrome.storage.local.get('messages', (data) => {
            console.log("got messages ", data);
            if (chrome.runtime.lastError) {
                console.error('Error getting chat messages:', chrome.runtime.lastError);
            } else {
                if (data.messages && data.messages.length > 0) {
                    const box = document.getElementById('dragBoxContainer');
                    if (box) {
                        const content = box.querySelector('.content');
                        content.innerHTML = data.messages.join('<br>');
                    } else {
                        createDraggableBox(data.messages)
                    }
                } else {
                    console.log('No messages found.');
                }
            }
        });
        
    }
});