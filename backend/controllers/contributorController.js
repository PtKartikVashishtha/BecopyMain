// Replace "Model" with your actual model name
const Model = require('../models/contributorModel');

// Create
exports.create = async (req, res) => {
  try {
    const newItem = await Model.create(req.body);
    console.log(newItem);
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

const Contributor = require('../models/contributorModel');

exports.getAllContributors = async (req, res) => {
  try {
    const contributors = await Contributor.find({ isDeleted: false })
      .sort('-contributions');

    res.status(200).json({
      success: true,
      count: contributors.length,
      data: contributors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getContributor = async (req, res) => {
  try {
    const contributor = await Contributor.findById(req.params.id);
    if (!contributor) {
      return res.status(404).json({
        success: false,
        message: 'Contributor not found'
      });
    }
    res.status(200).json({
      success: true,
      data: contributor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateContributor = async (req, res) => {
  try {
    const contributor = await Contributor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!contributor) {
      return res.status(404).json({
        success: false,
        message: 'Contributor not found'
      });
    }
    res.status(200).json({
      success: true,
      data: contributor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteContributor = async (req, res) => {
  try {
    const contributor = await Contributor.findByIdAndDelete(req.params.id);
    if (!contributor) {
      return res.status(404).json({
        success: false,
        message: 'Contributor not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Contributor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createContributor = async (req, res) => {
  try {
    const newContributor = await Contributor.create(req.body);
    res.status(201).json({
      success: true,
      data: newContributor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.togglePinned = async (req, res) =>{
  try {
    const contributor = await Contributor.findById({
      _id: req.params.id
    });
    if (!contributor) {
      return res.status(404).json({
        success: false,
        message: 'Contributor not found'
      });
    }
    contributor.isPinned = !contributor.isPinned;
    await contributor.save();
    res.status(200).json({
      success: true,
      data: contributor,
      message: `Contributor is now ${contributor.isPinned ? 'pinned' : 'unpinned'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } 
}

