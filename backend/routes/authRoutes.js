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
    const { name, email, password, role, cgpa, usn, branch, batch, tenthMarks, twelfthMarks, activeBacklogs, historyOfBacklogs } = req.body;
    
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
      cgpa,
      usn, branch, batch, tenthMarks, twelfthMarks, activeBacklogs, historyOfBacklogs
    });
    
    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: { id: newUser._id, name, email, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/auth/admin/users/bulk
 * @desc Bulk import students from roster (Excel/CSV upload) - Admin Only
 * @access Private/Admin
 */
router.post('/admin/users/bulk', protect, adminOnly, async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'students must be a non-empty array' });
    }

    const Branch = (await import('../models/Branch.js')).default;
    const Batch = (await import('../models/Batch.js')).default;

    const branches = await Branch.find();
    const batches = await Batch.find();

    const branchMap = {};
    branches.forEach(b => { branchMap[b.code.toUpperCase()] = b._id; });

    const batchMap = {};
    batches.forEach(b => { batchMap[String(b.year)] = b._id; });

    const defaultHashedPassword = await bcrypt.hash('student123', 10);
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of students) {
      if (!item.name || (!item.email && !item.usn)) continue;

      const usn = item.usn ? String(item.usn).trim().toUpperCase() : null;
      const email = item.email ? String(item.email).trim().toLowerCase() : `${usn.toLowerCase()}@college.edu`;
      
      let branchId = null;
      if (item.branch) {
        const bCode = String(item.branch).trim().toUpperCase();
        if (branchMap[bCode]) {
          branchId = branchMap[bCode];
        } else {
          const newB = await Branch.create({ code: bCode, name: `${bCode} Department` });
          branchMap[bCode] = newB._id;
          branchId = newB._id;
        }
      }

      let batchId = null;
      if (item.batch) {
        const bYear = String(item.batch).trim();
        if (batchMap[bYear]) {
          batchId = batchMap[bYear];
        } else {
          const newBatch = await Batch.create({ year: parseInt(bYear) || 2026, isActive: true });
          batchMap[bYear] = newBatch._id;
          batchId = newBatch._id;
        }
      }

      const cgpa = item.cgpa !== undefined && item.cgpa !== null ? parseFloat(item.cgpa) : 7.5;
      const tenth = item.tenthMarks !== undefined ? parseFloat(item.tenthMarks) : 85.0;
      const twelfth = item.twelfthMarks !== undefined ? parseFloat(item.twelfthMarks) : 82.0;
      const activeBacklogs = item.activeBacklogs !== undefined ? parseInt(item.activeBacklogs) : 0;
      const historyBacklogs = item.historyOfBacklogs !== undefined ? parseInt(item.historyOfBacklogs) : activeBacklogs;

      const rawSkills = item.skills || [];
      const skills = Array.isArray(rawSkills) ? rawSkills : String(rawSkills).split(',').map(s => s.trim()).filter(Boolean);

      const existing = await User.findOne({
        $or: [
          ...(usn ? [{ usn }] : []),
          { email }
        ]
      });

      if (!existing) {
        await User.create({
          name: item.name,
          email,
          usn,
          password: defaultHashedPassword,
          role: 'student',
          branch: branchId,
          batch: batchId,
          cgpa,
          tenthMarks: tenth,
          twelfthMarks: twelfth,
          activeBacklogs,
          historyOfBacklogs: historyBacklogs,
          skills: skills.length > 0 ? skills : ['Problem Solving', 'Data Structures'],
          isPlaced: false,
          isBlacklisted: false
        });
        createdCount++;
      } else {
        await User.findByIdAndUpdate(existing._id, {
          name: item.name,
          ...(branchId && { branch: branchId }),
          ...(batchId && { batch: batchId }),
          cgpa,
          tenthMarks: tenth,
          twelfthMarks: twelfth,
          activeBacklogs,
          historyOfBacklogs: historyBacklogs,
          ...(skills.length > 0 && { skills })
        });
        updatedCount++;
      }
    }

    res.json({
      message: `Bulk processing complete. Created: ${createdCount}, Updated: ${updatedCount}`,
      createdCount,
      updatedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error in bulk user creation', error: error.message });
  }
});


/**
 * @route PUT /api/auth/admin/users/:id
 * @desc Update a user (student) - Admin Only
 * @access Private/Admin
 */
router.put('/admin/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, cgpa, usn, branch, batch, tenthMarks, twelfthMarks, activeBacklogs, historyOfBacklogs, skills } = req.body;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Another user with this email already exists' });
      user.email = email;
    }

    if (name) user.name = name;
    if (usn !== undefined) user.usn = usn;
    if (branch) user.branch = branch;
    if (batch) user.batch = batch;
    if (cgpa !== undefined) user.cgpa = cgpa;
    if (tenthMarks !== undefined) user.tenthMarks = tenthMarks;
    if (twelfthMarks !== undefined) user.twelfthMarks = twelfthMarks;
    if (activeBacklogs !== undefined) user.activeBacklogs = activeBacklogs;
    if (historyOfBacklogs !== undefined) user.historyOfBacklogs = historyOfBacklogs;
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()).filter(Boolean);

    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: 'User updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/auth/admin/users/:id/blacklist
 * @desc Toggle blacklist status of a student
 * @access Private/Admin
 */
router.put('/admin/users/:id/blacklist', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'student') return res.status(400).json({ message: 'Can only blacklist students' });

    user.isBlacklisted = !user.isBlacklisted;
    await user.save();

    res.json({ message: `User ${user.isBlacklisted ? 'blacklisted' : 'whitelisted'} successfully`, isBlacklisted: user.isBlacklisted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update own profile - Students can edit skills only; academic records (CGPA, marks, backlogs) are admin-only
 * @access Private
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { skills } = req.body;

    // Students are permitted to update skills only
    if (skills !== undefined) {
      user.skills = Array.isArray(skills)
        ? skills
        : String(skills).split(',').map(s => s.trim()).filter(Boolean);
    }

    // Only admins can alter academic metrics (CGPA, backlogs, marks)
    if (req.user.role === 'admin') {
      const { cgpa, activeBacklogs, historyOfBacklogs, tenthMarks, twelfthMarks } = req.body;
      if (cgpa !== undefined) user.cgpa = cgpa;
      if (activeBacklogs !== undefined) user.activeBacklogs = activeBacklogs;
      if (historyOfBacklogs !== undefined) user.historyOfBacklogs = historyOfBacklogs;
      if (tenthMarks !== undefined) user.tenthMarks = tenthMarks;
      if (twelfthMarks !== undefined) user.twelfthMarks = twelfthMarks;
    }

    await user.save();
    await user.populate('branch batch');

    res.json({ 
      message: 'Profile updated successfully', 
      user: { 
        id: user._id, name: user.name, email: user.email, role: user.role, 
        cgpa: user.cgpa, resumeUrl: user.resumeUrl, skills: user.skills,
        activeBacklogs: user.activeBacklogs, historyOfBacklogs: user.historyOfBacklogs,
        tenthMarks: user.tenthMarks, twelfthMarks: user.twelfthMarks,
        branch: user.branch, batch: user.batch,
        isPlaced: user.isPlaced, isBlacklisted: user.isBlacklisted,
        currentCTC: user.currentCTC, usn: user.usn
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current logged-in user's full profile
 * @access Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('branch batch').select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
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
    const user = await User.findOne({ email }).populate('branch batch');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT token on successful login
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Return the token and full user data
    res.json({ 
      token, 
      user: { 
        id: user._id, name: user.name, email, role: user.role, 
        resumeUrl: user.resumeUrl, cgpa: user.cgpa, skills: user.skills,
        activeBacklogs: user.activeBacklogs, historyOfBacklogs: user.historyOfBacklogs,
        tenthMarks: user.tenthMarks, twelfthMarks: user.twelfthMarks,
        branch: user.branch, batch: user.batch,
        isPlaced: user.isPlaced, isBlacklisted: user.isBlacklisted,
        currentCTC: user.currentCTC, usn: user.usn
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
