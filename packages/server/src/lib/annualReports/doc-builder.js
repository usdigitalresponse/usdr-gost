const docx = require('docx');

// This could use type definitions but I'm bad at JSDoc and that takes time
/**
 * data looks like:
 *  {
 *      category1: { totalExpenditure: 1234, projects: [ProjectData] },
 *      category2: { totalExpenditure: 2345, projects: [ProjectData] },
 *      ...etc
 *  }
 */
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
        return new docx.TableCell({ children: [new docx.Paragraph(value)] });
    }

    formatExpenditureValue(val) {
        return this.dollarFormatter.format(val);
    }

    static buildTableHeaderRow() {
        return new docx.TableRow({
            children: [
                ArpaDocumentBuilder.buildTableCell('Category'),

                // The two below will be the same this year
                ArpaDocumentBuilder.buildTableCell('Cumulative Expenditures to Date ($)'),
                ArpaDocumentBuilder.buildTableCell('Amount since last recovery plan'),
            ],
        });
    }

    buildSummaryTable() {
        const tableRows = [ArpaDocumentBuilder.buildTableHeaderRow()];

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

    buildProjectInventory() {
        const sectionHeader = new docx.Paragraph({
            text: 'Project Inventory',
            heading: docx.HeadingLevel.HEADING_1,
        });
        // All the child elements will go in here
        const inventory = [sectionHeader];
        this.sortedCategories.forEach((cat) => {
            const categoryData = this.data[cat];
            categoryData.projects.forEach((project) => {
                const paragraphs = [
                    new docx.Paragraph({
                        text: `Project Name: ${project.name}`,
                    }),
                    new docx.Paragraph({
                        text: `Expenditure Category: ${project.category}`,
                    }),
                    new docx.Paragraph({
                        text: `Amount Spent: ${project.amountSpent}`,
                    }),
                    new docx.Paragraph({
                        text: `Recipient: ${project.recipient}`,
                    }),
                ];
                inventory.push(...paragraphs);
            });
        });

        return inventory;
    }

    buildReportDocument() {
        return new docx.Document({
            sections: [
                {
                    properties: {
                        type: docx.SectionType.NEXT_PAGE,
                    },
                    children: [this.buildSummaryTable()],
                },
                {
                    properties: {
                        type: docx.SectionType.NEXT_PAGE,
                    },
                    children: this.buildProjectInventory(),
                },
            ],
        });
    }

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
