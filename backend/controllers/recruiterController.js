// Replace "Model" with your actual model name
const Model = require('../models/recruiterModel');

// Create
exports.create = async (req, res) => {
  try {
    const newItem = await Model.create(req.body);
    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Read (Get All)
exports.getAll = async (req, res) => {
  try {
    const items = await Model.find();
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Read (Get One)
exports.getOne = async (req, res) => {
  try {
    const item = await Model.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update
exports.update = async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.delete = async (req, res) => {
  try {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const Recruiter = require('../models/recruiterModel');

// Get all recruiters
exports.getAllRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.find({ isDeleted: false })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: recruiters.length,
      data: recruiters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single recruiter
exports.getRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.params.id);

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        error: 'Recruiter not found'
      });
    }

    res.status(200).json({
      success: true,
      data: recruiter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new recruiter
exports.createRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.create({
      ...req.body,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    res.status(201).json({
      success: true,
      data: recruiter
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update recruiter
exports.updateRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        error: 'Recruiter not found'
      });
    }

    res.status(200).json({
      success: true,
      data: recruiter
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete recruiter
exports.deleteRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: Date.now()
      },
      { new: true }
    );

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        error: 'Recruiter not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

//toggle recruiter pinned status
exports.toggleRecruiterPinned = async (req, res) => {
  try {
    console.log('Toggling recruiter pinned status for ID:', req.params.id);
    const recruiter = await Recruiter.findById({
      _id: req.params.id,
      
    });
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    recruiter.isPinned = !recruiter?.isPinned;
    await recruiter.save();

    res.status(200).json({
      success: true,
      data: recruiter,
      message: 'Recruiter pinned status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};