const docx = require('docx');
const placeholders = require('./placeholderTextStrings');

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

    static buildSectionHeader(text) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({
                    size: 24,
                    text,
                }),
            ],
            spacing: { before: 200, after: 0 },
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

    static buildPlaceholderParagraph(arrayOfStrings) {
        const children = [];
        arrayOfStrings.forEach((text) => {
            const run = new docx.TextRun({
                size: 24,
                color: 'ADADAD',
                break: 1,
                text,
            });
            children.push(run);
        });

        return new docx.Paragraph({
            spacing: { after: 400 },
            children,
        });
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

    static buildPageHeader(text) {
        return new docx.Paragraph({
            heading: docx.HeadingLevel.HEADING_1,
            text,
            spacing: { after: 200 },
        });
    }

    static buildDocumentIntro() {
        const size = 28;
        return new docx.Paragraph({
            children: [
                new docx.TextRun({
                    text: 'The structure of this document is taken directly from US Treasury\'s ',
                    break: 1,
                    size,
                }),
                new docx.ExternalHyperlink({
                    children: [new docx.TextRun({
                        text: 'Annual Recovery Plan Template. ',
                        style: 'Hyperlink',
                        size,
                    })],
                    link: 'https://home.treasury.gov/system/files/136/SLFRF-Recovery-Plan-Performance-Report-Template.docx',
                }),
                new docx.TextRun({
                    text: 'Gray text ',
                    color: 'ADADAD',
                    break: 2,
                    size,
                }),
                new docx.TextRun({
                    text: 'indicates guidance that should be deleted as you fill out the section. ',
                    size,
                }),
                new docx.TextRun({
                    text: 'USDR has pre-populated the Table of Expenses and Project Inventory '
                        + 'sections based on your uploaded workbooks.',
                    break: 2,
                    size,
                }),
                new docx.TextRun({
                    text: 'Please delete this page before submitting the report.',
                    break: 3,
                    bold: true,
                    size,
                }),
            ],
        });
    }

    formatExpenditureValue(val) {
        return this.dollarFormatter.format(val);
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
                    ArpaDocumentBuilder.buildPlaceholderParagraph(
                        placeholders.PROJECT_OVERVIEW,
                    ),
                    ArpaDocumentBuilder.buildPlaceholderParagraph(
                        placeholders.PROJECT_USE_OF_EVIDENCE,
                    ),
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
                    children: [
                        ArpaDocumentBuilder.buildPageHeader('Instructions for this template'),
                        ArpaDocumentBuilder.buildDocumentIntro(),
                    ],
                },
                {
                    properties: {
                        type: docx.SectionType.NEXT_PAGE,
                    },
                    children: [
                        ArpaDocumentBuilder.buildPageHeader('General Overview'),
                        ArpaDocumentBuilder.buildSectionHeader('Executive Summary'),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(
                            placeholders.EXECUTIVE_SUMMARY,
                        ),
                        ArpaDocumentBuilder.buildSectionHeader('Uses of Funds'),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(placeholders.USES_OF_FUNDS),
                        ArpaDocumentBuilder.buildSectionHeader('Promoting Equitable Outcomes'),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(
                            placeholders.PROMOTING_EQUITABLE_OUTCOMES,
                        ),
                        ArpaDocumentBuilder.buildSectionHeader('Community Engagement'),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(
                            placeholders.COMMUNITY_ENGAGEMENT,
                        ),
                        ArpaDocumentBuilder.buildSectionHeader('Labor Practices'),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(
                            placeholders.LABOR_PRACTICES,
                        ),
                        ArpaDocumentBuilder.buildSectionHeader('Use of Evidence'),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(
                            placeholders.USE_OF_EVIDENCE,
                        ),
                    ],
                },
                {
                    properties: {
                        type: docx.SectionType.NEXT_PAGE,
                    },
                    children: [
                        ArpaDocumentBuilder.buildPageHeader(
                            'Table of Expenses by Expenditure Category',
                        ),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(
                            placeholders.TABLE_OF_EXPENSES,
                        ),
                        this.buildSummaryTable(),
                    ],
                },
                {
                    properties: {
                        type: docx.SectionType.NEXT_PAGE,
                    },
                    children: this.buildProjectInventory(),
                },
                {
                    properties: {
                        type: docx.SectionType.NEXT_PAGE,
                    },
                    children: [
                        ArpaDocumentBuilder.buildPageHeader('Performance Report'),
                        ArpaDocumentBuilder.buildPlaceholderParagraph(
                            placeholders.PERFORMANCE_REPORT,
                        ),
                    ],
                },
            ],
        });
    }

    static async documentToBuffer(document) {
        return docx.Packer.toBuffer(document);
    }
}

module.exports = ArpaDocumentBuilder;
