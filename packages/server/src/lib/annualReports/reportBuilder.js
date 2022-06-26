const typedefs = require('./typedefs');

const PROJECT_DATA = 'Project Data';

/**
 * Pulls the information relevant to the docx generator out of the excel workbook
 * @param book
 * @returns {typedefs.ProjectData}
 */
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
/**
 *
 * @param workbooks
 * @returns {{
 *     category: {
 *         totalExpenditure: int,
 *         projects: [typedefs.ProjectData]
 *     }
 * }}
 */
const parseDataFromWorkbooks = (workbooks) => {
    const reportData = {};
    workbooks.forEach((book) => {
        const projectSheet = book.Sheets[PROJECT_DATA];
        let projectData;

        // If this cell says "Expenditure Category" then it's the generic template
        // This workflow is extremely fragile based on this key. We've asked them not to modify
        // Any cells other than where input is required, this trim() and lowercase() is just a hedge
        // in case some kind of unexpected auto-format is applied
        const isGeneric = projectSheet.B19.v.trim().toLowerCase() === 'expenditure category';
        if (isGeneric) {
            projectData = genericTemplateParser(book);
        }

        const { category } = projectData;
        // I am not at all worried about prototype key collisions in this case
        if (!(category in reportData)) {
            reportData[category] = { totalExpenditure: 0, projects: [] };
        }

        reportData[category].totalExpenditure += projectData.amountSpent;
        reportData[category].projects.push(projectData);
    });

    return reportData;
};

module.exports = parseDataFromWorkbooks;
