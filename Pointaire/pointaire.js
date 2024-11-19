/*
Oisin Gibson
L00172671

Server Side Programming CA 1

Use this file to run the program: node pointaire.js

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
import ora from 'ora'; // Importing ora for loading spinner
import figlet from 'figlet'; // Importing figlet for decorations
import { loadQ, saveQs } from './questionHandling.js'; // Functions to handle questions
import { loadScores, saveScores } from './scoreHandling.js'; // Functions to handle scores
import { adminMenu, displayTopScores } from './adminHandling.js'; // Functions for admin tasks
import { play } from './gameHandling.js'; // Function to handle game logic

let questions = []; // This will hold the quiz questions loaded from a JSON file
let scores = []; // This will hold the top scores of players

// Load scores and questions on script start
(async function start() {
    const spinner = ora('Please wait while the Leader Board and our list of Questions are loading...').start();

    try {
        scores = await loadScores(); // Load scores
        questions = await loadQ(); // Load questions
        spinner.stop(); // Stop the spinner
        showMenu(); // Display the main menu
    } catch (error) {
        console.error(chalk.red("Error loading data. Here's an error: "), error);
    }
})();

async function showMenu() {
    try {
        // Display the welcome banner
        console.log(chalk.bgBlueBright(figlet.textSync('Who Wants to Be a Pointaire ?', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        })));

        // Main menu prompt with the updated options
        const { option } = await inquirer.prompt({
            type: 'list',
            name: 'option',
            message: `${'='.repeat(18)}\nSelect an option:\n${'='.repeat(20)}`,  // Underline with '=' symbols
            choices: [
                { name: chalk.blue('Play the game'), value: 'Play the game' },
                { name: chalk.blue('Admin'), value: 'Admin' },
                { name: chalk.blue('View Leader Board'), value: 'View Leader Board' },
                { name: chalk.blue('Exit'), value: 'Exit' }
            ]
        });

        // Execute action based on user selection
        switch (option) {
            case 'Play the game':
                const { name } = await inquirer.prompt({
                    type: 'input',
                    name: 'name',
                    message: `${'='.repeat(18)}\nPlease enter your name:\n${'='.repeat(20)}\n`, // Prompt for player's name
                });
                await play(questions, scores, name); // Start the game
                break;
            case 'Admin':
                await adminMenu(questions); // Open admin menu
                break;
            case 'View Leader Board':
                await displayTopScores(); // Call the function to display top scores
                break;
            case 'Exit':
                console.log(chalk.yellow("Thank you for playing!")); // Exit message
                process.exit(0);
        }

        // Show the menu again after action is completed
        await showMenu(); // Recurse back to main menu

    } catch (error) {
        // Log any errors encountered
        console.error(chalk.red("An error occurred while showing the menu: "), error);
    }
}
