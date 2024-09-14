// DOM Elements
const questionNumberElement = document.getElementById('question-number');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const questionElement = document.getElementById('question-text');
const answersElement = document.querySelector('.answers');
const videoElement = document.getElementById('video');
const nextButton = document.getElementById('next-button');
const shareButton = document.getElementById('share-button');
const feedbackText = document.getElementById('feedback-text');

let currentQuestionNum = 1;
let score = 0;
let numQuestions = 2;
let numCorrect = 0;
let timeRemaining = 30; // in seconds
let timerInterval;
let questions = []; // To store the fetched quiz data
let selectedQuestions = []; // To store the 10 selected random questions

var videoURL = "";

// Fetch and Start Quiz
async function setupQuiz() {
    score = 0;
    numCorrect = 0;
    currentQuestionNum = 1;

    // Hide share button
    shareButton.style.display = 'none';

    // Fetch quiz data
    questions = await fetchQuizData();
    //console.log('Questions:', questions);

    if (questions.length === 0) {
        console.error('No questions were loaded.');
        return;
    }

    // Randomly select the questions
    selectedQuestions = selectRandomQuestions(questions, numQuestions);

    nextButton.removeEventListener('click', setupQuiz);
    nextButton.addEventListener('click', setNextQuestion);
    
    setNextQuestion();
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
    nextButton.style.display = 'none';

    while (answersElement.firstChild) {
        answersElement.removeChild(answersElement.firstChild);
    }
    clearInterval(timerInterval); // Clear any existing timer
    timeRemaining = 30;
    timerElement.textContent = `${timeRemaining.toFixed(1)}`; // Reset timer display

    showQuestion(selectedQuestions[currentQuestionNum - 1]);
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

function selectAnswer(e) {
    const selectedButton = e.target;

    // Stop the timer when an answer is selected
    clearInterval(timerInterval);

    // Check if selectedButton and its dataset are valid
    if (!selectedButton || !selectedButton.dataset) {
        console.log('Timer ran out or no valid button selected. Awarding 0 points.');
    }
    else {
        selectedButton.style.border = '3px solid white'
        const correct = selectedButton.dataset.correct;
        if (correct) {
            score += timeRemaining * 10; // Award points based on remaining time
            numCorrect += 1;
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

    // Shows the description feedback text
    feedbackText.style.display = 'block';

    // update the score
    updateQuestionNumber();

    // If this was last question then show final score and return
    if (currentQuestionNum == numQuestions) {
        showResult();
        return;
    }

    nextButton.textContent = "Próxima pergunta";
    nextButton.style.display = 'block';
    currentQuestionNum++;
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
    questionNumberElement.textContent = `${currentQuestionNum}/${numQuestions}`;
    let scoreValue = Math.round(score);
    scoreElement.textContent = `Pontuação: ${scoreValue}`;
}

function showResult() {
    //    resultContainer.style.display = 'block';
    //    resultText.innerText = `You scored ${score} points!`;

    questionNumberElement.textContent = `Correct: ${numCorrect}/${numQuestions}`;
    scoreElement.textContent = "";
    let finalScore = Math.round(score);
    scoreElement.textContent = `Pontuação final: ${finalScore}`;

    shareButton.style.display = 'block';

    // Reset the quiz for a new game
    nextButton.textContent = "Reiniciar Jogo";
    nextButton.style.display = 'block';
    nextButton.removeEventListener('click', setNextQuestion);
    nextButton.addEventListener('click', setupQuiz);
}

function shareWhatsApp() {
    const url = 'https://quiz1906.github.io/'; 
    let finalScore = Math.round(score);
    const text = `Acabei de fazer ${finalScore} com ${numCorrect}/${numQuestions} perguntas corretas no Quiz1906. Achas que consegues bater isso?"`;
    
    // Encode the text and URL for use in a query string
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    // WhatsApp sharing URL
    const shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;

    window.open(shareUrl, '_blank');
}

// Set the iframe to center the image
videoElement.style.backgroundImage = "url('sporting_badge.png')";
videoElement.style.opacity = 1;
scoreElement.textContent = `quiz1906.github.io`;
// Share button
shareButton.style.display = 'none';
shareButton.addEventListener('click', shareWhatsApp);
// Start button
nextButton.textContent = "Começar";
nextButton.style.display = 'block';
nextButton.addEventListener('click', setupQuiz);
