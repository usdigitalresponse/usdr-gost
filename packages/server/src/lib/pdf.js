const fs = require('fs').promises;
const path = require('path');
const uuid = require('uuid/v4');
const { PDFDocument } = require('pdf-lib');

const staticPath = 'static/forms';

async function isDirectoryExists(directory) {
    try {
        await fs.stat(directory);
        return true;
    } catch (e) {
        return false;
    }
}

module.exports.fillPdf = async (filePath, template, body) => {
    const sourcePDF = await fs.readFile(path.resolve(__dirname, '..', staticPath, filePath));
    // Load a PDF with form fields
    const pdfDoc = await PDFDocument.load(sourcePDF);

    // Get the form containing all the fields
    const form = pdfDoc.getForm();

    const fields = form.getFields();
    fields.forEach((field) => {
        const type = field.constructor.name;
        const name = field.getName();
        if (type === 'PDFTextField' && template.PDFTextField[name]) {
            field.setText(body[template.PDFTextField[name]]);
        }
        console.log(`${type}: ${name}`);
    });
    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.resolve(__dirname, '..', staticPath, './generated');
    if (!await isDirectoryExists(pdfPath)) {
        await fs.mkdir(pdfPath);
    }
    const pdfName = uuid();
    const generatedPdf = path.resolve(pdfPath, `./${pdfName}.pdf`);
    await fs.writeFile(generatedPdf, pdfBytes);
    return `/${staticPath}/generated/${pdfName}.pdf`;
};
