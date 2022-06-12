// import fs from "fs";
// import {
//   Document,
//   Packer,
//   Paragraph,
//   Table,
//   TableCell,
//   TableRow,
// } from "docx";
// node is complaining about these imports for some reason

// import docx from "docx";
const docx = require('docx');


// Helper cuz the api for this package is kinda rough
function buildTableCell(value) {
    // Paragraph values have to be strings, ints won't write to the document
    return new docx.TableCell({ children: [new docx.Paragraph(value)]});
}

// data is an array of objects of the form {category: "something", total: "1234"}
function buildTable(data) {
    console.log('Building table from data');
    // have to build these up here cuz there doesn't seem to be a way to do
    const tableRows = [
        new docx.TableRow({
            // header row
            children: [
                buildTableCell(''),
                buildTableCell('Category'),
                buildTableCell('Total Expenditure'),
                buildTableCell('The other thing'),
            ]
        }),
    ];

    data.forEach((element) => {
        console.log('building row for: ', element);
        const newRow = new docx.TableRow({
            children: [
                buildTableCell(element['Category Id']),
                buildTableCell(element['Category']),
                buildTableCell(element['Total Expenditure']),
                buildTableCell('N/A So Far'),
            ]
        });

        tableRows.push(newRow);
    });

    const table = new docx.Table({
        // Column 0 is just the numeric id, so can be short
        columnWidths: ['10pc', '30pc', '30pc', '30pc'],
        rows: tableRows,
    });

    const doc = new docx.Document({
        sections: [{ children: [table] }]
    })

    // console.log("Writing test_doc.docx");

    return doc;
    // docx.Packer.toBuffer(doc).then((buffer) => {
    //   // TODO: then in here, send the response as a buffer with a filename
    //   fs.writeFileSync("test_doc.docx", buffer);
    // });
}

// gonna want to make sure the input comes in sorted properly
const fakeData = [
    {
        'Category Id': '5.11',
        Category: '5.11-Drinking water: Transmission & distribution',
        'Total Expenditure': '51123',
        // 'dunno if we'll have this for June': '',
    },
    {
        'Category Id': '4.2',
        Category: '4.2-Private Sector: Grants to other employers',
        'Total Expenditure': '42345',
        // "dunno if we'll have this for June": "",
    },
    {
        'Category Id': '1.11',
        Category: '1.11-Community Violence Interventions',
        'Total Expenditure': '11123',
        // "dunno if we'll have this for June": "",
    },
];

// buildTable(fakeData);

const giveBuffer = async() => {
    const doc = buildTable(fakeData)
    return await docx.Packer.toBuffer(doc);
};


module.exports = {
    buildTable,
    fakeData,
    giveBuffer,
};
