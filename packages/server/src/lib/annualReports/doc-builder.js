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
    static buildTableHeaderCell(value) {
        return new docx.TableCell({
            children: [
                new docx.Paragraph({
                    text: value,
                    spacing: { line: 200 },
                }),
            ],
            verticalAlign: docx.VerticalAlign.CENTER,
        });
    }

    static buildTableCell(value, alignRight=false) {
        return new docx.TableCell({
            children: [
                new docx.Paragraph({
                    text: value,
                    spacing: { line: 200 },
                    alignment: alignRight ? docx.AlignmentType.RIGHT : docx.AlignmentType.LEFT,
                }),
            ],
            verticalAlign: docx.VerticalAlign.CENTER,
        });
    }

    formatExpenditureValue(val) {
        return this.dollarFormatter.format(val);
    }

    static buildTableHeaderRow() {
        return new docx.TableRow({
            children: [
                ArpaDocumentBuilder.buildTableHeaderCell('Category'),

                // The two below will be the same this year
                ArpaDocumentBuilder.buildTableHeaderCell('Cumulative Expenditures to Date ($)'),
                ArpaDocumentBuilder.buildTableHeaderCell('Amount since last recovery plan'),
            ],
            height: { value: 600 },
        });
    }

    buildSummaryTable() {
        const tableRows = [ArpaDocumentBuilder.buildTableHeaderRow()];

        this.sortedCategories.forEach((cat) => {
            const categoryData = this.data[cat];
            const amountString = this.formatExpenditureValue(categoryData.totalExpenditure);
            const newRow = new docx.TableRow({
                children: [
                    ArpaDocumentBuilder.buildTableCell(cat),
                    ArpaDocumentBuilder.buildTableCell(amountString, true),
                    ArpaDocumentBuilder.buildTableCell(amountString, true),
                ],
                height: { value: 800 },
            });

            tableRows.push(newRow);
        });

        return new docx.Table({
            columnWidths: ['30pc', '30pc', '30pc'],
            rows: tableRows,
        });
    }

    static buildPageHeader(text) {
        return new docx.Paragraph({
            heading: docx.HeadingLevel.HEADING_1,
            text,
            spacing: { after: 200 },
        });
    }

    buildProjectInventory() {
        const sectionHeader = ArpaDocumentBuilder.buildPageHeader('Project Inventory');
        // All the child elements will go in here
        const inventory = [sectionHeader];

        // these size values are in half-values
        // so size 28 is actually 14 in the doc
        const headerFontSize = 28;
        this.sortedCategories.forEach((cat) => {
            const categoryData = this.data[cat];
            categoryData.projects.forEach((project) => {
                const amountSpent = this.formatExpenditureValue(project.amountSpent);
                const paragraphs = [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: `Project Name: ${project.name}`,
                                size: headerFontSize,
                            }),
                        ],
                        spacing: { before: 500 },
                    }),
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: `Expenditure Category: ${project.category}`,
                                size: headerFontSize,
                            }),
                        ],
                    }),
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: `Recipient: ${project.recipient}`,
                                size: headerFontSize,
                            }),
                        ],
                    }),
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: `Amount Spent: ${amountSpent}`,
                                size: headerFontSize,
                            }),
                        ],
                    }),
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({ text: project.description, size: 24 }),
                        ],
                        spacing: { before: 100 },
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
                    children: [
                        ArpaDocumentBuilder.buildPageHeader('Table of Expenses by Expenditure Category'),
                        this.buildSummaryTable(),
                    ],
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
