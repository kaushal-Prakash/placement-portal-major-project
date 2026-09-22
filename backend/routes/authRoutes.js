import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Secret key for JWT signing
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

/**
 * @route POST /api/auth/admin/users
 * @desc Create a new user (Student or Admin) - Admin Only
 * @access Private/Admin
 */
import { protect, adminOnly } from '../middleware/authMiddleware.js';

router.post('/admin/users', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, cgpa } = req.body;
    
    // Check if user already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash the password for secure storage
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user document
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || 'student', 
      cgpa 
    });
    
    // Save the user to the database
    await newUser.save();

    // Do NOT return a JWT token since the admin is the one creating it, just return success
    res.status(201).json({ message: 'User created successfully', user: { id: newUser._id, name, email, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT token on successful login
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Return the token and user data
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role, resumeUrl: user.resumeUrl, cgpa: user.cgpa } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
