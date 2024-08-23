// DOM Elements
const questionNumberElement = document.getElementById('question-number');
const timerElement = document.getElementById('timer');
const questionElement = document.getElementById('question-text');
const answersElement = document.querySelector('.answers');
const videoElement = document.getElementById('video');
const nextButton = document.getElementById('next-button');

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
});

//restartButton.addEventListener('click', startQuiz);

// Fetch and Start Quiz
async function startQuiz() {
    score = 0;
    currentQuestionIndex = 0;

    // Fetch quiz data
    questions = await fetchQuizData();
    console.log('Questions:', questions);

    if (questions.length === 0) {
        console.error('No questions were loaded.');
        return;
    }

    // Randomly select 10 questions
    selectedQuestions = selectRandomQuestions(questions, 10);
    setNextQuestion();
}

async function fetchQuizData() {
    const sheetId = '1G_9MKgv0tCT53b3RULeAJso5NcwfBpJMxMh2-nc_eZY'; 
    const apiKey = 'AIzaSyCzfZsQXsHUJR2CWFwxH2iyZ1f9z5gI41g'; 
    const sheetName = '24_25_questions'; 
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A2:H?key=${apiKey}`;
    
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
    startTimer();
}

function showQuestion(questionData) {
    const [round, url, question, answer0, answer1, answer2, answer3, correctIndex] = questionData;
    questionElement.innerText = question;

    const answers = [answer0, answer1, answer2, answer3];
    answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.innerText = answer;
        button.classList.add('btn');
        if (index == correctIndex) {
            button.dataset.correct = true;
        }
        button.addEventListener('click', selectAnswer);
        answersElement.appendChild(button);
    });

    videoURL = url;
}

function resetState() {
    nextButton.style.display = 'none';
    while (answersElement.firstChild) {
        answersElement.removeChild(answersElement.firstChild);
    }
    clearInterval(timerInterval); // Clear any existing timer
    timeRemaining = 10;
    timerElement.innerText = `Time: ${timeRemaining.toFixed(1)}s`; // Reset timer display
}

function selectAnswer(e) {
    const selectedButton = e.target;

    videoElement.src = videoURL;

    // Check if selectedButton and its dataset are valid
    if (!selectedButton || !selectedButton.dataset) {
        // If no button is selected or dataset is undefined, award 0 points and move to the next question
        console.log('Timer ran out or no valid button selected. Awarding 0 points.');
        clearInterval(timerInterval);
        nextButton.style.display = 'block';
        return;
    }

    const correct = selectedButton.dataset.correct;
    if (correct) {
        score += timeRemaining * 1000; // Award points based on remaining time
    }

    // Highlight only the selected button based on whether it is correct or wrong
    Array.from(answersElement.children).forEach(button => {
        button.classList.remove('correct', 'wrong'); // Remove previous states
        button.disabled = true; // Disable all buttons
    });

    if (selectedButton.dataset.correct) {
        selectedButton.classList.add('correct');
    } else {
        selectedButton.classList.add('wrong');
    }

    // Stop the timer when an answer is selected
    clearInterval(timerInterval);
    nextButton.style.display = 'block';
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

        timerElement.innerText = `Time: ${timeRemaining.toFixed(1)}s`;
    }, 100);
}

function updateQuestionNumber() {
    questionNumberElement.textContent = `Question ${currentQuestionIndex + 1} / 10`;
}

function showResult() {
//    resultContainer.style.display = 'block';
//    resultText.innerText = `You scored ${score} points!`;
}

// Start the quiz when the page loads
startQuiz();
