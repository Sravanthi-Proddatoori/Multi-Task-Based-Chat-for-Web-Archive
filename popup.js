document.getElementById('startButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'toggleRecognition' });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.command === 'updateCommands') {
        document.getElementById('commands').innerText = request.message;
    } else if (request.command === 'updateArchiveLink') {
        document.getElementById('archiveLink').innerText = `Archive URL: ${request.message}`;
    }
});
