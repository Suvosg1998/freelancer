const Job = require('../model/job.model'); // Import Job model
const Bid = require('../model/bid.model'); // Import Bid model
const User = require('../model/user.model');
const bcrypt = require('bcryptjs');
const Mailer = require('../helper/mailer'); 
const jwt = require('jsonwebtoken');

class AuthController {
  // Register
async register(req, res) {
  try {
    const { name, email, password, role,country } = req.body;
    const photo = req.file ? `https://freelancer-npou.onrender.com/uploads/${req.file.filename}` : null;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with OTP and expiration time
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit OTP
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Set expiration time to 5 minutes from now

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      photo,
      country,
      otpExpiresAt,
    });

    const mailer = new Mailer('Gmail', process.env.APP_EMAIL, process.env.APP_PASSWORD);
    const mailObj = {
      to: email,
      subject: "Registration Confirmation",
      text: `Hello! ${name}, You have successfully registered with us. Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    mailer.sendMail(mailObj);

    return res.status(201).json({
      message: 'User registered successfully. Please check your email for OTP and validate it.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        country:user.country,
        photo:user.photo
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Resend OTP
async resendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new OTP and expiration time
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Set expiration time to 5 minutes from now

    await User.updateOne({ email }, { otp, otpExpiresAt });

    const mailer = new Mailer('Gmail', process.env.APP_EMAIL, process.env.APP_PASSWORD);
    const mailObj = {
      to: email,
      subject: "Resend OTP",
      text: `Hello! ${user.name}, Your new OTP is ${otp}. It will expire in 5 minutes.`,
    };

    mailer.sendMail(mailObj);

    return res.status(200).json({ message: "OTP resent successfully. Please check your email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Validate OTP
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

    // Check if OTP is valid and not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Clear OTP and expiration time after successful validation
    await User.updateOne({ email }, { otp: null, otpExpiresAt: null });

    const mailer = new Mailer('Gmail', process.env.APP_EMAIL, process.env.APP_PASSWORD);
    const mailObj = {
      to: email,
      subject: "Registration Confirmed!",
      text: `Congratulations ${user.name}, You have successfully registered with us.`,
    };

    mailer.sendMail(mailObj);

    return res.status(200).json({ message: "OTP validated successfully" });
  } catch (err) {
    console.error("Error during OTP validation:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
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
          country: user.country,
          photo: user.photo
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
      Team freelancer
      
      This is an automatically generated email. Please do not reply to this email.
      © 2025 Team freelancer. All rights reserved.
      Powered by freelancer | Version 1.0`,
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
          <p>Team freelancer</p>
          <hr>
          <p style="font-size: 12px; color: #888;">
            This is an automatically generated email. Please do not reply to this email.
          </p>
          <p style="font-size: 12px; color: #888;">
            © 2025 Team freelancer. All rights reserved.
          </p>
          <p style="font-size: 12px; color: #888;">
            Powered by freelancer | Version 1.0
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIXED: Await the password comparison
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
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
  async getDashboard(req, res) {
  try {
    const userId = req.user.id; // Assuming `authMiddleware` sets `req.user`

    // Fetch user details
    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const dashboardData = {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          country: user.country,
          photo: user.photo,
        },
        Job,
        Bid,
      };
    if (user.role === 'client') {
      // Fetch jobs posted by the client
      const jobs = await Job.find({ client: userId });
      dashboardData.Job = jobs;
    } else if (user.role === 'freelancer') {
      // Fetch bids placed by the freelancer
      const bids = await Bid.find({ freelancer: userId });
      dashboardData.Bid = bids;
    }
    // Return dashboard data
    return res.status(200).json({
      message: "Dashboard data fetched successfully",
      dashboard: dashboardData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, email, country } = req.body;
    const photo = req.file;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      user.email = email;
    }

    if (country) user.country = country;
    if (photo && photo.path) user.photo = photo.path;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        country: user.country,
        photo: user.photo,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
}
module.exports = new AuthController();
