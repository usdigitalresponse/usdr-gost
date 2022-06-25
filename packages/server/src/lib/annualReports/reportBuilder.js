const buildReportFromWorkbooks = (workbooks) => {
    const reportData = {};
    workbooks.forEach((book) => {
        const projectData = book.Sheets['Project Data'];
        // If this cell says "Expenditure Data" then it's the generic template
        const isGeneric = projectData.B19.v === 'Expenditure Data';
        console.log('B19: ', projectData.B19.v);
        console.log('B21: ', projectData.B21.v);
        console.log('C19: ', projectData.C19.v); // Expenditure category
        console.log('C21: ', projectData.C21.v); // Project Description
        // You also probably want program name and/or Subrecipient
    });
    return 1;
};

module.exports = buildReportFromWorkbooks;
