const button = document.createElement("button");
button.id = "speechToTextButton";
button.textContent = "🎙️";
button.style.position = "fixed";
button.style.bottom = "20px";
button.style.right = "20px";
button.style.zIndex = "10000";
button.style.background = "#000";
button.style.color = "#fff";
button.style.border = "none";
button.style.borderRadius = "50%";
button.style.width = "50px";
button.style.height = "50px";
button.style.fontSize = "24px";
button.style.cursor = "pointer";
button.style.display = "none";
button.type = "submit";
document.body.appendChild(button);

const webArchiveUrlDiv = document.createElement("a");
webArchiveUrlDiv.id = "webArchiveUrlDiv";
webArchiveUrlDiv.style.position = "fixed";
webArchiveUrlDiv.style.bottom = "40px";
webArchiveUrlDiv.style.right = "40px";
webArchiveUrlDiv.style.zIndex = "50000";
webArchiveUrlDiv.style.background = "#000";
webArchiveUrlDiv.style.color = "#fff";
webArchiveUrlDiv.style.border = "none";
webArchiveUrlDiv.style.borderRadius = "5px";
webArchiveUrlDiv.style.padding = "10px";
webArchiveUrlDiv.style.fontSize = "16px";
webArchiveUrlDiv.style.cursor = "pointer";
webArchiveUrlDiv.style.display = "none";

document.body.appendChild(webArchiveUrlDiv);

const saveWebPageContent = document.createElement("button");
saveWebPageContent.id = "sendToBackend";
saveWebPageContent.innerHTML = "SAVE PAGE";
// saveWebPageContent.style.position = "fixed";
// saveWebPageContent.style.bottom = "80px";
// saveWebPageContent.style.right = "80px";
// saveWebPageContent.style.zIndex = "100000";
saveWebPageContent.style.width = "300px";
saveWebPageContent.style.height = "50px";
saveWebPageContent.style.background = "#000";
saveWebPageContent.style.color = "#fff";
saveWebPageContent.style.border = "none"; 
saveWebPageContent.style.borderRadius = "5px";
saveWebPageContent.style.padding = "20px";  
saveWebPageContent.style.fontSize = "16px";
saveWebPageContent.style.cursor = "pointer";
saveWebPageContent.style.display = "none";
saveWebPageContent.type = "submit";
document.body.appendChild(saveWebPageContent);

let savedPageContent = "";
let activeElement;

button.addEventListener("mousedown", (event) => {
  activeElement = document.activeElement;
});
button.addEventListener("click", (e) => {
  if (activeElement) activeElement.focus();
  toggleRecognition();
});
function speakText(text) {
  chrome.runtime.sendMessage({ command: "textToSpeech", message: text });
}
function textToSpeech(text) {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  console.log("utterance");
  synth.speak(utterance);
}

function insertTextAtCursor(text) {
  const el = document.activeElement;
  const tagName = el.tagName.toLowerCase();

  if (tagName === "input" || tagName === "textarea") {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;

    el.value = value.slice(0, start) + text + value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
  } else if (
    tagName === "div" &&
    el.getAttribute("contenteditable") === "true"
  ) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });
  el.dispatchEvent(inputEvent);
  const changeEvent = new Event("change", {
    bubbles: true,
    cancelable: true,
  });

  el.dispatchEvent(changeEvent);
}

// Function to scrape the current page content and send it to the backend
async function scrapeAndSendData() {

  setTimeout(() => {  
    console.log("waiting for 5 seconds");
  }, 5000);
let pageContent = document.body.innerText;
pageContent = encodeURIComponent(pageContent);
  savedPageContent = pageContent;


  // Send the page content to the backend
  const response = await fetch('http://localhost:3000/scrape-page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: pageContent }),
  });

  if (response.ok) {
    const responseData = await response.json();
    if (responseData.success) {
      // Convert the response from the backend into speech
      textToSpeech(responseData.message);
    } else {
      console.error('Failed to process the request:', responseData.error);
    }
  } else {
    console.error('Failed to fetch:', response.status, response.statusText);
  }
}



if (!window.recognition) {
  window.recognition = new webkitSpeechRecognition();
}
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.continuous = true;

let isGreetingDone = false;

recognition.onresult = async (event) => {
  for (let i = 0; i < event.results.length; i++) {
    console.log(event.results[event.results.length - 1][0].transcript);
  }

  const transcript = event.results[event.results.length - 1][0].transcript;

  if (!isGreetingDone) {
    console.log("greeting");
    var lower = transcript.toLowerCase();
    if (lower.includes("hello")) {
      console.log("hello");
      textToSpeech("Hello, please enter the website.");
      isGreetingDone = true;
    }
  } else {
    console.log("in if else");
    var lower = transcript.toLowerCase();
    if (lower.includes("archive website")) {
        console.log("in if");
      lower = lower.replace("archive website", "");
      lower = lower.slice(0, -1);
      console.log(lower);
      insertTextAtCursor(lower);
      // <input type="submit" class="web-save-button web_button web_text" value="SAVE PAGE" style="margin: 16px 0;"></input>
      const button = document.querySelector(".web-save-button");
      button.click();
      console.log("archive website");
      textToSpeech("Website archived successfully.");
    }
    else if (lower.includes("scrape page")) {
      console.log("scrape page");
      textToSpeech("Page scraped successfully.");

      await scrapeAndSendData();


    }
  }

  if (transcript.toLowerCase().includes("that's all.")) {
    const el = document.activeElement;
    const e = new KeyboardEvent("keydown", {
      keyCode: 13,
      bubbles: true,
      cancelable: true,
    });

    el.dispatchEvent(e);
    toggleRecognition();

    return;
  }
};

recognition.onend = () => {
  console.log("end");
  if (!recognition.manualStop) {
    setTimeout(() => {
      recognition.start();
      console.log("manual Stop");
    }, 100);
  }
};



chrome.runtime.onMessage.addListener((request) => {
  if (request.command === "toggleRecognition") {
    toggleRecognition();
  } else if (request.command === "updatePopup") {
    const commands = request.commands || "";
    const archiveLink = request.archiveLink || "";

    chrome.runtime.sendMessage({
      command: "updateCommands",
      message: commands,
    });
    chrome.runtime.sendMessage({
      command: "updateArchiveLink",
      message: archiveLink,
    });
  }
});
function toggleRecognition() {
  console.log("toggle");
  if (!recognition.manualStop) {
    recognition.manualStop = true;
    recognition.stop();
    button.style.background = "#000";
  } else {
    recognition.manualStop = false;
    recognition.start();
    button.style.background = "#f00";
  }
}

