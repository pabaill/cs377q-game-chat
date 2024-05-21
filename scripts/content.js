// content.js
let openaiAPIKey;

chrome.storage.local.get('env', function(result) {
  const env = result.env;
  if (env && env.OPENAI_API_KEY) {
    openaiAPIKey = env.OPENAI_API_KEY;
    console.log('API Key loaded');
  } else {
    console.error('Environment variables not found.');
  }
});
/*
* Extract chat messages in list format
*/
function extractChatMessages() {
  const chatElements = document.querySelectorAll('#game-chat-text .message-post span');
  const messages = [];
  let prevMessage = '';
  
  chatElements.forEach(element => {
      const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      textNodes.forEach(node => {
        // If it's a chat message it'll begin with ": BLAH BLAH BLAH", and the next node will be the username; combine these and add them to messages
        if (node.textContent.includes(':')) {
          prevMessage = node.textContent.trim();
        } else {
          messages.push(node.textContent.trim() + prevMessage);
        }
      });
  });

  return messages;
}

// Function to create and append the draggable box
function createDraggableBox() {
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
  titleBar.innerHTML = '<span>Quick Chat</span><span class="close-btn" id="closeBtn">&times;</span>';

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

  // OUR MAIN FEATURE: a button that reads the chat then can process it
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.textContent = 'What\'s Going On?';
  loadMoreBtn.classList.add('load-more-btn');
  loadMoreBtn.style.position = 'absolute';
  loadMoreBtn.style.bottom = 0;
  loadMoreBtn.style.left = 0;
  loadMoreBtn.style.width = '100%';


  loadMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // content.innerHTML = extractChatMessages().join('<br>');
      // content.appendChild(loadMoreBtn);
      const messages = extractChatMessages();
      const whatsGoingOnPrompt = `You are an assistant that helps a user catch up on the given chat messages. 
        Include all important details, but summarize the messages as concisely as possible, grouping major things that happened by username when appropriate. 
        The username is the part before the colon, and each message is separated by a newline character. 

        EXAMPLES:
        Input: "USER123: I want wheat\n USER123: I want wood\n USER123: Please give me some rock"
        Output: "USER123 wanted wheat, wood, and rock."
        
        Input: "USER123: I want wheat\n USER124: I want wood\n USER123: I'll trade 1 wheat for 1 wood"
        Output: "USER123 wanted wheat and offered a 1 for 1 trade to USER124, who wanted wood."

        Messages: ` + messages.join('\n');
      gptUpdateChatWindow(content, loadMoreBtn, whatsGoingOnPrompt);
      /* Likely, here's where our ChatGPT implementation will go! */
      // const openai = require('openai');
      // openai.chat.completions.create({
      //   messages: [{ role: "system", content: "You are a helpful assistant." }],
      //   model: "gpt-3.5-turbo",
      // }).then((completion) => {
      //   content.innerHTML = completion.choices[0].message.content;
      //   content.appendChild(loadMoreBtn);
      // });
  });
  // Append the load more button to the modal content
  content.appendChild(loadMoreBtn);

  // TODO: use/test this prompt in added button for gameplay updates
  // const whatsGoingOnPrompt = `You are an assistant that helps a user catch up on the given game update messages. 
  //   Include all important details, but summarize the messages as concisely as possible, grouping major things that happened by username when appropriate. 
  //   The username is first word of each line, and each message is separated by a newline character. 

  //   EXAMPLES:
  //   Input: "USER123 placed a settlement\n USER123 placed a road\n USER123 placed a settlement"
  //   Output: "USER123 placed two settlements and a road."
    
  //   Input: "USER123 placed a settlement\n USER123 placed a road\n USER124 placed a settlement"
  //   Output: "USER123 placed a settlement and a road;\n USER124 placed a settlement."

  //   Messages: ` + messages.join('\n');

  // Append container to body
  document.body.appendChild(container);
}

async function gptUpdateChatWindow(content, loadMoreBtn, prompt) {
  content.innerHTML = "loading...";
  const url = 'https://api.openai.com/v1/chat/completions';
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        "role": "system", 
        "content": prompt
      },
    ],
    temperature: 1
  }

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiAPIKey}`,
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(data => {
      console.log('OpenAI Response:', data);
      const res = data.choices[0].message.content;
      content.innerHTML = res;
      content.appendChild(loadMoreBtn);
    })
    .catch(error => console.error('Error making OpenAI request:', error));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'updateBox') {
      // Check if the draggable box already exists
      const box = document.getElementById('dragBoxContainer');
      if (!box) {
        createDraggableBox();
      }
  }
});
