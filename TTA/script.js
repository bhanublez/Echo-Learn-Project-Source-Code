const textArea = document.getElementById("text-to-convert");
const fileInput = document.getElementById("file-input");
const speechButton = document.getElementById("convert-button");
// const downloadLink = document.getElementById("download-link"); // Download link removed from UI

let synth = window.speechSynthesis;
let isSpeaking = false;

voices();
function voices() {
  // Get and set available voices
  synth.addEventListener("voiceschanged", () => {
    //Add voices menu if needed
    //   const voices = synth.getVoices();
    //     console.log(voices);
  });
}

function textToSpeech(text) {
  let utterance = new SpeechSynthesisUtterance(text);
  // Set voice if necessary (optional)
  return new Promise((resolve, reject) => {
    utterance.onend = resolve;
    synth.speak(utterance);
  });
}

speechButton.addEventListener("click", async (e) => {
  e.preventDefault();
  const text = textArea.value.trim();
  if (text !== "") {
    if (!synth.speaking) {
      await textToSpeech(text);
      isSpeaking = true;
      speechButton.innerText = "Pause Speech";
    } else {
      synth.cancel();
      isSpeaking = false;
      speechButton.innerText = "Convert to Speech";
    }
  }
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
      const text = e.target.result;
      if (text !== "") {
        textArea.value = text; // Set text content of textarea
        await textToSpeech(text);
      }
    };
    reader.readAsText(file);
  }
});
