import fs from 'fs-extra'; // Importing fs-extra for enhanced file operations
import chalk from 'chalk'; // Importing chalk for colored console output, useful for error messages

// Function to load questions from a JSON file
export async function loadQ() {
    try {
        // Read the questions.json file and parse its contents
        let data = await fs.readFile('questions.json', 'utf-8'); // Read the file as a UTF-8 encoded string
        return JSON.parse(data); // Parse the JSON string and return the questions array
    } catch (error) {
        // Log error if loading fails
        console.error(chalk.red("Failed to load questions: "), error); // Display the error message in red for visibility
        return []; // Return an empty array on failure to indicate no questions were loaded
    }
}

// Function to save questions to a JSON file
export async function saveQs(questions) {
    try {
        // Write the questions array back to questions.json in a pretty-printed format
        await fs.writeFile('questions.json', JSON.stringify(questions, null, 2)); // Indent the JSON with 2 spaces for readability
    } catch (error) {
        // Log error if saving fails
        console.error(chalk.red("Failed to save questions: "), error); // Display the error message in red for visibility
    }
}
