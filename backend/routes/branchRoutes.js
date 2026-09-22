import express from 'express';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/branches
 * @desc Get all branches
 * @access Private/Admin
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/branches
 * @desc Create a new branch
 * @access Private/Admin
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, code } = req.body;
    const branch = new Branch({ name, code });
    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/branches/:id/students
 * @desc Get all students for a branch
 * @access Private/Admin
 */
router.get('/:id/students', protect, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ branch: req.params.id, role: 'student' }).populate('batch');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/branches/:id
 * @desc Get single branch details
 * @access Private/Admin
 */
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
