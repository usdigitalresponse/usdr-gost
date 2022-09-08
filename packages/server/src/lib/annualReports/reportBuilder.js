const PROJECT_DATA = 'Project Data';

/**
 * @typedef ProjectData
 * @type {object}
 * @property {number} amountSpent - total expenditure
 * @property {string} category - arpa expenditure category e.g. '1.5-Personal Protective Equipment'
 * @property {string} description - text description of the project
 * @property {string} name - project name
 * @property {string} recipient - organization which ran this project
 * @property {string} website
 * @property {string} impactStatement - the impact statement we're generating based off their data
 */

/**
 * Pulls the information relevant to the docx generator out of the excel workbook
 * @param book
 * @returns {ProjectData}
 */
const genericTemplateParser = (book) => {
    const projectSheet = book.Sheets[PROJECT_DATA];
    const impactSheet = book.Sheets['Impact Statement'];

    // This is the editable one, and should be preferred
    const editableImpactStatement = impactSheet.E16;
    let impactStatement;
    if (editableImpactStatement) {
        impactStatement = editableImpactStatement.v;
    } else {
        impactStatement = impactSheet.E8.v;
    }

    return {
        name: projectSheet.C9.v,
        recipient: projectSheet.C10.v,
        category: projectSheet.C19.v,
        description: projectSheet.C21.v,
        amountSpent: projectSheet.C17.v,
        website: projectSheet.C24.v,
        impactStatement,
    };
};

/**
 * Pulls the information relevant to the docx generator out of the excel workbook
 * @param book
 * @returns {ProjectData}
 */
const tulsaTemplateParser = (book) => {
    const projectSheet = book.Sheets[PROJECT_DATA];
    const impactSheet = book.Sheets['Impact Statement'];

    // This is the editable one, and should be preferred
    const editableImpactStatement = impactSheet.E16;
    let impactStatement;
    if (editableImpactStatement) {
        impactStatement = editableImpactStatement.v;
    } else {
        impactStatement = impactSheet.E8.v;
    }

    return {
        name: projectSheet.C9.v,
        recipient: projectSheet.C10.v,

        // All of Tulsa's programs fall into EC 6
        category: '6 - Revenue Replacement',
        description: '', // not on Tulsa's template
        amountSpent: projectSheet.C18.v, // Differs between templates
        website: '', // not on Tulsa's template
        impactStatement,
    };
};

/**
 *
 * @param book
 * @param fullAnnualData {{
 *     category: {
 *         totalExpenditure: int,
 *         projects: [ProjectData]
 *     }
 * }}
 */
const parseDataFromWorkbook = (book, fullAnnualData) => {
    const projectSheet = book.Sheets[PROJECT_DATA];
    let projectData;

    const isTulsa = !projectSheet.B19;
    if (isTulsa) {
        projectData = tulsaTemplateParser(book);
    } else {
        projectData = genericTemplateParser(book);
    }

    const { category } = projectData;
    // I am not at all worried about prototype key collisions in this case
    if (!(category in fullAnnualData)) {
        fullAnnualData[category] = { totalExpenditure: 0, projects: [] };
    }

    fullAnnualData[category].totalExpenditure += projectData.amountSpent;
    fullAnnualData[category].projects.push(projectData);
};

module.exports = { parseDataFromWorkbook };
