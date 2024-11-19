import inquirer from 'inquirer'; // User input prompts
import chalk from 'chalk'; // Colored console output
import { saveQs } from './questionHandling.js'; // Save questions function
import { loadScores } from './scoreHandling.js'; // Load scores function
import fs from 'fs'; // File operations
import path from 'path'; // File path handling
import figlet from 'figlet'; // Importing figlet for decorations

// Admin menu for managing quiz questions
export async function adminMenu(questions) {
    let shouldReturnToMenu = false; // Flag for menu navigation

    while (!shouldReturnToMenu) {
        try {
            const { action } = await inquirer.prompt({
                type: 'list',
                name: 'action',
                message: 'Admin Menu:',
                choices: [
                    { name: chalk.blue('Add question'), value: 'Add question' },
                    { name: chalk.blue('Delete question'), value: 'Delete question' },
                    { name: chalk.blue('Edit question'), value: 'Edit question' },
                    { name: chalk.blue('View questions'), value: 'View questions' },
                    { name: chalk.blue('View Leader Board'), value: 'View Leader Board' },
                    { name: chalk.blue('Main Menu'), value: 'Main Menu' }
                ]
            });

            switch (action) {
                case 'Add question':
                    await addQ(questions);
                    break;
                case 'Delete question':
                    await deleteQ(questions);
                    break;
                case 'Edit question':
                    await editQuestion(questions);
                    break;
                case 'View questions':
                    displayQuestions(questions);
                    break;
                case 'View Leader Board':
                    await displayTopScores(); // Ensure scores are loaded correctly
                    break;
                case 'Main Menu':
                    shouldReturnToMenu = true;
                    break;
            }

            if (action !== 'Main Menu') {
                const { continueAdmin } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'continueAdmin',
                    message: 'Do you want to perform another action in the admin menu?',
                    default: true
                });
                shouldReturnToMenu = !continueAdmin;
            }
        } catch (error) {
            console.error(chalk.red("An error occurred in the admin menu: "), error);
        }
    }
}

// Function to display all questions
export function displayQuestions(questions) {
    if (questions.length === 0) {
        console.log(chalk.yellow("No questions available.")); // message if no questions
        return;
    }
    questions.forEach((q, index) => {
        console.log(chalk.yellow(`Question ${index + 1}: ${q.question}`));
        q.content.forEach((opt, i) => {
            console.log(chalk.blue(`    ${String.fromCharCode(65 + i)}: ${opt}`));
        });
        console.log(chalk.green(`    Correct Answer: ${q.correct}`));
    });
}

// Function to add a new question
export async function addQ(questions) {
    let { question, content, correct } = await inquirer.prompt([
        {
            type: 'input',
            name: 'question',
            message: `${'='.repeat(18)}\nEnter your question:\n${'='.repeat(20)}\n`,
        },
        {
            type: 'input',
            name: 'content',
            message: `${'='.repeat(18)}\nEnter the options (separate by commas):\n${'='.repeat(20)}\n`,
        },
        {
            type: 'input',
            name: 'correct',
            message: 'Enter the correct option (A, B, C, D):',
        }
    ]);

    const options = content.split(',').map(opt => opt.trim());
    if (options.length !== 4) {
        return handleValidationError("Please provide exactly 4 options."); // Handling validation error
    }

    if (!isValidCorrectOption(correct)) {
        return handleValidationError("Correct answer must be between A and D");
    }

    questions.push({
        question,
        content: options,
        correct: correct.toUpperCase()
    });

    await saveQs(questions);
    console.log(chalk.green("Question added successfully!"));
}

// Helper function for validation error
function handleValidationError(message) {
    console.log(chalk.red(message));
}

// Check if the correct answer is valid
function isValidCorrectOption(correct) {
    return ['A', 'B', 'C', 'D'].includes(correct.toUpperCase());
}

// Function to delete an existing question
export async function deleteQ(questions) {
    const { questionToDelete } = await inquirer.prompt({
        type: 'list',
        name: 'questionToDelete',
        message: `${'='.repeat(18)}\nSelect a question to delete:\n${'='.repeat(20)}\n`,
        choices: questions.map((q, index) => `Question ${index + 1}: ${q.question}`)
    });

    const index = questions.findIndex((q, idx) => `Question ${idx + 1}: ${q.question}` === questionToDelete);
    if (index === -1) {
        return handleValidationError("Error: Question not found.");
    }

    questions.splice(index, 1);
    await saveQs(questions);
    console.log(chalk.green("Question deleted successfully!"));
}

// Function to edit an existing question
export async function editQuestion(questions) {
    const { questionToEdit } = await inquirer.prompt({
        type: 'list',
        name: 'questionToEdit',
        message: `${'='.repeat(18)}\nSelect a question to edit:\n${'='.repeat(20)}\n`,
        choices: questions.map((q, index) => `Question ${index + 1}: ${q.question}`)
    });

    const index = questions.findIndex((q, idx) => `Question ${idx + 1}: ${q.question}` === questionToEdit);
    const curQ = questions[index];

    let { newQuestion, newContent, newCorrect } = await inquirer.prompt([
        {
            type: 'input',
            name: 'newQuestion',
            message: `${'='.repeat(18)}\nEnter the new question:\n${'='.repeat(20)}\n`,
            default: curQ.question
        },
        {
            type: 'input',
            name: 'newContent',
            message: `${'='.repeat(18)}\nEnter the new options (separated by commas):\n${'='.repeat(20)}\n`,
            default: curQ.content.join(', ')
        },
        {
            type: 'input',
            name: 'newCorrect',
            message: `${'='.repeat(18)}\nEnter the correct option letter (A, B, C, D):\n${'='.repeat(20)}\n`,
            default: curQ.correct
        }
    ]);

    const options = newContent.split(',').map(opt => opt.trim());
    if (options.length !== 4) {
        return handleValidationError("Please provide exactly 4 options.");
    }

    if (!isValidCorrectOption(newCorrect)) {
        return handleValidationError("Correct answer must be between A and D");
    }

    questions[index] = {
        question: newQuestion,
        content: options,
        correct: newCorrect.toUpperCase()
    };

    await saveQs(questions);
    console.log(chalk.green("Question edited successfully!"));
}

// Function to read scores from the file
export async function readScores() {
    const filePath = path.join(process.cwd(), 'scores.json');
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                reject(`Error reading scores data: ${err.message}`);
                return;
            }
            try {
                const scores = JSON.parse(data);
                if (!Array.isArray(scores.scores)) {
                    reject(new TypeError("Scores data is not in the expected format."));
                    return;
                }
                const sortedScores = scores.scores.sort((a, b) => b.score - a.score);
                const topScores = sortedScores.slice(0, 5);
                resolve(topScores);
            } catch (parseError) {
                reject(`Error parsing scores data: ${parseError.message}`);
            }
        });
    });
}

export async function displayTopScores() {
    try {
        const loadedScores = await loadScores();
        if (loadedScores.length === 0) {
            console.log(chalk.red("No scores available. Play the game to earn some!"));
            return;
        }
        const sortedScores = loadedScores.sort((a, b) => b.score - a.score);
        const topScores = sortedScores.slice(0, 5);

        console.log(chalk.bgBlueBright(figlet.textSync('Leader Board', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        })));
        topScores.forEach((entry, index) => {
            console.log(chalk.blueBright(`${index + 1}. ${entry.name}: ${entry.score}\n`));
        });
    } catch (error) {
        console.error(chalk.red("An error occurred while displaying scores: "), error);
    }
}
