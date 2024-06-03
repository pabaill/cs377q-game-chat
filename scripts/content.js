// content.js
var openaiAPIKey;

//length of chatlog array last time it was initialized
var numChatActionsSeen;

// length of gamelog array last time it was initialized
var numGameActionsSeen;

// list of players
var playerList;

// username of current player
var username;

// array with previous chatlog summaries
var previousChatSummaries = [];

// array with previous chatlog summaries
var previousGameSummaries = [];

chrome.storage.local.get('env', function(result) {
  const env = result.env;
  if (env && env.OPENAI_API_KEY) {
    openaiAPIKey = env.OPENAI_API_KEY;
    console.log('API Key loaded');
  } else {
    console.error('Environment variables not found.');
  }
});

// Function used to format response object and insert card images back in
function replaceString(str, replacements) {
  for (let key in replacements) {
    if (replacements.hasOwnProperty(key)) {
      let regex = new RegExp('\\b' + key + '\\b', 'g');
      str = str.replace(regex, replacements[key]);
    }
  }
  return str;
}

function getGameElements() {
  return {
    "wool": `<img src="/dist/images/card_wool.svg?rev=9bd29423eae83fe9e6e4" alt="wool" height="20" width="14.25" class="lobby-chat-text-icon">`,
    "lumber": `<img src="/dist/images/card_lumber.svg?rev=c3f06b26d0dc1df6e30b" alt="lumber" height="20" width="14.25" class="lobby-chat-text-icon">`,
    "brick": `<img src="/dist/images/card_brick.svg?rev=4beb37891c6c77ebb485" alt="brick" height="20" width="14.25" class="lobby-chat-text-icon">`,
    "grain": `<img src="/dist/images/card_grain.svg?rev=b72852bcde4c00a5f809" alt="grain" height="20" width="14.25" class="lobby-chat-text-icon">`,
    "ore": `<img src="/dist/images/card_ore.svg?rev=456f643916038b42d704" alt="ore" height="20" width="14.25" class="lobby-chat-text-icon">`,
    "dice_1": `<img src="/dist/images/dice_1.svg?rev=aa5fc851aa5ca7d25c4f" alt="dice_1" height="20" width="20" class="lobby-chat-text-icon">`,
    "dice_2": `<img src="/dist/images/dice_2.svg?rev=d117b27bc90eacc58018" alt="dice_2" height="20" width="20" class="lobby-chat-text-icon">`,
    "dice_3": `<img src="/dist/images/dice_3.svg?rev=04e6166b5809e9abef2b" alt="dice_3" height="20" width="20" class="lobby-chat-text-icon">`,
    "dice_4": `<img src="/dist/images/dice_4.svg?rev=24ffb2ae79c7905baed0" alt="dice_4" height="20" width="20" class="lobby-chat-text-icon">`,
    "dice_5": `<img src="/dist/images/dice_5.svg?rev=aaf9862737811c858ab8" alt="dice_5" height="20" width="20" class="lobby-chat-text-icon">`,
    "dice_6": `<img src="/dist/images/dice_6.svg?rev=3f90e79b3392499898e3" alt="dice_6" height="20" width="20" class="lobby-chat-text-icon">`
  };
}

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
          if (!playerList) {
            playerList = [prevMessage]
          } else if (!playerList.includes(prevMessage)) {
            playerList.push(prevMessage);
          }
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
          if (!playerList) {
            playerList = [prevMessage]
          } else if (!playerList.includes(prevMessage) && !prevMessage.includes(' ')) {
            playerList.push(prevMessage);
          }
        } else {
          messages.push(prevMessage + ' ' + node.textContent.trim());
        }
        i += 1;
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
  container.style.width = '400px';
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
  titleBar.innerHTML = '<span>Quick Chat</span>';

  // Create content div
  const content = document.createElement('div');
  content.classList.add('content');
  content.style.padding = '10px';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.justifyContent = 'space-between';

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

  // Audio button: ask questions about the chat history
  const recordButton = document.createElement('button');
  recordButton.id = 'recordButton';
  recordButton.textContent = '🎤 Ask a Question';
  // Hide until you select your username
  recordButton.style.display = 'none';
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;

  recordButton.addEventListener('click', async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[event.resultIndex][0].transcript;
          askQuestionToGPT(transcript, content, chatButton, gameButton);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        mediaRecorder.onstart = () => {
          recognition.start();
        };

        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          recognition.stop();
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          audioChunks = [];
          const audioUrl = URL.createObjectURL(audioBlob);
          // const audio = new Audio(audioUrl);
          // audio.play();
        };

        mediaRecorder.start();
        recordButton.textContent = '⏹️ Stop';
        isRecording = true;
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      mediaRecorder.stop();
      recordButton.textContent = '🎤 Ask a Question';
      isRecording = false;
    }
  });

  titleBar.appendChild(recordButton);
  
  // Collapse button functionality
  const collapseBtn = document.createElement('button');
  collapseBtn.textContent = 'Collapse';
  collapseBtn.classList.add('collapse-btn');
  collapseBtn.style.marginLeft = '10px';
  collapseBtn.style.cursor = 'pointer';

  collapseBtn.addEventListener('click', () => {
      if (content.style.display === 'none') {
          content.style.display = 'flex';
          collapseBtn.textContent = 'Collapse';
          container.style.resize = 'both';
          container.style.height = '200px';

          titleBar.style.overflow = 'auto';
          gameButton.style.display = 'block';
          chatButton.style.display = 'block';
      } else {
          content.style.display = 'none';
          collapseBtn.textContent = 'Expand';
          container.style.height = titleBar.style.height;
          container.style.resize = 'none';

          titleBar.style.overflow = 'hidden';
          gameButton.style.display = 'none';
          chatButton.style.display = 'none';
      }
  });

  // Close button functionality
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.id = 'closeBtn';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
      container.remove();
  });
  closeBtn.style.cursor = 'pointer';

  const controlsDiv = document.createElement('div');
  controlsDiv.style.display = 'flex';
  controlsDiv.style.flexDirection = 'row';
  controlsDiv.appendChild(collapseBtn);
  controlsDiv.appendChild(closeBtn);
  titleBar.appendChild(controlsDiv);

  // OUR MAIN FEATURE: a button that reads the chat then can process it
  const chatButton = document.createElement('button');
  chatButton.textContent = 'Catch Me Up: Chat';
  chatButton.classList.add('chat-btn');
  chatButton.style.position = 'absolute';
  chatButton.style.height = '30px';
  chatButton.style.top = '40px';
  chatButton.style.left = 0;
  chatButton.style.width = '50%';

  const gameButton = document.createElement('button');
  gameButton.textContent = 'Catch Me Up: Game';
  gameButton.classList.add('game-btn');
  gameButton.style.position = 'absolute';
  gameButton.style.height = '30px';
  gameButton.style.top = '40px';
  gameButton.style.left = '50%';
  gameButton.style.width = '50%';


  chatButton.addEventListener('click', (e) => {
    e.preventDefault();
    chatButton.style.backgroundColor = 'black';
    chatButton.style.color = 'white';
    gameButton.style.backgroundColor = 'rgb(255, 255, 255)';
    gameButton.style.color = 'black';
    gptUpdateChatWindow(extractChatMessages(), content, chatButton, gameButton);
  });

  gameButton.addEventListener('click', (e) => {
    e.preventDefault();
    gameButton.style.backgroundColor = 'black';
    gameButton.style.color = 'white';
    chatButton.style.backgroundColor = 'rgb(255, 255, 255)';
    chatButton.style.color = 'black';
    gptUpdateGameWindow(extractGameLog(), content, chatButton, gameButton);
  });
  content.style.paddingTop = '35px';

  // Set initial state to get username of player
  extractGameLog();
  const playerSelect = document.createElement('select');
  playerSelect.id = 'player-select';
  const playerSelectLabel = document.createElement('label');
  playerSelectLabel.textContent = 'Select your username';
  playerSelectLabel.htmlFor = 'player-select';
  playerList.forEach(function(option) {
    var opt = document.createElement('option');
    opt.value = option;
    opt.text = option;
    playerSelect.add(opt);
  });

  const playerSelectSubmit = document.createElement('button');
  playerSelectSubmit.textContent = 'Submit';
  playerSelectSubmit.addEventListener('click', (e) => {
    username = playerSelect.value;
    container.appendChild(chatButton);
    container.appendChild(gameButton);
    playerSelect.remove();
    playerSelectLabel.remove();
    playerSelectSubmit.remove();
    recordButton.style.display = 'block';
  });

  content.appendChild(playerSelectLabel);
  content.appendChild(playerSelect);
  content.appendChild(playerSelectSubmit);

  // Append container to body
  document.body.appendChild(container);
}

function getArrayDisplayInnerHTML(arr) {
  const reversedArray = arr.slice().reverse();
  let innerHTMLContent = '';
  for (let i = 0; i < reversedArray.length; i++) {
    let element = reversedArray[i];
    // Use a regular expression to find and add title attribute to each img tag so the alt text appears on hover
    element = element.replace(/<img([^>]*?)alt="([^"]*?)"([^>]*?)>/g, '<img$1alt="$2"$3 title="$2">');
    innerHTMLContent += element;
    if (i < reversedArray.length - 1) {
        innerHTMLContent += '<hr style="border: 1px solid black; width: 100%;">';
    }
  }
  return innerHTMLContent;
}

async function gptUpdateChatWindow(messages, content, chatButton, gameButton) {
  const gameResources = getGameElements();
  content.innerHTML = "loading...";
  const whatsGoingOnPrompt = `You are an assistant that helps the player ${username} catch up on the given chat messages.
  Give advice from the perspective of ${username}. Include all important details, but summarize the messages as concisely as possible, grouping major things that happened by username when appropriate. Your summary should be in HTML format and three sentences maximum. Each sentence should be listed on a new line.
  The list of players is: ${playerList.toString()}. Wrap the names of players in <b> tags.
  The username is the part before the colon, and each message is separated by a newline character.
  
  EXAMPLES:
  Input: "USER123: I want wheat\n USER123: I want wood\n USER123: Please give me some rock"
  Output: "<ul>
  
  <li><b>USER123</b> wanted wheat, wood, and rock.</li> 
  </ul>" 
  Input: "USER123: I want wheat\n USER124: I want wood\n USER123: I'll trade 1 wheat for 1 wood"
  Output: "<ul>
  
  <li><b>USER123</b> wanted wheat and offered a 1 for 1 trade to <b>USER124</b> for wood.</li> 
  <li><b>USER124</b> wanted wood.</li> 
  </ul>"
  Messages:`;
  const url = 'https://api.openai.com/v1/chat/completions';
  var messageSummary = messages.slice(numChatActionsSeen ? numChatActionsSeen : 0).join('\n');
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
      let res = data.choices[0].message.content;
      res = replaceString(res, gameResources);
      previousChatSummaries.push(res);
      content.innerHTML = getArrayDisplayInnerHTML(previousChatSummaries);
      previousChatSummaries.push(res);
      content.innerHTML = getArrayDisplayInnerHTML(previousChatSummaries);
      numChatActionsSeen = messages.length;
      content.appendChild(chatButton);
      content.appendChild(gameButton)
    })
    .catch(error => console.error('Error making OpenAI request:', error));
}

async function gptUpdateGameWindow(gamelog, content, chatButton, gameButton) {
  const gameResources = getGameElements();
  content.innerHTML = "loading...";
  const url = 'https://api.openai.com/v1/chat/completions';
  const whatsGoingOnPrompt = `You are an assistant that helps the player ${username} catch up on the given game log. Give advice from the perspective of ${username}. Include all important details, but summarize the messages as concisely as possible, grouping major things that happened by username when appropriate. Your summary should be in HTML format and three sentences maximum, followed by an additional sentence of game advice. Output your summary in unordered HTML list form, using <ul> and <li>. List each sentence on a new line. The list of players is: ${playerList.toString()}. Wrap the names of players in <b> tags.

  The game is Settlers of Catan. Here are some key details about the game to assist you in providing accurate advice:
  Resources: There are five types of resources: brick, lumber, wool, grain, and ore.
  Robber: The Robber can be moved to block resources on a hex and to steal a resource card from another player.
  Settlements and Cities: Settlements are worth 1 victory point, and cities are worth 2. Cities also produce more resources.
  Development Cards: Players can buy development cards which can grant various benefits, including knights (which move the Robber), victory points, road building, monopoly, and year of plenty.
  Trade: Players can trade resources with each other or with the bank at a 4:1 ratio, or at a 3:1 or 2:1 ratio if they have the appropriate harbor.
  Details should properly advise a player in understanding the current state of the game and who is making winning moves.  
  EXAMPLES:
  Input: "USER123 placed a settlement\n USER123 got lumber\n USER123 wants to give lumber for sheep"
  Output:
  <ul> 
    <li><b>USER123</b> placed a settlement.</li> 
    <li><b>USER123</b> got lumber.</li> 
    <li><b>USER123</b> wants to trade lumber for sheep.</li> 
  </ul> 
  <p>Consider trading sheep with <b>USER123</b>.</p>
  Input: "USER123 moved Robber to grain tile with 9"
  Output:
  <ul> 
    <li><b>USER123</b> moved the Robber to the grain tile with 9.</li> 
  </ul> 
  <p>You might need to find other sources of grain.</p>
  Messages:`;
  var messageSummary = gamelog.slice(numGameActionsSeen ? numGameActionsSeen : 0).join('\n');
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
      let res = data.choices[0].message.content;
      numGameActionsSeen = gamelog.length;
      res = replaceString(res, gameResources);
      previousGameSummaries.push(res);
      content.innerHTML = getArrayDisplayInnerHTML(previousGameSummaries);
      content.appendChild(chatButton);
      content.appendChild(gameButton);
    })
    .catch(error => console.error('Error making OpenAI request:', error));
}

async function askQuestionToGPT(transcript, content, chatButton, gameButton) {
  content.innerHTML = "loading...";
  const url = 'https://api.openai.com/v1/chat/completions';
  const answerAudioQuestionPrompt = `You are an assistant that helps the player ${username} play the game Catan. Answer their question and give advice from the perspective of ${username}. Include all important details in your answer, but summarize the messages as concisely as possible, grouping major things that happened by username when appropriate. Your answer should be one sentence maximum. 
  
  The list of players is: ${playerList.toString()}. Wrap the names of players in <b> tags.

  The game is Settlers of Catan. Here are some key details about the game to assist you in providing accurate advice:
  Resources: There are five types of resources: brick, lumber, wool, grain, and ore.
  Robber: The Robber can be moved to block resources on a hex and to steal a resource card from another player.
  Settlements and Cities: Settlements are worth 1 victory point, and cities are worth 2. Cities also produce more resources.
  Development Cards: Players can buy development cards which can grant various benefits, including knights (which move the Robber), victory points, road building, monopoly, and year of plenty.
  Trade: Players can trade resources with each other or with the bank at a 4:1 ratio, or at a 3:1 or 2:1 ratio if they have the appropriate harbor.
  Details should properly advise a player in understanding the current state of the game and who is making winning moves.

  Here is the list of all of the moves made in the game: ${extractGameLog()}

  Here is the list of all of the chat messages said in the game: ${extractChatMessages()}

  Repeat their question, then answer it.
  
  `;
  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {"role": "system", "content": answerAudioQuestionPrompt}, 
      {"role": "user", "content": transcript}
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
      let res = data.choices[0].message.content;
      res = replaceString(res, getGameElements());
      content.innerHTML = `You asked: ${transcript}\n${res}`;
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