const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

const sendTheaterApprovalEmail = async (toEmail, managerName, password) => {
    const mailOptions = {
        from: `"Movie Booking" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your Theater Has Been Approved!",
        html: `
            <h3>Hello ${managerName},</h3>
            <p>Your theater has been successfully approved.</p>
            <p><strong>Login Credentials:</strong></p>
            <ul>
              <li>Email: ${toEmail}</li>
              <li>Password: ${password}</li>
            </ul>
            <p>Please login and change your password immediately.</p>
            <br>
            <p>Thanks,<br>Movie Booking Team</p>
        `
    }

    await transporter.sendMail(mailOptions)
}

module.exports = {
    sendTheaterApprovalEmail
}
