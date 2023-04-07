const fs = require("fs");

it('loads page', () => {
    cy.task('log', 'First spec is running');
    cy.visit('/', { timeout: 30000 });

    cy.on('uncaught:exception', (err, runnable) => {
        console.log(runnable);
        // This error is due to a lack of deploy-config.js file in the local environment.
        expect(err.message).to.include('token');

        // using mocha's async done callback to finish
        // this test so we prove that an uncaught exception
        // was thrown

        // return false to prevent the error from
        // failing this test
        return false;
    });

    cy.contains('Grants Identification Tool');
    /*
    cy.get('#email').type('invalid@usdigitalresponse.org');
    cy.get('button[type="Submit"]').click();
    cy.contains(`User 'invalid@usdigitalresponse.org' not found`);
    */
    cy.get('#email').type('asridhar@usdigitalresponse.org');
    cy.get('button[type="Submit"]').click();
    cy.contains(`Email sent to asridhar@usdigitalresponse.org. Check your inbox`);

    cy.request(`http://${Cypress.env('LOCALSTACK_HOSTNAME')}:${Cypress.env('EDGE_PORT')}/_aws/ses`).then(
        (res) => {
            // const htmlBody = res.body.messages[-1].Body;

            // cy.task('log', htmlBody);
            cy.task('log', res.body.messages);
            cy.task('log', res.body.messages[0].Body.text_part);
        },
    );

    // cy.request(`http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}/_aws/ses`).as('emails');
    // cy.task('log', '@emails');

    // Add ability to look at process.env.LOCALSTACK_VOLUME_DIR
    /*
    fs.open(`${process.env.LOCALSTACK_VOLUME_DIR}/tmp/state/ses`);

    const list = (err, files) => {
        // handling error
        if (err) {
            return cy.task('log', `${err} Unable to scan directory`);
        }
        // listing all files using forEach
        files.forEach((file) => {
            // Do whatever you want to do with the file
            cy.task('log', `${file}`);
        });
    };
    fs.readdir(`${process.env.LOCALSTACK_VOLUME_DIR}/tmp`, list);
    fs.readdir(`${process.env.LOCALSTACK_VOLUME_DIR}/state`, list);
    fs.readdir(`${process.env.LOCALSTACK_VOLUME_DIR}/state/ses`, list);
    */
});
