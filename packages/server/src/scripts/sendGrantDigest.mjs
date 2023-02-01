const inquirer = require('inquirer');

function main() {
    inquirer
        .prompt([
        /* Pass your questions in here */
            '1',
        ])
        .then((answers) => {
        // Use user feedback for... whatever!!
            console.log(answers);
        })
        .catch((error) => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
                console.log('hi');
            } else {
                // Something else went wrong
                console.log('hi');
            }
        });
}

if (require.main === module) {
    main().then(() => process.exit());
}
