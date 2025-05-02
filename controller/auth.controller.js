const User = require('../model/user.model');
const bcrypt = require('bcryptjs');
const Mailer = require('../helper/mailer'); 
const jwt = require('jsonwebtoken');

class AuthController {
  // Register
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        otp: Math.floor(100000 + Math.random() * 900000), // Generate a random 6-digit OTP
      });
      const mailer = new Mailer('Gmail', process.env.APP_EMAIL, process.env.APP_PASSWORD);
             const mailObj = {
                 to: email,
                 subject: "Registration Confirmation",
                 text: `Hello! ${name}, You have successfully registered with us with this ${email} your OTP is ${user.otp}.`
             };

             mailer.sendMail(mailObj);
      return res.status(201).json({
        message: 'User registered successfully please check your email for OTP and validate it',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  async validateOtp(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        await User.updateOne( {email},  { otp: null }  ); // clear OTP

        const mailer = new Mailer('Gmail', process.env.APP_EMAIL, process.env.APP_PASSWORD);

        const mailObj = {
            to: email,
            subject: "Registration Confirmed!",
            text: `Congratulations ${user.name}, You have successfully registered with us with this ${email}.`
        };

        mailer.sendMail(mailObj);

        return res.status(200).json({ message: "OTP validated successfully" });
    } catch (err) {
        console.error("Error during OTP validation:", err);
        res.status(500).json({ message: "Server error.", error: err.message });
    }
}
  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      if (user.otp) {
        return res.status(400).json({ message: 'Please validate your OTP first' });
      }
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = user.generateToken();

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  async forgetPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      const link = `${process.env.LOCAL_PORT_URL}/reset-password/${token}`;
      const mailer = new Mailer('Gmail', process.env.APP_EMAIL, process.env.APP_PASSWORD);
      const mailerObj = {
        to: email,
        subject: "Password Reset",
        text: `Hello ${user.name},
      
      Click the link below to reset your password:
      ${link}
      
      This link will expire in 1 hour.
      
      If you did not request a password reset, please ignore this email.
      
      Thank you!
      Best regards,
      Team XYZ
      
      This is an automatically generated email. Please do not reply to this email.
      © 2025 Team Papai. All rights reserved.
      Powered by Papai | Version 1.0`,
        html: `
          <p>Hello ${user.name},</p>
          <p>Click the link below to reset your password:</p>
          <p>
            <a href="${link}" style="
              display: inline-block;
              padding: 10px 20px;
              background-color: #007BFF;
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
            ">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <br>
          <p>Thank you!</p>
          <p>Best regards,</p>
          <p>Team XYZ</p>
          <hr>
          <p style="font-size: 12px; color: #888;">
            This is an automatically generated email. Please do not reply to this email.
          </p>
          <p style="font-size: 12px; color: #888;">
            © 2025 Team Papai. All rights reserved.
          </p>
          <p style="font-size: 12px; color: #888;">
            Powered by Papai | Version 1.0
          </p>
        `,
      };
      mailer.sendMail(mailerObj);
      return res.status(200).json({ message: "Email for Reset Password sent" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server Error", error: error.message });
    }
  }

 
async updatePassword(req, res) {
  try {
    const userId = req.user.id; // Assuming you have middleware to set req.user
    const { currentPassword, newPassword } = req.body;
    // Get user from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if old password matches
    const isMatch = bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.updateOne({ _id: userId }, { password: hashedNewPassword });

    return res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) return res.status(404).json({ message: "User not found" });

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await User.updateOne({ _id: user._id }, { password: hashedPassword });

      return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
}

module.exports = new AuthController();
