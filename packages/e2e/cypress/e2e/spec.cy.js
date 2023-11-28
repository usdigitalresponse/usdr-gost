it('loads page', () => {
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

    cy.contains('Federal Grant Finder');
});
