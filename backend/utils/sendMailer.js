const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   secure: false,
//   auth: {
//     user: 'felixrhodes1212@gmail.com',
//     pass: '!@#QWE123qwe'
//   }
// })



const transporter = nodemailer.createTransport({
  host: 'lexidome.com',
  port: 465,
  secure: true,
  auth: {
    user: 'ikram@lexidome.com',
    pass: 'Ikram123@'
  },
  tls: {
    rejectUnauthorized: false // ⚠️ Ignores invalid/expired cert
  }
});

// transporter.sendMail({
//   from: 'ikram@lexidome.com',
//   to: 'mdikram295@gmail.com',
//   subject: 'Test email',
//   html: '<p>Test Message 5</p>'
// }).then(data => {
//   console.log('Success:', data);
// }).catch(err => {
//   console.error('Error:', err);
// });




module.exports = transporter;