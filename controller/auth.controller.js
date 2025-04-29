const User = require('../model/user.model');
const bcrypt = require('bcryptjs');
const Mailer = require('../helper/mailer'); 

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
}

module.exports = new AuthController();
