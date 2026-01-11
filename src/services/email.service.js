const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Uneeya Handicraft" <${process.env.EMAIL_USER}>`,
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
