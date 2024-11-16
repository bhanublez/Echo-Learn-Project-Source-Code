// JavaScript for dynamic question addition
document
  .getElementById("add-question-btn")
  .addEventListener("click", function () {
    const newQuestion = prompt("Enter your new question:");
    if (newQuestion) {
      const questionList = document.getElementById("questions-list");
      const newListItem = document.createElement("li");
      newListItem.textContent = newQuestion;
      questionList.appendChild(newListItem);
    }
  });

// Button to redirect to a different page or perform action
document
  .getElementById("get-started-btn")
  .addEventListener("click", function () {
    alert("Welcome to Echolearn! Let's get started.");
  });
