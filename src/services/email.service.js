const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Uneeya Handicraft" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Kode Verifikasi Akun',
    html: `
      <h3>Verifikasi Email</h3>
      <p>Kode OTP Anda:</p>
      <h2>${otp}</h2>
      <p>Berlaku selama 5 menit.</p>
    `,
  });
};
