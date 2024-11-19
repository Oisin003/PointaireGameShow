import inquirer from 'inquirer'; // Importing inquirer for interactive input prompts
import chalk from 'chalk'; // Importing chalk for colored console output
import { saveScores } from './scoreHandling.js'; // Importing saveScores to save player scores

// Lifeline usage tracking object to keep track of which lifelines have been used
let lifelineUsed = { audience: false, fiftyFifty: false, callFriend: false };

// Function to check if the selected answer is correct
function checkAnswer(answer, question) {
    // Extract the letter of the selected answer
    let selectedLetter = answer.charAt(0).toUpperCase(); // e.g., 'A'

    // Check if the selected answer matches the correct answer
    if (selectedLetter === question.correct.toUpperCase()) {
        console.log(chalk.green("Congrats, you got the answer right!"));
        return true; // Return true if the answer is correct
    } else {
        // Get the correct answer text using its index
        let correctAnswerText = question.content[question.correct.charCodeAt(0) - 97]; // ASCII 'a' = 97
        console.log(chalk.red(`Close...but not close enough. The correct answer was: ${correctAnswerText}`));
        return false; // Return false if the answer is incorrect
    }
}

// Function to play the quiz game
export async function play(questions, scores, playerName) {
    let correctAnswers = 0; // Initialize counter for correct answers

    // Shuffle and select 15 random questions from the question pool
    questions = questions.sort(() => 0.5 - Math.random()).slice(0, 15);

    // Loop through each question to present to the player
    for (let q of questions) {
        // Map the answers to A, B, C, D format
        let choices = q.content.map((choice, index) => {
            let optionLetter = String.fromCharCode(65 + index); // Generate 'A', 'B', 'C', 'D'
            return `${optionLetter}: ${choice}`; // Format like 'A: Thailand'
        });

        // Ask the question using inquirer, including a Lifeline option
        let { answer } = await inquirer.prompt({
            type: 'list', // Type of prompt for a list of choices
            name: 'answer', // Name of the answer field
            message: q.question, // Display the question
            choices: [...choices, 'Lifeline'] // Add Lifeline option to the choices
        });

        // If Lifeline is selected, present the available lifeline options
        if (answer === 'Lifeline') {
            let lifelineChoice = await selectLifeline(q); // Get lifeline choice
            if (lifelineChoice) {
                answer = await askQuestionAgain(q); // Re-ask the question after using a lifeline
            }
        }

        // Use the checkAnswer function to validate the answer
        if (checkAnswer(answer, q)) {
            correctAnswers++; // Increment if the answer is correct
        }
    }

    // Display the total number of correct answers
    console.log(chalk.yellow(`Congrats ${playerName}, you got ${correctAnswers} questions correct`));

    // Ask the player if they want to record their score
    let { record } = await inquirer.prompt({
        type: 'confirm', // Type of prompt for yes/no confirmation
        name: 'record', // Name of the record field
        message: 'Do you want your score recorded?', // Prompt message
        default: true // Default answer is yes
    });

    if (record) {
        // Record the player's score
        scores.push({ name: playerName, score: correctAnswers }); // Push the new score to the scores array
        scores = scores.sort((a, b) => b.score - a.score).slice(0, 5); // Keep top 5 scores only
        await saveScores(scores); // Save the scores to file or database
        console.log(chalk.yellow(`Your score has been added to our leaderboard: ${playerName} score ${correctAnswers}`)); // Confirmation message
    } else {
        console.log(chalk.yellow("Your score was not recorded.")); // Message if user opts not to save the score
    }

    // Ask the player if they want to play again or exit
    let { playAgain } = await inquirer.prompt({
        type: 'confirm', // Type of prompt for yes/no confirmation
        name: 'playAgain', // Name of the playAgain field
        message: 'Clarkson has challenged you to another game. Are you up for it?', // Prompt message
        default: false // Default answer is no
    });

    // If the player wants to play again, restart the game
    if (playAgain) {
        await play(questions, scores, playerName); // Recursive call to start the game again
    } else {
        // Exit the game
        console.log(chalk.yellow("We thank you for playing!")); // Exit message
        process.exit(0); // Terminate the process
    }
}

// Function to display lifeline options and use the selected lifeline
async function selectLifeline(question) {
    // Prompt user to select a lifeline
    let { lifeline } = await inquirer.prompt({
        type: 'list', // Type of prompt for a list of choices
        name: 'lifeline', // Name of the lifeline field
        message: `${'='.repeat(18)}\nSelect a lifeline:\n${'='.repeat(20)}\n`, // Prompt message
        //     `${'='.repeat(18)}\nEnter the correct option letter (A, B, C, D):\n${'='.repeat(20)}\n`,
        choices: [
            ...(lifelineUsed.fiftyFifty ? [] : ['50/50']), // Include 50/50 if not used
            ...(lifelineUsed.audience ? [] : ['Audience Poll']), // Include Audience Poll if not used
            ...(lifelineUsed.callFriend ? [] : ['Call a Friend']), // Include Call a Friend if not used
            'Cancel' // Option to cancel the lifeline
        ]
    });

    // Execute the chosen lifeline
    switch (lifeline) {
        case '50/50':
            lifelineUsed.fiftyFifty = true; // Mark 50/50 as used
            useFiftyFifty(question); // Call function to apply 50/50 lifeline
            break;
        case 'Audience Poll':
            lifelineUsed.audience = true; // Mark Audience Poll as used
            useAudiencePoll(question); // Call function to apply Audience Poll lifeline
            break;
        case 'Call a Friend':
            lifelineUsed.callFriend = true; // Mark Call a Friend as used
            useCallFriend(question); // Call function to apply Call a Friend lifeline
            break;
        case 'Cancel':
        default:
            return false; // Cancel the lifeline and return
    }

    return true; // Lifeline was successfully used
}

// Function to re-ask the question after lifeline usage
async function askQuestionAgain(question) {
    // Map the question choices again after lifeline usage
    let choices = question.content.map((choice, index) => {
        let optionLetter = String.fromCharCode(65 + index); // Generate 'A', 'B', 'C', 'D'
        return `${optionLetter}: ${choice}`; // Format like 'A: Choice'
    });

    // Prompt the user with the question again
    let { answer } = await inquirer.prompt({
        type: 'list', // Type of prompt for a list of choices
        name: 'answer', // Name of the answer field
        message: question.question, // Display the question again
        choices // Use the modified choices
    });

    return answer; // Return the new answer
}

// Lifeline: 50/50
function useFiftyFifty(question) {
    // Notify the user that the 50/50 lifeline has been activated
    console.log(chalk.blue('The 50/50 Lifeline has been activated.'));

    // Inform the user about the remaining options
    console.log("Two of the four answers has been removed. Choose wisley.");

    // Initialize an array to hold the indexes of the selected options
    // Start by adding the index of the correct answer to the array
    let selectedIndexes = [question.correct.charCodeAt(0) - 97];

    // Use a loop to randomly select one incorrect answer index
    while (selectedIndexes.length < 2) {
        // Generate a random index based on the number of options available
        let randomIndex = Math.floor(Math.random() * question.content.length);

        // Check if the generated index is already in the selectedIndexes array
        // This ensures that we only add unique indexes
        if (!selectedIndexes.includes(randomIndex)) {
            // If it’s a unique index, add it to the selectedIndexes array
            selectedIndexes.push(randomIndex);
        }
    }

    // Sort the selectedIndexes array to maintain a consistent order
    selectedIndexes.sort();

    // Display the two selected options to the user
    selectedIndexes.forEach(index => {
        // Log each option with its corresponding index (1-based)
        console.log(chalk.blue(`${index + 1}. ${question.content[index]}`));
    });
}


// Lifeline: Audience Poll
function useAudiencePoll(q) {
    // Inform the user that the Audience Poll lifeline has been activated
    console.log(chalk.blue('The Audience Poll Lifeline has been activated.'));

    // Determine if the audience is likely to answer correctly (90% chance)
    const correct = Math.random() < 0.9; // Random boolean value for audience accuracy
    const correctIndex = q.correct.charCodeAt(0) - 97; // Index of the correct answer based on character code

    // Set default percentages for the audience's response
    let mainPercent = 90; // Default percentage for the correct answer
    let otherPercents = [5, 3, 2]; // Default low percentages for incorrect answers

    // If the audience is less likely to be correct (10% chance), adjust the percentages
    if (!correct) {
        // Generate a random percentage for the correct answer
        mainPercent = Math.floor(Math.random() * 50); // Random percentage between 0 and 49 for the correct answer

        // Calculate percentages for incorrect options
        otherPercents = [
            Math.floor(Math.random() * (100 - mainPercent)), // First incorrect percentage
            Math.floor(Math.random() * (100 - mainPercent - otherPercents[0])), // Second incorrect percentage
            100 - mainPercent - otherPercents[0] - otherPercents[1] // Remaining percentage for third incorrect answer
        ];

        // Shuffle the incorrect percentages randomly
        otherPercents.sort(() => Math.random() - 0.5);
    }

    // Display audience vote percentages for each option in the question
    q.content.forEach((opt, idx) => {
        // Check if the current index corresponds to the correct answer index
        if (idx === correctIndex) {
            console.log(chalk.blue(`${idx + 1}: ${mainPercent}%`)); // Display percentage for the correct answer
        } else {
            // Display percentage for incorrect answers
            console.log(chalk.blue(`${idx + 1}: ${otherPercents.shift()}%`)); // Display incorrect answer percentage
        }
    });
}


// Lifeline: Call a Friend
function useCallFriend(question) {
    console.log(chalk.blue('Call a Friend Lifeline has been used.')); // Inform user of lifeline usage
    // Randomly select an answer for the friend to suggest
    let friendAnswer = question.content[Math.floor(Math.random() * question.content.length)];
    console.log(chalk.green(`Your friend wasn't 100% sure but thinks the answer could be: ${friendAnswer}`)); // Display friend suggestion
}
