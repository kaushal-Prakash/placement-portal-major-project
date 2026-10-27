import express from 'express';
import Feedback from '../models/Feedback.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/feedback
 * @desc Submit interview feedback (for placed seniors/students with mandatory LinkedIn)
 * @access Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { 
      company, 
      jobTitle, 
      linkedinUrl, 
      phone, 
      email, 
      interviewQuestions, 
      rounds, 
      advice, 
      rating, 
      batch, 
      ctc 
    } = req.body;
    
    // Mandatory LinkedIn URL validation
    if (!linkedinUrl || !linkedinUrl.trim()) {
      return res.status(400).json({ message: 'LinkedIn profile URL is mandatory.' });
    }

    const cleanLinkedin = linkedinUrl.trim();
    if (!cleanLinkedin.toLowerCase().includes('linkedin.com/')) {
      return res.status(400).json({ message: 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username).' });
    }

    if (!company || !company.trim()) {
      return res.status(400).json({ message: 'Company name is required.' });
    }

    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({ message: 'Job title / role is required.' });
    }

    const User = (await import('../models/User.js')).default;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    if (!currentUser.isPlaced && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only placed students or alumni can submit interview experiences.' });
    }

    const formattedQuestions = Array.isArray(interviewQuestions)
      ? interviewQuestions
      : (typeof interviewQuestions === 'string' 
          ? interviewQuestions.split('\n').map(q => q.trim()).filter(Boolean) 
          : []);

    const newFeedback = new Feedback({
      user: req.user.id,
      authorName: currentUser.name,
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      linkedinUrl: cleanLinkedin,
      phone: phone ? phone.trim() : undefined,
      email: email ? email.trim() : undefined,
      interviewQuestions: formattedQuestions,
      rounds: Array.isArray(rounds) ? rounds : [],
      advice: advice ? advice.trim() : '',
      rating: rating || 3,
      batch: batch || (currentUser.batch ? currentUser.batch.year : '2025'),
      ctc: ctc || (currentUser.currentCTC || undefined),
      verifiedAlumni: true
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
 * @access Public (all students and prospective candidates can read alumni insights)
 */
router.get('/', async (req, res) => {
  try {
    const { company, search } = req.query;
    let filter = {};

    if (company) {
      filter.company = new RegExp(company, 'i');
    }

    if (search) {
      filter.$or = [
        { company: new RegExp(search, 'i') },
        { jobTitle: new RegExp(search, 'i') },
        { authorName: new RegExp(search, 'i') },
        { advice: new RegExp(search, 'i') },
        { interviewQuestions: new RegExp(search, 'i') }
      ];
    }
    
    const feedbacks = await Feedback.find(filter)
      .populate('user', 'name branch batch')
      .sort({ createdAt: -1 });
      
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
