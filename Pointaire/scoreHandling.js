import fs from 'fs-extra'; // Importing fs-extra for file operations
import chalk from 'chalk'; // Importing chalk for colored console output

export async function loadScores() {
    try {
        let data = await fs.readFile('scores.json', 'utf-8');
        const scoresData = JSON.parse(data);

        // Ensure scores is an array
        if (Array.isArray(scoresData.scores)) {
            return scoresData.scores; // Only return scores without logging
        } else {
            console.warn(chalk.yellow("Warning: 'scores' is not in the expected array format. Returning empty array."));
            return []; // Return an empty array if 'scores' is not an array
        }
    } catch (error) {
        console.error(chalk.red("Failed to load scores: "), error); // Log only error details
        return []; // Return an empty array on failure
    }
}

export async function saveScores(scores) {
    try {
        // Ensure scores is an array before saving
        if (!Array.isArray(scores)) {
            console.error(chalk.red("Error: The provided scores are not in an array format."));
            return; // Exit the function early if scores is not an array
        }

        // Write the scores array wrapped in an object to scores.json
        await fs.promises.writeFile('scores.json', JSON.stringify({ scores }, null, 2));
        console.log(chalk.green("Scores saved successfully!")); // Optional: Log success message
    } catch (error) {
        console.error(chalk.red("Failed to save scores: "), error);
    }
}
