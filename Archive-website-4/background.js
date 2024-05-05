async function toggleSpeechToText() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  chrome.tabs.sendMessage(activeTab.id, { command: "toggleRecognition" });
  chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    function: function () {
      const button = document.getElementById("speechToTextButton");
      if (button) {
        button.style.display = "block";
      }
      const webArchiveUrlDiv = document.getElementById("webArchiveUrlDiv");
      if (webArchiveUrlDiv) {
        webArchiveUrlDiv.style.display = "block";
      }

      const saveWebPageContent = document.getElementById("sendToBackend");
      if (saveWebPageContent) {
        saveWebPageContent.style.display = "block";
      }
    },
  });
}

chrome.action.onClicked.addListener(() => {
  toggleSpeechToText();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle_speech_to_text") {
    toggleSpeechToText();
  }
});

function startRecording() {
  const activeTab = chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      const currentTab = tabs[0];
      chrome.tabs.sendMessage(currentTab.id, { command: "toggleRecognition" });
    }
  );
}

function textToSpeech(text) {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  console.log("utterance");
  synth.speak(utterance);
}