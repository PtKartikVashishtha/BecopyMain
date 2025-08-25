// Replace "Model" with your actual model name
const Setting = require('../models/settingsModel');

exports.updateSettings = async (req, res) => {
  console.log('settings data',req.body)
  try {
    let oldSettings = await Setting.findOne({ by: 'admin' })
    if (oldSettings !== null) {
      let settings = await Setting.findOneAndUpdate({ by: 'admin' }, { ...req.body }, { new: true })

      if (settings) {
        return res.status(200).json(settings)
      }

    } else {
      let newSetting = await Setting.create({
        ...req.body
      })

      if (newSetting) {
        let getNewSetting = await Setting.findOne({ by: 'admin' })

        return res.status(200).json(getNewSetting)
      }

    }

    return res.status(400).json({ message: 'No Settings Found' })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal Server Error' })

  }
}

exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ by: 'admin' })
    return res.status(200).json(settings)
  } catch (error) {

    res.status(500).json({message: 'Internal Server Error'})

    console.log(error)
  }
}

// Create