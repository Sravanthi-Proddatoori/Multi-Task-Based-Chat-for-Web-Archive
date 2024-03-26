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

if (!window.recognition) {
  window.recognition = new webkitSpeechRecognition();
}
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.continuous = true;

let isGreetingDone = false;

function scrapePageContent() {
  const content = document.documentElement.outerHTML;
  console.log("scrapePageContent ", content);
  return content;
}

async function sendDataToBackend(data) {
  try {
    const response = await fetch("YOUR_BACKEND_URL", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: data }),
    });
    const responseData = await response.json();
    console.log("Response from backend:", data);
  } catch (error) {
    console.error("Error sending data to backend:", error);
  }
}

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
      console.log(lower);
      const urlInput = document.getElementById("web-save-url-input");
      if (urlInput) {
        // Add a value to the input field
        urlInput.value = lower;
      }

      if (urlInput.value === lower) {
        const scrapedContent = scrapePageContent();
        sendDataToBackend(scrapedContent);

        const button = document.querySelector(".web-save-button");
        button.click();
        console.log("archive website");
        textToSpeech("Website archived successfully.");
      }
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