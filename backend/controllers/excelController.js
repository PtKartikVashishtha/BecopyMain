const axios = require('axios');
const fs = require('fs');
const tmp = require('tmp');
const XLSX = require('xlsx');
const Program = require('../models/programModel');
const Category = require('../models/categoryModel');

const processExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      console.log("No file uploaded or Cloudinary path missing");
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Step 1: Download the file from Cloudinary
    const fileUrl = req.file.path; // Cloudinary file URL
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    // Step 2: Save to a temporary file
    const tempFile = tmp.fileSync({ postfix: '.xlsx' });
    fs.writeFileSync(tempFile.name, response.data);

    // Step 3: Read Excel file
    const workbook = XLSX.readFile(tempFile.name);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Step 4: Process and save data
    const savedPrograms = [];
    for (const row of data) {
      try {
        if (!row.category) throw new Error('Missing category');

        let category = await Category.findOne({ name: row.category });
        if (!category) {
          category = await new Category({ name: row.category }).save();
        }

        const program = new Program({
          name: row.name || 'name',
          description: row.description || 'description',
          isActive: row.isActive === 'true',
          code: {
            java: row.javaCode || 'sample',
            python: row.pythonCode || 'sample',
            html: row.htmlCode || 'sample'
          },
          category: category._id,
        });

        const savedProgram = await program.save();
        savedPrograms.push(savedProgram);

      } catch (rowError) {
        console.error('Row processing error:', row, rowError.message);
      }
    }

    // Cleanup
    tempFile.removeCallback();

    res.status(200).json({
      message: 'Excel file processed successfully',
      programs: savedPrograms
    });

  } catch (error) {
    console.error('Error processing excel file:', error.message);
    res.status(500).json({ message: 'Error processing excel file', error: error.message });
  }
};

module.exports = {
  processExcel
};
