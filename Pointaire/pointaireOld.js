/*
Oisin Gibson
L00172671

Server Side Programming CA 1

References:
https://www.youtube.com/@GeeksforGeeksWebDevelopment
https://www.youtube.com/watch?v=_oHByo8tiEY&ab_channel=Fireship
https://www.w3schools.com/js/js_async.asp
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch

*/

import inquirer from 'inquirer'; // Importing the inquirer package for user input prompts
import chalk from 'chalk'; // Importing chalk for colored console output
import fs from 'fs-extra'; // Importing fs-extra for file operations (read/write)
import lodash from 'lodash'; // Importing lodash for utility functions like sorting
import ora from 'ora'; // Importing ora for loading spinner
import figlet from 'figlet'; // Importing figlet for decorations

// Initialize the questions array and top scores array
let questions = []; // This will hold the quiz questions loaded from a JSON file
let scores = []; // This will hold the top scores of players
let playerName; // Variable to store the player's name

// Load questions from a JSON file
async function loadQ() {
    try {
        // Read the questions.json file and parse its contents
        let data = await fs.readFile('questions.json', 'utf-8');
        questions = JSON.parse(data); // Store the questions in the questions array
        console.log(questions); // Debug log to check loaded questions
    } catch (error) {
        // Log error if loading fails
        console.error(chalk.red("Failed to load questions: "), error);
    }
}

// Save questions to a JSON file
async function saveQs() {
    try {
        // Write the questions array back to questions.json
        await fs.writeFile('questions.json', JSON.stringify(questions, null, 2));
    } catch (error) {
        // Log error if saving fails
        console.error(chalk.red("Due to circumstances beyond my control your questions have not been saved: "), error);
    }
}

// Load top scores from a JSON file
async function loadScores() {
    try {
        // Read the scores.json file and parse its contents
        let data = await fs.readFile('scores.json', 'utf-8');
        scores = JSON.parse(data).scores || []; // Handle case where scores.json is empty
    } catch (error) {
        // Log error if loading fails and initialize scores to an empty array
        console.error(chalk.red("Unfortunately the scores have failed to load. Please enjoy this error message :)  : "), error);
        scores = [];
    }
}

// Save top scores to a JSON file
async function saveScores() {
    try {
        // Write the scores array back to scores.json
        await fs.writeFile('scores.json', JSON.stringify({ scores: scores }, null, 2));
    } catch (error) {
        // Log error if saving fails
        console.error(chalk.red("Failed to save scores: "), error);
    }
}

// Display the main menu for the game
async function showMenu() {
    try {
        // Generate and display the welcome banner with figlet
        console.log(chalk.bgYellow(figlet.textSync('Who Wants to Be a Pointaire ?', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        })));

        // Prompt the user to select an option from the main menu
        let { option } = await inquirer.prompt({
            type: 'list',
            name: 'option',
            message: 'Select an option:', // Added message here
            choices: [
                'Play the game',
                'Admin',
                'View top scores',
                'Exit'
            ]
        });

        // Execute the corresponding action based on user selection
        switch (option) {
            case 'Play the game':
                await enterName(); // Ask for player name before starting the game
                await play(); // Start the game
                break;
            case 'Admin':
                await adminMenu(); // Open the admin menu
                break;
            case 'View top scores':
                viewScores(); // Display top scores
                break;
            case 'Exit':
                console.log(chalk.yellow("Thank you for playing!")); // Thank the user and exit
                process.exit(0);
        }
    } catch (error) {
        // Log any errors encountered when showing the menu
        console.error(chalk.red("An error occurred while showing the menu. Here's an error message: "), error);
    }
}

// Function to view top scores
function viewScores() {
    // Check if there are any scores to display
    if (scores.length === 0) {
        console.log(chalk.red("No scores available."));
        return; // Return if no scores available
    }

    // Sort scores in descending order and display them
    console.log(chalk.green("Top Scores:"));
    scores.forEach((score, index) => {
        console.log(chalk.blue(`${index + 1}. ${score.name}: ${score.score}`)); // Display each score
    });
}

// Prompt for player name
async function enterName() {
    // Prompt for player name
    let { name } = await inquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'Enter your name:',
    });
    playerName = name; // Store the player's name
}

// Play the quiz game
async function play() {
    let spinner = ora('Please wait while Mr Clarkson finds you some questions...').start(); // Start loading spinner
    await loadQ(); // Load questions from the file
    await loadScores(); // Load top scores from the file
    spinner.stop(); // Stop the spinner once loading is complete

    // Check if there are any questions available
    if (!questions || questions.length === 0) { // Added check for undefined or empty questions
        console.log(chalk.red("Sorry, there are currently no questions available. Not much of a game show is it HA HA"));
        return showMenu(); // Go back to the main menu if no questions are available
    }

    // Shuffle questions and limit to a maximum of 15
    let selectedQuestions = lodash.sampleSize(questions, Math.min(15, questions.length));
    let score = 0; // Initialize score

    // Loop through each question to ask the user
    for (let question of selectedQuestions) {
        let { questionText, options } = formatQuestion(question); // Format the question for display

        // Format answer options side by side
        let optionsDisplay = options.map((opt, index) => `${String.fromCharCode(65 + index)}: ${opt}`).join('    '); // A: Option1    B: Option2

        let { answer } = await inquirer.prompt({
            type: 'list',
            name: 'answer',
            message: `${questionText}\n${optionsDisplay}`, // Display the question and options
            choices: options, // Provide the answer choices
        });

        // Check if the user's answer is correct
        if (answer === question.content[question.correct.charCodeAt(0) - 97]) {
            console.log(chalk.green("Correct!")); // Display correct answer message
            score++; // Increment score for correct answer
        } else {
            // Display wrong answer message with the correct answer
            console.log(chalk.red("Sorry your answer was terrible. The correct answer was: " + question.content[question.correct.charCodeAt(0) - 97]));
        }
    }

    // Display final score after all questions
    console.log(chalk.yellow(`Your score: ${score}/${selectedQuestions.length}`));
    await recordScore(score); // Record the player's score
    showMenu(); // Return to the main menu
}

// Format the question and options for display
function formatQuestion(question) {
    // Validate question format
    if (!Array.isArray(question.content) || question.content.length !== 4) {
        throw new Error("Invalid question format: 'content' must be an array of 4 options.");
    }

    return {
        questionText: question.question, // The question text
        options: [...question.content] // The answer options
    };
}

// Record the player's score
async function recordScore(score) {
    // Store the score and name in the scores array
    scores.push({ name: playerName, score });
    // Sort scores in descending order and keep only top 5 scores
    scores = lodash.orderBy(scores, ['score'], ['desc']).slice(0, 5);
    console.log(chalk.blue(`Score recorded! ${playerName}, your score: ${score}`)); // Confirm that the score was recorded
    await saveScores(); // Save updated scores to the file
}

// Admin Menu for managing questions
async function adminMenu() {
    try {
        // Prompt to select an action in the admin menu
        let { action } = await inquirer.prompt({
            type: 'list',
            name: 'action',
            message: 'Admin Menu:',
            choices: [
                'Add question', // Option to add a new question
                'Delete question', // Option to delete an existing question
                'Edit question', // Option to edit an existing question
                'View questions', // Option to view all questions
                'Main Menu' // Option to return to the main menu
            ]
        });

        // Execute corresponding admin action based on selection
        switch (action) {
            case 'Add question':
                await addQ(); // Call function to add a new question
                break;
            case 'Delete question':
                await deleteQ(); // Call function to delete a question
                break;
            case 'Edit question':
                await editQuestion(); // Call function to edit a question
                break;
            case 'View questions':
                viewQuestions(); // Call function to view all questions
                break;
            case 'Main Menu':
                showMenu(); // Return to the main menu
                break;
        }
    } catch (error) {
        // Log any errors encountered in the admin menu
        console.error(chalk.red("An error occurred in the admin menu: "), error);
    }
}

// Function to view all questions
function viewQuestions() {
    // Display all questions in a formatted manner
    questions.forEach((q, index) => {
        console.log(chalk.green(`Question ${index + 1}: ${q.question}`)); // Display question
        q.content.forEach((opt, i) => {
            console.log(chalk.blue(`    ${String.fromCharCode(65 + i)}: ${opt}`)); // Display options
        });
        console.log(chalk.yellow(`    Correct Answer: ${q.correct}`)); // Display correct answer
    });
}

// Function to add a new question
async function addQ() {
    // Prompt for new question details
    let { question, content, correct } = await inquirer.prompt([
        {
            type: 'input',
            name: 'question',
            message: 'Enter the question:', // Prompt for the question text
        },
        {
            type: 'input',
            name: 'content',
            message: 'Enter the options separated by commas (e.g., option1,option2,option3,option4):', // Prompt for options
        },
        {
            type: 'input',
            name: 'correct',
            message: 'Enter the correct option letter (A, B, C, or D):', // Prompt for the correct answer
        }
    ]);

    // Validate and parse options
    let options = content.split(',').map(opt => opt.trim()); // Split input into an array
    if (options.length !== 4) {
        console.log(chalk.red("Please provide exactly 4 options.")); // Error for invalid options
        return; // Return if invalid options
    }

    // Ensure the correct option is valid
    if (!['A', 'B', 'C', 'D'].includes(correct.toUpperCase())) {
        console.log(chalk.red("Correct option must be one of: A, B, C, or D.")); // Error for invalid correct option
        return; // Return if invalid correct option
    }

    // Add the new question to the questions array
    questions.push({
        question,
        content: options, // Store options
        correct: correct.toUpperCase() // Store correct answer in uppercase
    });

    await saveQs(); // Save updated questions to the file
    console.log(chalk.green("Question added successfully!")); // Confirm addition
}

// Function to delete a question
async function deleteQ() {
    // Check if there are questions to delete
    if (questions.length === 0) {
        console.log(chalk.red("No questions available to delete.")); // Error for no available questions
        return; // Return if no questions available
    }

    // Prompt to select a question to delete
    let { questionIndex } = await inquirer.prompt({
        type: 'list',
        name: 'questionIndex',
        message: 'Select a question to delete:', // Prompt for question selection
        choices: questions.map((q, index) => `${index + 1}: ${q.question}`) // Display question choices
    });

    // Remove the selected question from the questions array
    questions.splice(Number(questionIndex.split(':')[0]) - 1, 1); // Parse index and remove question
    await saveQs(); // Save updated questions to the file
    console.log(chalk.green("Question deleted successfully!")); // Confirm deletion
}

// Function to edit an existing question
async function editQuestion() {
    // Check if there are questions to edit
    if (questions.length === 0) {
        console.log(chalk.red("No questions available to edit.")); // Error for no available questions
        return; // Return if no questions available
    }

    // Prompt to select a question to edit
    let { questionIndex } = await inquirer.prompt({
        type: 'list',
        name: 'questionIndex',
        message: 'Select a question to edit:', // Prompt for question selection
        choices: questions.map((q, index) => `${index + 1}: ${q.question}`) // Display question choices
    });

    let index = Number(questionIndex.split(':')[0]) - 1; // Parse index of the selected question
    let questionToEdit = questions[index]; // Get the selected question

    // Prompt to update the question details
    let { question, content, correct } = await inquirer.prompt([
        {
            type: 'input',
            name: 'question',
            message: 'Edit the question:', // Prompt for editing question text
            default: questionToEdit.question, // Default value for question
        },
        {
            type: 'input',
            name: 'content',
            message: 'Edit the options separated by commas (e.g., option1,option2,option3,option4):', // Prompt for editing options
            default: questionToEdit.content.join(', '), // Default options
        },
        {
            type: 'input',
            name: 'correct',
            message: 'Edit the correct option letter (A, B, C, or D):', // Prompt for editing correct answer
            default: questionToEdit.correct // Default correct answer
        }
    ]);

    // Validate and parse new options
    let options = content.split(',').map(opt => opt.trim()); // Split input into an array
    if (options.length !== 4) {
        console.log(chalk.red("Please provide exactly 4 options.")); // Error for invalid options
        return; // Return if invalid options
    }

    // Ensure the correct option is valid
    if (!['A', 'B', 'C', 'D'].includes(correct.toUpperCase())) {
        console.log(chalk.red("Correct option must be one of: A, B, C, or D.")); // Error for invalid correct option
        return; // Return if invalid correct option
    }

    // Update the question in the questions array
    questions[index] = {
        question,
        content: options, // Store options
        correct: correct.toUpperCase() // Store correct answer in uppercase
    };

    await saveQs(); // Save updated questions to the file
    console.log(chalk.green("Question updated successfully!")); // Confirm update
}

// Load scores and questions on script start
(async function start() {
    await loadScores(); // Load scores
    await loadQ(); // Load questions
    showMenu(); // Display the main menu
})();
