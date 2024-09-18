// DOM Elements
const questionNumberElement = document.getElementById('question-number');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const questionElement = document.getElementById('question-text');
const answersElement = document.querySelector('.answers');
//const videoElement = document.getElementById('video');
var videoElement = document.getElementById('my-video');
const nextButton = document.getElementById('next-button');
const shareButton = document.getElementById('share-button');
const feedbackText = document.getElementById('feedback-text');

const sheetId = '1G_9MKgv0tCT53b3RULeAJso5NcwfBpJMxMh2-nc_eZY';
const apiKey = 'AIzaSyCzfZsQXsHUJR2CWFwxH2iyZ1f9z5gI41g';
const sheetName = '24_25_questions';

let currentQuestionNum = 1;
let score = 0;
let numQuestions = 10;
let numCorrect = 0;
let timeRemaining = 30; // in seconds
let timerInterval;
let questions = []; // To store the fetched quiz data
let selectedQuestions = []; // To store the 10 selected random questions

// Fetch and Start Quiz
async function setupQuiz() {
    score = 0;
    numCorrect = 0;
    currentQuestionNum = 1;

    scoreElement.style.display = "block";

    player.hasStarted(false);

    // Hide share button
    shareButton.style.display = 'none';
    questionElement.style.display = 'none';

    // Fetch quiz data
    showSpinner();
    selectedQuestions = await fetchQuizData();

    if (selectedQuestions.length === 0) {
        console.error('No questions were loaded.');
        return;
    }

    nextButton.removeEventListener('click', setupQuiz);
    nextButton.addEventListener('click', setNextQuestion);
    hideSpinner();

    setNextQuestion();
}

function showSpinner() {
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'block';
}

function hideSpinner() {
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'none';
}

// ~~~~~~~~~

// Function to fetch the total number of rows (excluding the header)
async function fetchTotalRows() {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch total rows: ${response.statusText}`);
        }
        const data = await response.json();
        return data.values.length - 1; // Subtract 1 for the header row
    } catch (error) {
        console.error('Error fetching total rows:', error);
        throw error; // Re-throw the error so the main function can handle it
    }
}

// Function to get 100 unique random integers
function getUniqueRandomNumbers(totalRows, count) {
    const uniqueNumbers = new Set();
    while (uniqueNumbers.size < count) {
        const randomNum = Math.floor(Math.random() * totalRows) + 2; // Row 2 and onwards (Row 1 is header)
        uniqueNumbers.add(randomNum);
    }
    return Array.from(uniqueNumbers);
}

// Function to fetch specific rows in a single API call
async function fetchRowsInSingleCall(rowNumbers) {
    try {
        // Construct the range array, e.g., ["24_25!A2:Z2", "24_25!A4:Z4", ...]
        const ranges = rowNumbers.map(rowNum => `${sheetName}!A${rowNum}:M${rowNum}`);
        console.log("Ranges is " + ranges);
        // Use the ranges array directly in the request
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?ranges=${ranges.join('&ranges=')}&key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch rows: ${response.statusText}`);
        }
        const data = await response.json();
        return data.valueRanges.map(range => range.values ? range.values[0] : []);
    } catch (error) {
        console.error('Error fetching rows:', error);
        throw error;
    }
}

// Main function to get 100 random rows
async function getRandomRows() {
    try {
        const totalRows = await fetchTotalRows();
        const randomRowNumbers = getUniqueRandomNumbers(totalRows, 100);
        const randomRows = await fetchRowsInSingleCall(randomRowNumbers);
        return randomRows;
    } catch (error) {
        console.error('Error getting random rows:', error);
    }
}

// ~~~~~~~~~

async function fetchQuizData() {
    try {
        // Fetch the questions
        let q = await getRandomRows();
        //console.log("Fetched questions:", q); // Log fetched data

        if (!q || !Array.isArray(q)) {
            throw new Error("Invalid question data format. Expected an array.");
        }

        const groupedQuestions = {};

        // Grouping questions by type and jornada
        q.forEach(question => {
            const type = question[0]; // Type (1st column)
            const jornada = question[1]; // Jornada (2nd column)

            // Add more logs to debug individual questions
//            console.log("Processing question: ", question);
//            console.log("Question Type:", type, "Jornada:", jornada);
            
            if (!type || !jornada) {
                console.error("Missing type or jornada in question: ", question);
                return; // Skip this question if it's malformed
            }

            const key = `${type}-${jornada}`;

            if (!groupedQuestions[key]) {
                groupedQuestions[key] = [];
            }
            groupedQuestions[key].push(question);
        });

//        console.log("Grouped Questions:", groupedQuestions);

        const selectedQuestions = [];
        const numQuestions = 10; // Assuming you're fetching 10 questions
        const groupsCount = Object.keys(groupedQuestions).length;

        if (groupsCount === 0) {
            throw new Error("No groups of questions found. Please check the input data.");
        }

        // Define how many questions to take from each group
        const questionsPerGroup = Math.floor(numQuestions / groupsCount);

        // Randomly select questions from each group
        Object.keys(groupedQuestions).forEach(key => {
            const group = groupedQuestions[key];
//            console.log(`Shuffling group ${key}:`, group);

            const shuffledGroup = group.sort(() => 0.5 - Math.random()); // Shuffle the group
            selectedQuestions.push(...shuffledGroup.slice(0, questionsPerGroup));
        });

        // If the selected questions are fewer than needed, fill the gap
        if (selectedQuestions.length < numQuestions) {
            console.log("Not enough questions selected from groups, filling with remaining questions...");
            const remainingQuestions = q.filter(q => !selectedQuestions.includes(q));
            const additionalQuestions = remainingQuestions.sort(() => 0.5 - Math.random()).slice(0, numQuestions - selectedQuestions.length);
            selectedQuestions.push(...additionalQuestions);
        }

//        console.log("Selected Questions:", selectedQuestions);

        // Shuffle the final selection
        const finalQuestions = selectedQuestions.sort(() => 0.5 - Math.random());
        console.log("Final shuffled questions:", finalQuestions);

        // Return the final set of questions
        return finalQuestions;

    } catch (error) {
        console.error("Error in fetchQuizData:", error);
        return [];
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function setNextQuestion() {
    nextButton.style.display = 'none';

    while (answersElement.firstChild) {
        answersElement.removeChild(answersElement.firstChild);
    }
    clearInterval(timerInterval); 
    timeRemaining = 30;
    timerElement.textContent = `Time ${timeRemaining.toFixed(1)}`; 

    player.pause();

    videoElement.addEventListener('canplaythrough', readytoStartQuestion);

    questionElement.textContent = "Prepare-se...";
    feedbackText.style.display = 'none';
    updateQuestionNumber();

    const [type, round, url, question, answer0, answer1, answer2, answer3, correctIndex, finalScore, homeOrAway, opponent, desc] = selectedQuestions[currentQuestionNum - 1];
    player.src({
        src: "mp4/" + url,
        type: 'video/mp4'
    });
    player.load(); // Start loading the video

//    setTimeout(function () {
//        player.play();
//        showQuestion(selectedQuestions[currentQuestionNum - 1]);
//        startTimer();
    //}, 1000); // Delay of 2000ms
}

function readytoStartQuestion() {
    videoElement.removeEventListener('canplaythrough', readytoStartQuestion);
    player.play(); 
    showQuestion(selectedQuestions[currentQuestionNum - 1]);
    startTimer();
}

function showQuestion(questionData) {
    const [type, round, url, question, answer0, answer1, answer2, answer3, correctIndex, finalScore, homeOrAway, opponent, desc] = questionData;

    questionElement.textContent = question;

    inf = "";
    if (homeOrAway == "Home") {
        inf = "<span style='color: green;'>Jornada " + round + " : Sporting CP " + finalScore + " " + opponent + "<br>";
    } else {
        inf = "<span style='color: green;'>Jornada " + round + " : " + opponent + " " + finalScore + " Sporting CP<br>";
    }
    feedbackText.innerHTML = inf + desc + "</span>";

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

        timerElement.textContent = `Time ${timeRemaining.toFixed(1)}`;
    }, 100);
}

function updateQuestionNumber() {
    questionNumberElement.textContent = `Question ${currentQuestionNum}/${numQuestions}`;
    let scoreValue = Math.round(score);
    scoreElement.textContent = `Score ${scoreValue}`;
}

function showResult() {
    //    resultContainer.style.display = 'block';
    //    resultText.innerText = `You scored ${score} points!`;

    questionNumberElement.textContent = `${numCorrect}/${numQuestions} Correct`;
    scoreElement.style.display = "none";
    let finalScore = Math.round(score);
    timerElement.textContent = `Final Score ${finalScore}`;

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

var player = videojs('my-video', {
    controls: false, // Disable controls
    autoplay: false,  // Enable autoplay
    loop: true,      // Enable looping
    preload: 'auto',
    controlBar: {
        fullscreenToggle: false // Disable fullscreen button from Video.js options
    }
  });

// Disable fullscreen mode via JavaScript
player.on('dblclick', function(e) {
  e.preventDefault(); // Prevent double-clicking to trigger fullscreen
});

player.on('fullscreenchange', function() {
  if (player.isFullscreen()) {
    player.exitFullscreen(); // Exit fullscreen immediately if triggered
  }
});

scoreElement.textContent = `quiz1906.github.io`;
shareButton.style.display = 'none';
shareButton.addEventListener('click', shareWhatsApp);
nextButton.textContent = "Começar";
nextButton.style.display = 'block';
nextButton.addEventListener('click', setupQuiz);
