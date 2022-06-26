const docx = require('docx');

// TODO: define the datatype here
class ArpaDocumentBuilder {
    constructor(data) {
        this.data = data;
        this.sortedCategories = Object.keys(data).sort();
        this.dollarFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });
    }

    // Helper cuz the api for this package is kinda rough
    static buildTableCell(value) {
        // Paragraph values have to be strings, ints won't write to the document
        return new docx.TableCell({ children: [new docx.Paragraph(value)] });
    }

    formatExpenditureValue(val) {
        return this.dollarFormatter.format(val);
    }

    buildSummaryTable() {
        const tableRows = [
            new docx.TableRow({
                // header row
                children: [
                    ArpaDocumentBuilder.buildTableCell('Category'),
                    ArpaDocumentBuilder.buildTableCell('Cumulative Expenditures to Date ($)'), // these two will be the same
                    ArpaDocumentBuilder.buildTableCell('Amount since last recovery plan'), // these two will be the same
                ],
            }),
        ];

        this.sortedCategories.forEach((cat) => {
            const categoryData = this.data[cat];
            console.log('Expenditure before: ', categoryData.totalExpenditure);
            const amountString = this.formatExpenditureValue(categoryData.totalExpenditure);
            console.log('Expenditure after: ', amountString);
            const newRow = new docx.TableRow({
                children: [
                    ArpaDocumentBuilder.buildTableCell(cat),
                    ArpaDocumentBuilder.buildTableCell(amountString),
                    ArpaDocumentBuilder.buildTableCell(amountString),
                ],
            });

            tableRows.push(newRow);
        });

        return new docx.Table({
            columnWidths: ['30pc', '30pc', '30pc'],
            rows: tableRows,
        });
    }

    buildReportDocument() {
        const children = [this.buildSummaryTable()];
        return new docx.Document({
            sections: [{ children }],
        });
    }

    // toBuffer() {
    //     return ArpaDocumentBuilder.documentToBuffer(this.document);
    // }

    static async documentToBuffer(document) {
        return docx.Packer.toBuffer(document);
    }
}

// const fakeData = {
//     '1.5-Personal Protective Equipment': {
//         totalExpenditure: 30000,
//         projects: [
//             {
//                 name: 'Amazing Program',
//                 recipient: 'Justin\'s Co.',
//                 category: '1.5-Personal Protective Equipment',
//                 description: 'A brief description of the project.',
//                 amountSpent: 20000,
//             },
//             {
//                 name: 'Covid Education Program',
//                 recipient: 'Great NonProfit, Inc',
//                 category: '1.5-Personal Protective Equipment',
//                 description: 'A brief description of the project.',
//                 amountSpent: 10000,
//             },
//         ],
//     },
//     '1.14-Other Public Health Services': {
//         totalExpenditure: 30000,
//         projects: [
//             {
//                 name: 'Some other program',
//                 recipient: 'Mindy\'s Org',
//                 category: '1.14-Other Public Health Services',
//                 description: 'A brief description of the project.',
//                 amountSpent: 30000,
//             },
//         ],
//     },
// };
//
// buildTable(fakeData);

// const giveBuffer = async () => {
//     const doc = buildTable(fakeData);
//     return await docx.Packer.toBuffer(doc);
// };

module.exports = ArpaDocumentBuilder;
