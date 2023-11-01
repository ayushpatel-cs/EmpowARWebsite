let mediaRecorder;
let socket;

document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const statusElement = document.querySelector('#status');
  const transcriptElement = document.querySelector('#transcript');

  startButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        alert('Browser not supported');
        return;
      }

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      socket = new WebSocket('ws://localhost:5555/listen');

      socket.onopen = () => {
        statusElement.textContent = 'Connected';
        mediaRecorder.addEventListener('dataavailable', async (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data);
          }
        });
        mediaRecorder.start(250);
        startButton.disabled = true;
        stopButton.disabled = false;
      };

      socket.onmessage = (message) => {
        const received = message.data;
        if (received) {
          transcriptElement.textContent += ' ' + message.data;
        }
      };
    });
  });

  stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  });

  // Handle tab closure or navigation
  window.addEventListener('beforeunload', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  });
});
