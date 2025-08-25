const mongoose = require("mongoose");

const dbConnect = () => {
  // Add error handling for missing DATABASE_URL
  require('dotenv').config();
  const databaseUrl = process.env.DATABASE_URL;
  mongoose.connect(databaseUrl)
    .then(() => {
      console.log(`Database Connected Successfully on\n+${mongoose.connection.host}`)

      // Program.updateMany({
      //   isActive: true 
      // }, {
      //   status: 'approved'
      // }).then((data) => {
      //   console.log('data',data)
      // }).catch(e => {
      //   console.log('upate fail', e)
      // })
    
    
    
    }).catch((error) => {
      console.log("Database Connection Error");
      console.error(error.message);
      process.exit(1);
    })
}

module.exports = dbConnect;