import express from 'express';
import Feedback from '../models/Feedback.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/feedback
 * @desc Submit interview feedback (only for placed students)
 * @access Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { company, jobTitle, interviewQuestions, advice, rating } = req.body;
    
    const User = (await import('../models/User.js')).default;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    if (!currentUser.isPlaced && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only placed students can submit feedback.' });
    }

    const newFeedback = new Feedback({
      user: req.user.id,
      company,
      jobTitle,
      interviewQuestions,
      advice,
      rating
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/feedback
 * @desc Get all feedback or filter by company
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { company } = req.query;
    const filter = company ? { company: new RegExp(company, 'i') } : {};
    
    const feedbacks = await Feedback.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 });
      
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
