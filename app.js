// DOM Elements
const questionNumberElement = document.getElementById('question-number');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const questionElement = document.getElementById('question-text');
const answersElement = document.querySelector('.answers');
const videoElement = document.getElementById('video');
const nextButton = document.getElementById('next-button');
const feedbackText = document.getElementById('feedback-text');

let currentQuestionIndex = 0;
let score = 0;
let timeRemaining = 10; // in seconds
let timerInterval;
let questions = []; // To store the fetched quiz data
let selectedQuestions = []; // To store the 10 selected random questions

var videoURL = "";

// Event Listeners
nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    setNextQuestion();
    nextButton.style.display = 'none';
    nextButton.textContent = "Próxima pergunta";
});

//restartButton.addEventListener('click', startQuiz);

// Fetch and Start Quiz
async function setupQuiz() {

    // Set the iframe to center the image
    videoElement.style.backgroundImage = "url('sporting_badge.png')";
    videoElement.style.opacity = 1;

    score = 0;
    currentQuestionIndex = 0;

    // Fetch quiz data
    questions = await fetchQuizData();
    //console.log('Questions:', questions);

    if (questions.length === 0) {
        console.error('No questions were loaded.');
        return;
    }

    // Randomly select 10 questions
    selectedQuestions = selectRandomQuestions(questions, 10);
    nextButton.textContent = "Começar";
    nextButton.style.display = 'block';
    updateQuestionNumber();
}

async function fetchQuizData() {
    const sheetId = '1G_9MKgv0tCT53b3RULeAJso5NcwfBpJMxMh2-nc_eZY';
    const apiKey = 'AIzaSyCzfZsQXsHUJR2CWFwxH2iyZ1f9z5gI41g';
    const sheetName = '24_25_questions';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A2:M?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Log fetched data
        return data.values;
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array in case of error
    }
}

function selectRandomQuestions(questions, numberOfQuestions) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numberOfQuestions);
}

function setNextQuestion() {
    resetState();

    if (currentQuestionIndex >= selectedQuestions.length) {
        showResult();
        return;
    }

    showQuestion(selectedQuestions[currentQuestionIndex]);
    updateQuestionNumber();

    timerElement.textContent = "Prepare-se...";
    setTimeout(function () {
        startTimer();
        videoElement.style.opacity = 1;
    }, 2000); // Delay of 2000ms
}

function showQuestion(questionData) {
    const [type, round, url, question, answer0, answer1, answer2, answer3, correctIndex, finalScore, homeOrAway, opponent, desc] = questionData;
    videoElement.style.opacity = 0;
    videoElement.src = url;
    questionElement.textContent = question;

    inf = "";
    if (homeOrAway == "Home") {
        inf = "<span style='color: green;'>Jornada " + round + " : Sporting CP " + finalScore + " " + opponent + "<br>";
    } else {
        inf = "<span style='color: green;'>Jornada " + round + " : " + opponent + " " + finalScore + " Sporting CP<br>";
    }
    feedbackText.innerHTML = inf + desc + "</span>";
    feedbackText.style.display = 'none';

    const answers = [answer0, answer1, answer2, answer3];
    answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.classList.add('btn');
        if (index == correctIndex) {
            button.dataset.correct = true;
        }
        button.addEventListener('click', selectAnswer);
        answersElement.appendChild(button);
    });
}

function resetState() {
    while (answersElement.firstChild) {
        answersElement.removeChild(answersElement.firstChild);
    }
    clearInterval(timerInterval); // Clear any existing timer
    timeRemaining = 30;
    timerElement.textContent = `${timeRemaining.toFixed(1)}`; // Reset timer display
}

function showFeedback() {
    feedbackText.style.display = 'block';
}

function selectAnswer(e) {
    const selectedButton = e.target;

    // Check if selectedButton and its dataset are valid
    if (!selectedButton || !selectedButton.dataset) {
        console.log('Timer ran out or no valid button selected. Awarding 0 points.');
    }
    else {
        selectedButton.style.border = '3px solid white'
        const correct = selectedButton.dataset.correct;
        if (correct) {
            score += timeRemaining * 1000; // Award points based on remaining time
        }
    }

    // Highlight only the selected button based on whether it is correct or wrong
    Array.from(answersElement.children).forEach(button => {
        if (button.dataset.correct) {
            button.classList.add('correct');
        } else {
            button.classList.add('wrong');
        }
        button.disabled = true;
    });

    showFeedback();

    // Stop the timer when an answer is selected
    clearInterval(timerInterval);
    nextButton.style.display = 'block';

    // update the score
    updateQuestionNumber();
}


function setStatusClass(element, correct) {
    clearStatusClass(element);
    if (correct) {
        element.classList.add('correct');
    } else {
        element.classList.add('wrong');
    }
}

function clearStatusClass(element) {
    element.classList.remove('correct');
    element.classList.remove('wrong');
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining -= 0.1; // Decrease by 0.1 seconds

        if (timeRemaining <= 0) {
            timeRemaining = 0; // Ensure the timer stops at 0
            clearInterval(timerInterval);
            score += 0; // Award 0 points when the timer runs out
            selectAnswer({ target: {} }); // Automatically select an empty answer if time runs out
        }

        timerElement.textContent = `${timeRemaining.toFixed(1)}`;
    }, 100);
}

function updateQuestionNumber() {
    questionNumberElement.textContent = `${currentQuestionIndex + 1}/10`;
    let scoreValue = Math.round(score);
    scoreElement.textContent = `${scoreValue}`;
}

function showResult() {
    //    resultContainer.style.display = 'block';
    //    resultText.innerText = `You scored ${score} points!`;
}

setupQuiz();
