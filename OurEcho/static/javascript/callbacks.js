let mediaRecorder;

let audioBase64;
let recordedChunks = [];

let isRecording = false;
let audio;

// Function to handle microphone recording
document.querySelector(".mic-button").addEventListener("click", () => {
  if (!isRecording) {
    recordedChunks = [];
    startRecording();
    return;
  } else {
    stopRecording();
    return;
  }
});
let STScoreAPIKey = "rll5QsTiv83nti99BW6uCmvs9BDVxSB39SVFceYb"; // Public Key. If, for some reason, you would like a private one, send-me a message and we can discuss some possibilities
let apiMainPathSample = "http://127.0.0.1:3000"; // 'http://127.0.0.1:3001';
let apiMainPathSTS = "http://127.0.0.1:3000";

function updateScore(currentPronunciationScore) {
  if (isNaN(currentPronunciationScore)) return;
  currentScore += currentPronunciationScore * scoreMultiplier;
  currentScore = Math.round(currentScore);
}

function startRecording() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        console.log("Recording started");
        isRecording = true;

        // Change the mic button style or icon to indicate recording is on
        document
          .querySelector(".mic-button i")
          .classList.replace("fa-microphone", "fa-stop");

        mediaRecorder.ondataavailable = function (event) {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async function () {
          const blob = new Blob(recordedChunks, { type: "audio/ogg;" });
          const audioURL = URL.createObjectURL(blob);
          audio = new Audio(audioURL);
          //audio in base64
          (async () => {
            audioBase64 = await convertBlobToBase64(blob);
            // console.log("Audio in base64: ", audioBase64);
          })();
          // let minimumAllowedLength = 6;
          // if (audioBase64.length < minimumAllowedLength) {
          //   setTimeout(UIRecordingError, 50); // Make sure this function finished after get called again
          //   return;
          // }
          // const downloadLink = document.createElement("a");
          // downloadLink.href = "data:text/plain;base64," + audioBase64;
          // downloadLink.download = "audioBase64.txt";
          // downloadLink.textContent = "Download Base64 Audio";
          // document.body.appendChild(downloadLink);

          // Optionally play the recorded audio
          try {
            console.log("OK");
            fetch(apiMainPathSTS + "/initialize", {
              method: "post",
              body: JSON.stringify({
                title: currentText,
                base64Audio: audioBase64,
              }),
              // headers: { "X-Api-Key": STScoreAPIKey },
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.error) {
                  console.log("Error initializing server");
                  return;
                }
                console.log("Server initialized Ok " + data);
                serverIsInitialized = true;

                document.getElementById("recorded_ipa_script").innerHTML =
                  "/ " + data.ipa_transcript + " /";
                document.getElementById("pronunciation_accuracy").innerHTML =
                  data.pronunciation_accuracy + "%";
                lettersOfWordAreCorrect =
                  data.is_letter_correct_all_words.split(" ");
                startTime = data.start_time;
                endTime = data.end_time;
                real_transcripts_ipa = data.real_transcripts_ipa.split(" ");
                matched_transcripts_ipa =
                  data.matched_transcripts_ipa.split(" ");
                wordCategories = data.pair_accuracy_category.split(" ");
                // Debugging statements
                // console.log("currentText: 999", currentText);
                // console.log("Type of currentText: 999", typeof currentText);
                if (Array.isArray(currentText)) {
                  currentText = currentText.join(" ");
                }
                let coloredWords = "";
                if (typeof currentText === "string") {
                  let currentTextWords = currentText.split(" ");
                  coloredWords = "";
                  for (
                    let word_idx = 0;
                    word_idx < currentTextWords.length;
                    word_idx++
                  ) {
                    wordTemp = "";
                    for (
                      let letter_idx = 0;
                      letter_idx < currentTextWords[word_idx].length;
                      letter_idx++
                    ) {
                      letter_is_correct =
                        lettersOfWordAreCorrect[word_idx][letter_idx] == "1";
                      if (letter_is_correct) color_letter = "blue";
                      else color_letter = "pink";

                      wordTemp +=
                        "<font color=" +
                        color_letter +
                        ">" +
                        currentTextWords[word_idx][letter_idx] +
                        "</font>";
                    }
                    // currentTextWords[word_idx]
                    coloredWords +=
                      " " + wrapWordForIndividualPlayback(wordTemp, word_idx);
                  }
                } else {
                  console.error("currentText is not a string:", currentText);
                }
                document.getElementById("original_script").innerHTML =
                  coloredWords;

                currentSoundRecorded = true;
                unblockUI();
              });
          } catch {
            console.log("Error sending audio");
            UIError();
          }
          document.querySelector(".user-icon").addEventListener("click", () => {
            audio.play();
          });
        };
      })
      .catch(function (err) {
        console.error("Error accessing microphone: ", err.message || err);
        alert("Microphone access denied.");
      });
  } else {
    alert("Your browser does not support microphone access.");
  }
}

const playRecordedWord = (word_idx) => {
  wordStartTime = parseFloat(startTime.split(" ")[word_idx]);
  wordEndTime = parseFloat(endTime.split(" ")[word_idx]);

  playRecording(wordStartTime, wordEndTime);
};
const wrapWordForPlayingLink = (
  word,
  word_idx,
  isFromRecording,
  word_accuracy_color
) => {
  if (isFromRecording)
    return (
      '<a style = " white-space:nowrap; color:' +
      word_accuracy_color +
      '; " href="javascript:playRecordedWord(' +
      word_idx.toString() +
      ')"  >' +
      word +
      "</a> "
    );
  else
    return (
      '<a style = " white-space:nowrap; color:' +
      word_accuracy_color +
      '; " href="javascript:playCurrentWord(' +
      word_idx.toString() +
      ')" >' +
      word +
      "</a> "
    );
};
const playAudioSegment = async (audio, start = null, end = null) => {
  document.getElementById("main_title").innerHTML = "Generating word...";

  if (start == null || end == null) {
    // Play the entire audio file
    endTimeInMs = Math.round(audio.duration * 1000);
    audio.addEventListener("ended", function () {
      audio.currentTime = 0;
      unblockUI();
      document.getElementById("main_title").innerHTML =
        "Recorded Sound was played";
    });
    await audio.play();
  } else {
    // Play the audio file from the specified start time to the end time
    audio.currentTime = start;
    audio.play();
    durationInSeconds = end - start;
    endTimeInMs = Math.round(durationInSeconds * 1000);
    setTimeout(function () {
      unblockUI();
      audio.pause();
      audio.currentTime = 0;
      document.getElementById("main_title").innerHTML =
        "Recorded Sound was played";
    }, endTimeInMs);
  }
};
const playRecording = async (start = null, end = null) => {
  blockUI();

  try {
    playAudioSegment(audio, start, end);
  } catch {
    UINotSupported();
  }
};
const wrapWordForIndividualPlayback = (word, word_idx) => {
  return (
    '<a onmouseover="generateWordModal(' +
    word_idx.toString() +
    ')" style = " white-space:nowrap; " href="javascript:playNativeAndRecordedWord(' +
    word_idx.toString() +
    ')"  >' +
    word +
    "</a> "
  );
};
const playNativeAndRecordedWord = async (word_idx) => {
  if (isNativeSelectedForPlayback) playCurrentWord(word_idx);
  else playRecordedWord(word_idx);

  isNativeSelectedForPlayback = !isNativeSelectedForPlayback;
};
const playCurrentWord = async (word_idx) => {
  document.getElementById("main_title").innerHTML = "Generating word...";

  // Ensure currentText is a string
  if (Array.isArray(currentText)) {
    currentText = currentText.join(" ");
  }

  if (typeof currentText === "string") {
    const words = currentText.split(" ");
    const wordToPlay = words[word_idx];

    // Use Web Speech API to play the audio for the specific word
    const utterance = new SpeechSynthesisUtterance(wordToPlay);
    utterance.pitch = 0.7; // Lower pitch to make it more robotic
    utterance.rate = 0.8; // Set speech rate
    utterance.volume = 1; // Set volume
    utterance.voice = speechSynthesis
      .getVoices()
      .find(
        (voice) =>
          voice.name.includes("Google US English") ||
          voice.name.includes("Microsoft Zira")
      );

    // Speak the word
    speechSynthesis.speak(utterance);

    document.getElementById("main_title").innerHTML = "Word was played";
  } else {
    console.error("currentText is not a string:", currentText);
    document.getElementById("main_title").innerHTML =
      "Error: currentText is not a string";
  }
};
const generateWordModal = (word_idx) => {
  document.getElementById("single_word_ipa_pair").innerHTML =
    wrapWordForPlayingLink(
      real_transcripts_ipa[word_idx],
      word_idx,
      false,
      "black"
    ) +
    " | " +
    wrapWordForPlayingLink(
      matched_transcripts_ipa[word_idx],
      word_idx,
      true,
      accuracy_colors[parseInt(wordCategories[word_idx])]
    );
};

const cacheSoundFiles = async () => {};

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    console.log("Recording stopped");
    isRecording = false;

    // Change the mic button style or icon back to microphone
    document
      .querySelector(".mic-button i")
      .classList.replace("fa-stop", "fa-microphone");
  }
}

//############################ UI general control functions ###################
const unblockUI = () => {
  // document.getElementById("recordAudio").classList.remove('disabled');
  // document.getElementById("playSampleAudio").classList.remove('disabled');
  document.getElementById("generate_sample").onclick = () => getNextSample();
  // document.getElementById("nextButtonDiv").classList.remove('disabled');
  document.getElementById("original_script").classList.remove("disabled");
  document.getElementById("generate_sample").style["background-color"] =
    "#58636d";

  // if (currentSoundRecorded)
  //     document.getElementById("playRecordedAudio").classList.remove('disabled');
};
const blockUI = () => {
  // document.getElementById("recordAudio").classList.add("disabled");
  // document.getElementById("playSampleAudio").classList.add("disabled");
  document.getElementById("generate_sample").onclick = null;
  document.getElementById("original_script").classList.add("disabled");
  // document.getElementById("playRecordedAudio").classList.add("disabled");

  document.getElementById("generate_sample").style["background-color"] =
    "#adadad";
};
const UIError = () => {
  blockUI();
  document.getElementById("generate_sample").onclick = () => getNextSample(); //If error, user can only try to get a new sample
  document.getElementById("generate_sample").style["background-color"] =
    "#58636d";

  document.getElementById("recorded_ipa_script").innerHTML = "";
  document.getElementById("single_word_ipa_pair").innerHTML = "Error";
  document.getElementById("ipa_script").innerHTML = "Error";

  document.getElementById("main_title").innerHTML = "Server Error";
  document.getElementById("original_script").innerHTML =
    "Server error. Either the daily quota of the server is over or there was some internal error. You can try to generate a new sample in a few seconds. If the error persist, try comming back tomorrow or download the local version from Github :)";
};

const UINotSupported = () => {
  unblockUI();

  document.getElementById("main_title").innerHTML = "Browser unsupported";
};

const UIRecordingError = () => {
  unblockUI();
  document.getElementById("main_title").innerHTML =
    "Recording error, please try again or restart page.";
};

// Variables to playback accuracy sounds
let soundsPath = "../static"; //'https://stscore-sounds-bucket.s3.eu-central-1.amazonaws.com';
let soundFileGood = null;
let soundFileOkay = null;
let soundFileBad = null;

// Function for the robotic voice reading the first paragraph
document.querySelector(".chatbot-icon").addEventListener("click", () => {
  // const firstParaText = document.querySelector(".text-box p").textContent;
  const firstParaText = document.getElementById("original_script").textContent;

  // Initialize the speech synthesis API
  const utterance = new SpeechSynthesisUtterance(firstParaText);
  utterance.pitch = 0.7; // Lower pitch to make it more robotic
  utterance.rate = 0.8; // Set speech rate
  utterance.volume = 1; // Set volume
  utterance.voice = speechSynthesis
    .getVoices()
    .find(
      (voice) =>
        voice.name.includes("Google US English") ||
        voice.name.includes("Microsoft Zira")
    );

  // Speak the first paragraph
  speechSynthesis.speak(utterance);
});

const page_title = "Echo Pronunciation Trainer";
const accuracy_colors = ["green", "orange", "red"];
let badScoreThreshold = 30;
let mediumScoreThreshold = 70;
let currentSample = 0;
let currentScore = 0;
let sample_difficult = 0;
let scoreMultiplier = 1;
let playAnswerSounds = true;
let isNativeSelectedForPlayback = true;
let serverIsInitialized = false;
let serverWorking = true;
let languageFound = true;
let currentSoundRecorded = false;
let currentText, currentIpa, real_transcripts_ipa, matched_transcripts_ipa;
let wordCategories;
let startTime, endTime;
let AILanguage = "en"; // Standard is German

const getNextSample = async () => {
  blockUI();
  if (!serverIsInitialized) await initializeServer();

  if (!serverWorking) {
    UIError();
    return;
  }
  if (soundFileBad == null) cacheSoundFiles();
  updateScore(
    parseFloat(document.getElementById("pronunciation_accuracy").innerHTML)
  );
  sample_difficult = 0;
  scoreMultiplier = 1;
  if (document.getElementById("lengthCat1").checked) {
    sample_difficult = 0;
    scoreMultiplier = 1.3;
  } else if (document.getElementById("lengthCat2").checked) {
    sample_difficult = 1;
    scoreMultiplier = 1;
  } else if (document.getElementById("lengthCat3").checked) {
    sample_difficult = 2;
    scoreMultiplier = 1.3;
  } else if (document.getElementById("lengthCat4").checked) {
    sample_difficult = 3;
    scoreMultiplier = 1.6;
  }
  // sample_difficult = 0;
  // scoreMultiplier = 1.3;

  try {
    await fetch(apiMainPathSample + "/getSample", {
      method: "post",
      body: JSON.stringify({
        category: sample_difficult.toString(),
        language: AILanguage,
      }),
      headers: { "X-Api-Key": STScoreAPIKey },
    })
      .then((res) => res.json())
      .then((data) => {
        let doc = document.getElementById("original_script");
        currentText = data.real_transcript;
        // console.log("Current Text: ", currentText);
        doc.innerHTML = currentText; //innerHTML = data.real_transcript;

        currentIpa = data.ipa_transcript;
        // console.log("Current IPA: ", currentIpa);

        let doc_ipa = document.getElementById("ipa_script");
        doc_ipa.innerHTML = "/ " + currentIpa + " /";

        document.getElementById("recorded_ipa_script").innerHTML = "";
        document.getElementById("pronunciation_accuracy").innerHTML = "";
        document.getElementById("single_word_ipa_pair").innerHTML =
          "Reference | Spoken";
        document.getElementById("section_accuracy").innerHTML =
          "| Score: " +
          currentScore.toString() +
          " - (" +
          currentSample.toString() +
          ")";
        currentSample += 1;

        // document.getElementById("main_title").innerHTML = page_title;

        document.getElementById("translated_script").innerHTML =
          data.transcript_translation;

        currentSoundRecorded = false;
        unblockUI();
        // document.getElementById("playRecordedAudio").classList.add("disabled");
      });
  } catch {
    console.log("Error getting sample");
    UIError();
  }
};

const next = document.getElementById("generate_sample");
next.addEventListener("click", () => {
  getNextSample();
});

// Function to convert blob to base64

const convertBlobToBase64 = async (blob) => {
  return await blobToBase64(blob);
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

//Function to initialize the server

const initializeServer = async () => {
  valid_response = false;
  let no_try = 0;
  let max_try = 4;
  while (!valid_response) {
    if (no_try >= max_try) {
      console.log("Error initializing server");
      serverWorking = false;
      return;
    }
    try {
      await fetch(apiMainPathSTS + "/initialize", {
        method: "post",
        body: JSON.stringify({
          title: "",
          base64Audio: "",
          language: AILanguage,
        }),
        // headers: { "X-Api-Key": STScoreAPIKey },
      }).then((valid_response = true));
      console.log("Server initialized");
      serverIsInitialized = true;
    } catch {
      no_try += 1;
    }
  }
};
// let currentChatIndex = 0;
// let boy1Chat = "";
// let boy2Chat = "";

// // Function to fetch chat data from the server
// async function fetchNextChat() {
//   try {
//     const response = await fetch(apiMainPathSTS + "/get_chats", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ index: 2 }),
//     });

//     const data = await response.json();

//     if (response.ok) {
//       boy1Chat = data.boy1;
//       boy2Chat = data.boy2;
//       // Update the UI with the chat lines
//       document.querySelector(".chat-message-1 p").innerText = boy1Chat;
//       document.querySelector(".chat-message-2 p").innerText = boy2Chat;
//       currentChatIndex++; // Increment the index for the next chat
//     } else {
//       console.error("Error fetching chat data:", data.error);
//     }
//   } catch {
//     console.error("Error fetching chat data:");
//   }
// }

// // Function to activate the microphone (placeholder)
// function activateMic() {
//   // alert("Microphone activated. Start speaking.");
//   console.log("Ok1");
//   console.log(boy1Chat);
// }

// Fetch the first chat when the page loads
window.onload = fetchNextChat;

