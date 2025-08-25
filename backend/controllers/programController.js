// Replace "Model" with your actual model name
const Model = require('../models/programModel');
const getFullCategoryName = require('../utils/getCategoryFullName');
// Create
exports.create = async (req, res) => {

 if(!req.body?.category) {
  req.body.category = '68219a9604312831e9844727'
 }

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

exports.getAll = async (req, res) => {
  try {

    let sendAll = req.query?.all == 'true' || false

    const filter = sendAll ? {} : { status: 'approved' };
    const items = await Model.find(filter);

    // Add categoryFullName to each item
    const itemsWithCategoryFullName = await Promise.all(
      items.map(async (item) => {
       
        const categoryFullName = await getFullCategoryName(item.category); // Assuming `item.category` contains the category ID
        return {
          ...item.toObject(), // Convert Mongoose document to plain object
          categoryFullName, // Add the full category name
        };
      })
    );


    res.status(200).json({
      success: true,
      count: itemsWithCategoryFullName.length,
      data: itemsWithCategoryFullName,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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

exports.copy = async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { copies: 1 }
      },
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
    console.log('copy success');
    res.status(200).json({
      success: true,
      message: 'Item copied successfully',
      item: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
exports.view = async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { views: 1 }
      },
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
    console.log('view success');
    res.status(200).json({
      success: true,
      message: 'Item viewed successfully',
      item: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
exports.share = async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { shares: 1 }
      },
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
    console.log('share success');
    res.status(200).json({
      success: true,
      message: 'Item shared successfully',
      item: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

exports.acceptProgram = async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.body.id,
      {
        $set: {
          isActive: true
        }
      },
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
      message: 'Item accepted successfully'
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

exports.rejectProgram = async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.body.id,
      {
        $set: {
          isActive: false
        }
      },
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
      message: 'Item rejected successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
exports.fetchStatus = async (req, res) => {
  try {
    const item = await Model.findById(req.body.id);
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
}

exports.togglePinnedProgram = async (req, res) => {
  try {
    const program = await Model.findById({
      _id: req.params.id
    });
    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }

    // Toggle the pinned status
    program.isPinned = !program.isPinned;
    await program.save();

    res.status(200).json({
      success: true,
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

exports.aproveProgram = async (req, res) => {
  try {
    let programId = req.query?.id || false

    console.log('approve', programId)
    const program = await Model.findById({
      _id: programId
    });
    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }

    // Toggle the pinned status
    program.status =  program.status === 'approved' ? 'pending' :  'approved' ;
    await program.save();

    res.status(200).json({
      success: true,
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}