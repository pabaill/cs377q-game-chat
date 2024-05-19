// content.js

function extractChatMessages() {
  const chatElements = document.querySelectorAll('#game-chat-text .message-post span'); // Update the selector based on the chat structure
  const messages = [];
  
  chatElements.forEach(element => {
      const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      textNodes.forEach(node => {
        if (node.textContent.includes(':')) {
          messages.push(node.textContent.trim().substring(2));
        }
      });
  });

  console.log('Extracted messages:', messages);

  return messages;
}

// Function to create and append the draggable box
function createDraggableBox(messages, tabId) {
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
  content.innerHTML = extractChatMessages().join('<br>');

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
  loadMoreBtn.textContent = 'What\'s Going On?';
  loadMoreBtn.classList.add('load-more-btn');

  // Add event listener to the load more button
  loadMoreBtn.addEventListener('click', (e) => {
      // Here you can implement the logic to load more chat messages
      e.preventDefault();
      content.innerHTML = extractChatMessages().join('<br>');
  });
  // Append the load more button to the modal content
  content.appendChild(loadMoreBtn);

  // Append container to body
  document.body.appendChild(container);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'updateBox') {
      // Check if the draggable box already exists
      const box = document.getElementById('dragBoxContainer');
      if (box) {
          const content = box.querySelector('.content');
          content.innerHTML = data.messages.join('<br>');
      } else {
          // If the box doesn't exist, create it
          createDraggableBox();
      }
  }
});
