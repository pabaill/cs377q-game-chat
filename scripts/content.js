// content.js
var openaiAPIKey;

chrome.storage.local.get('env', function(result) {
  const env = result.env;
  if (env && env.OPENAI_API_KEY) {
    openaiAPIKey = env.OPENAI_API_KEY;
    console.log('API Key loaded');
  } else {
    console.error('Environment variables not found.');
  }
});

/* Helper function to replace image elements with their alt text */
function replaceImgWithAltText(div) {
  // Find all image elements within the div
  var imgs = div.querySelectorAll('img');
  var firstTextNode = div.firstChild;
  while (firstTextNode && firstTextNode.nodeType !== Node.TEXT_NODE) {
    firstTextNode = firstTextNode.nextSibling;
  }

  // Loop through all the image elements
  imgs.forEach(function(img) {
    // Get the alt text of the image
    var altText = img.alt;

    if (firstTextNode) {
      firstTextNode.textContent += altText;
    } else {
      // If no existing text node found, create one
      firstTextNode = document.createTextNode(altText);
      div.appendChild(firstTextNode);
    }

    // Replace the image element with the text node
    img.remove();

    // Find next text node
    if (firstTextNode) {
      var nextTextNode = firstTextNode.nextSibling;
      while (nextTextNode && nextTextNode.nodeType !== Node.TEXT_NODE) {
        nextTextNode = nextTextNode.nextSibling;
      }
      if (nextTextNode) {
        firstTextNode.textContent += nextTextNode.textContent;
        nextTextNode.remove();
      }
    }
  });
}


/*
* Extract chat messages in list format
*/
function extractChatMessages() {
  const chatElements = document.querySelectorAll('#game-chat-text .message-post span');
  const messages = [];
  let prevMessage = '';
  
  chatElements.forEach((element) => {
      replaceImgWithAltText(element);
      const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      textNodes.forEach(node => {
        if (node.textContent.includes(':')) {
          prevMessage = node.textContent.trim();
        } else {
          messages.push(node.textContent.trim() + prevMessage);
        }
      });
  });

  return messages;
}

function extractGameLog() {
  // Leave out intro stuff
  const gameElements = [...document.querySelectorAll('#game-log-text .message-post span')].slice(3);
  const messages = [];
  let prevMessage = '';
  var i = 0;
  
  gameElements.forEach((element) => {
      replaceImgWithAltText(element);
      const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      textNodes.forEach((node) => {
        // If it's a game log message it'll first be the username and then their action
        if (i % 2 === 0) {
          prevMessage = node.textContent.trim();
        } else {
          messages.push(prevMessage + ' ' + node.textContent.trim());
        }
        i += 1;
      });
  });
  console.log(messages)
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
  // content.innerHTML = extractGameLog().join('<br>');
  // content.innerHTML = extractChatMessages().join('<br>');
  // console.log(extractChatMessages())

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
  const chatButton = document.createElement('button');
  chatButton.textContent = 'Catch Me Up: Chat';
  chatButton.classList.add('chat-btn');
  chatButton.style.position = 'absolute';
  chatButton.style.height = '30px';
  chatButton.style.bottom = '30px';
  chatButton.style.left = 0;
  chatButton.style.width = '100%';

  const gameButton = document.createElement('button');
  gameButton.textContent = 'Catch Me Up: Game';
  gameButton.classList.add('game-btn');
  gameButton.style.position = 'absolute';
  gameButton.style.height = '30px';
  gameButton.style.bottom = 0;
  gameButton.style.left = 0;
  gameButton.style.width = '100%';


  chatButton.addEventListener('click', (e) => {
      e.preventDefault();
      gptUpdateChatWindow(extractChatMessages(), content, chatButton, gameButton);
  });

  gameButton.addEventListener('click', (e) => {
    e.preventDefault();
    gptUpdateGameWindow(extractGameLog(), content, chatButton, gameButton);
  });
  // Append the load more button to the modal content
  content.appendChild(chatButton);
  content.appendChild(gameButton);

  // Append container to body
  document.body.appendChild(container);
}

async function gptUpdateChatWindow(messages, content, chatButton, gameButton) {
  const whatsGoingOnPrompt = `You are an assistant that helps a user catch up on the given chat messages. 
        Include all important details, but summarize the messages as concisely as possible, grouping major things that happened by username when appropriate. 
        Your summary should be three sentences maximum. 
        The username is the part before the colon, and each message is separated by a newline character. 

        EXAMPLES:
        Input: "USER123: I want wheat\n USER123: I want wood\n USER123: Please give me some rock"
        Output: "USER123 wanted wheat, wood, and rock."
        
        Input: "USER123: I want wheat\n USER124: I want wood\n USER123: I'll trade 1 wheat for 1 wood"
        Output: "USER123 wanted wheat and offered a 1 for 1 trade to USER124, who wanted wood."

        Messages: `;
  const url = 'https://api.openai.com/v1/chat/completions';
  var messageSummary = messages.join('\n');
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {"role": "system", "content": whatsGoingOnPrompt}, 
      {"role": "user", "content": messageSummary}
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
      content.appendChild(chatButton);
      content.appendChild(gameButton)
    })
    .catch(error => console.error('Error making OpenAI request:', error));
}

async function gptUpdateGameWindow(gamelog, content, chatButton, gameButton) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const whatsGoingOnPrompt = `You are an assistant that helps a user catch up on the given game log. 
        Include all important details, but summarize the messages as concisely as possible, grouping major things that happened by username when appropriate.
        Your summary should be three sentences maximum. 
        The game is Settlers of Catan. Details should properly advise a player in understanding the current state of the game and who is making winning moves.

        Messages: `;
  var messageSummary = gamelog.join('\n');
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {"role": "system", "content": whatsGoingOnPrompt}, 
      {"role": "user", "content": messageSummary}
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
      content.appendChild(chatButton);
      content.appendChild(gameButton);
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
