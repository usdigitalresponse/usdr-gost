const PROJECT_DATA = 'Project Data';

/*
    TODO: define an interface for the document generation flow
    TODO: you need 1 parser for the generic and 1 for Tulsa's specific template
    TODO: they should both return the same interface for ease of use with the document generator
*/

// Move this to its own file maybe?
const genericTemplateParser = (book) => {
    const projectData = book.Sheets[PROJECT_DATA];
    const project = {};
    project.name = projectData.C9.v;
    project.recipient = projectData.C10.v;
    project.category = projectData.C19.v;
    project.description = projectData.C21.v;
    project.amountSpent = projectData.C17.v;
    return project;
};

// This whole workflow blows up if the category strings are mismatched :(
// Confirm that those options won't be changed by anyone
const buildReportFromWorkbooks = (workbooks) => {
    const reportData = {};
    workbooks.forEach((book) => {
        const projectSheet = book.Sheets[PROJECT_DATA];

        // If this cell says "Expenditure Category" then it's the generic template
        const isGeneric = projectSheet.B19.v === 'Expenditure Category';
        if (isGeneric) {
            const projectData = genericTemplateParser(book);
            console.log('Project Data Parsed: ', projectData);
        }
        // console.log('B19: ', projectData.B19.v);
        // console.log('B21: ', projectData.B21.v);
    });
    return 1;
};

module.exports = buildReportFromWorkbooks;
