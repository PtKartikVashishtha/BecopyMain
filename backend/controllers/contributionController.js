// const Program = require('../models/programModel');
const Contribution = require('../models/contributionModel');
const Contributor = require('../models/contributorModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { emitToAdmins } = require('../utils/socketManager');

// Get all contributions (programs)
exports.getAllContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ isVisible: true });
    res.status(200).json({
      success: true,
      count: contributions.length,
      data: contributions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getSavedContributions = async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findOne({ _id });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials(user not found)'
      });
    }
    let savedContributions = [];

    if (user.userType === "user") {
      // Find contributor and their saved contributions using aggregation
      const contributorWithContributions = await Contributor.aggregate([
        // Match the contributor by userId
        { $match: { userId: user._id } },
        // Lookup contributions
        {
          $lookup: {
            from: 'contributions',
            localField: 'contributions',
            foreignField: '_id',
            as: 'contributionDetails'
          }
        },
        // Unwind the contributions array
        { $unwind: '$contributionDetails' },
        // Match only saved contributions
        {
          $match: {
            'contributionDetails.status': 'saved'
          }
        },
        // Group back to get array of saved contributions
        {
          $group: {
            _id: '$_id',
            savedContributions: { $push: '$contributionDetails' }
          }
        }
      ]);

      if (contributorWithContributions.length > 0) {
        savedContributions = contributorWithContributions[0].savedContributions;
      }
    }
    console.log(savedContributions);
    res.status(200).json({
      success: true,
      data: savedContributions
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Get single contribution
exports.getContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id)
      .populate('programId', 'name')
      .populate('submittedBy', 'name');

    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new contribution
exports.createContribution = async (req, res) => {
  try {
    const contributor = await Contributor.findOne({ email: req.body.useremail });
    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: 'Contributor not found'
      });
    }

    // First check if contribution exists for this program and contributor
    let contribution = await Contribution.findOne({
      programId: req.body.programId,
      submittedBy: contributor._id
    });

    if (contribution) {
      // Update existing contribution
      contribution = await Contribution.findByIdAndUpdate(
        contribution._id,
        {
          code: {
            java: req.body.code.javacode,
            python: req.body.code.pythoncode,
            html: req.body.code.htmlcode
          },
          description: req.body.description,
          type: req.body.type,
          status: req.body.status,
          updatedAt: Date.now()
        },
        { new: true }
      );

      // Emit notification for update
      emitToAdmins('update-contribution', {
        id: contribution.id,
        type: contribution.type,
        useremail: req.body.useremail,
        message: `Updated ${contribution.type} contribution from ${req.body.useremail}`
      });

    } else {
      // Create new contribution
      contribution = await new Contribution({
        code: {
          java: req.body.code.javacode,
          python: req.body.code.pythoncode,
          html: req.body.code.htmlcode
        },
        description: req.body.description,
        type: req.body.type,
        status: req.body.status,
        programId: req.body.programId,
        submittedBy: contributor._id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }).save();

      // Update contributor's contributions array using aggregation
      await Contributor.aggregate([
        {
          $match: {
            _id: contributor._id
          }
        },
        {
          $addFields: {
            contributions: {
              $concatArrays: [
                { $ifNull: ['$contributions', []] },
                [contribution._id]
              ]
            }
          }
        },
        {
          $merge: {
            into: 'contributors',
            on: '_id',
            whenMatched: 'replace',
            whenNotMatched: 'discard'
          }
        }
      ]);

      // Emit notification for new contribution
      emitToAdmins('new-contribution', {
        id: contribution.id,
        type: contribution.type,
        useremail: req.body.useremail,
        message: `New ${contribution.type} contribution from ${req.body.useremail}`
      });
    }

    res.status(201).json({
      success: true,
      data: contribution,
      isNew: !contribution
    });

  } catch (error) {
    console.error('Create/Update contribution error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update contribution
exports.updateContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contribution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete contribution
exports.deleteContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndUpdate(
      req.body.id,
      {
        isVisible: false,
      },
      { new: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contribution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update contribution status
exports.updateContributionStatus = async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contribution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.acceptContribution = async (req, res) => {
  try {
    await Contribution.findByIdAndUpdate(
      req.body.id,
      {
        status: 'approved',
        updatedAt: Date.now()
      },
      { new: true }
    ).then((contribution) => {
      res.status(200).json({
        success: true,
        data: contribution
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.rejectContribution = async (req, res) => {
  try {
    await Contribution.findByIdAndUpdate(
      req.body.id,
      {
        status: 'rejected',
        updatedAt: Date.now()
      },
      { new: true }
    ).then((contribution) => {
      res.status(200).json({
        success: true,
        data: contribution
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.fetchStatus = async (req, res) => {
  try {
    const item = await Contribution.findById(req.body.id);
    console.log(item);
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

exports.togglePinnedContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findById({
      _id: req.params.id
    });
    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: 'Contribution not found'
      });
    }

    // Toggle the pinned status
    contribution.isPinned = !contribution.isPinned;
    await contribution.save();

    res.status(200).json({
      success: true,
      data: contribution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}