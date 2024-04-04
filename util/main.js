const fs = require('fs');
const path = require('path');

// Function to read JSON data from a file
function readJsonFile(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) reject(err);
            else resolve(JSON.parse(data));
        });
    });
}

// Function to convert colors to SCSS variables
function convertToScss(tokensJson) {
    let scssOutput = "";
    for (const theme in tokensJson) {
        const themeData = tokensJson[theme];
        if (themeData.color) {
            for (const category in themeData.color) {
                const categoryData = themeData.color[category];
                for (const color in categoryData) {
                    const colorData = categoryData[color];
                    const scssVariableName = `--QLD-color-${category}-${color}`;
                    scssOutput += `${scssVariableName}: ${colorData.value};\n`;
                }
            }
        }
    }
    return scssOutput;
}

// Main function to orchestrate reading JSON and converting to SCSS
async function main() {

    const filepath = path.join(__dirname, '..', 'figma', 'tokens.json');

    try {
        const tokensJson = await readJsonFile(filepath);
        const scssOutput = convertToScss(tokensJson);
        
        // Print the SCSS output
        console.log(scssOutput);
        
        // Optionally, save to a file
        fs.writeFile('./dist/output.scss', scssOutput, (err) => {
            if (err) throw err;
            console.log('The SCSS has been saved!');
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the main function
main();
