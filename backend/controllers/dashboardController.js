const DashboardString = require('../models/dashboardStringModel');

exports.update = async (req, res) => {
  console.log("update Dashboard String", req.body);
  try {
    const dashString = req.body.dashboardString;
    const dashStrings = await DashboardString.find();
    if (dashStrings.length > 0) {
      DashboardString.findByIdAndUpdate(dashStrings[0]._id, { dashString }, { new: true }).then(
        updatedItem => {
          console.log(updatedItem);
          res.status(201).json({
            success: true,
            data: updatedItem,
          });
        }
      ).catch(error => {
        res.status(400).json({
          success: false,
          message: error.message
        });
      });
    } else {
      DashboardString.create({ dashString }).then(newItem => {
        res.status(201).json({
          success: true,
          data: newItem,
        });
      }).catch(error => {
        res.status(400).json({
          success: false,
          message: error.message
        });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Read (Get All)
exports.getAll = async (req, res) => {
  try {
    const items = await DashboardString.find();
    res.status(200).json({
      success: true,
      data: items[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};