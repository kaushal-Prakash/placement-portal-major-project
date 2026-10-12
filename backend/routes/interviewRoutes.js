import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import InterviewSlot from '../models/InterviewSlot.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/interviews/schedule/:jobId
 * @desc Auto-schedule interviews for a specific job for all 'Shortlisted' candidates
 * @access Private/Admin
 */
router.post('/schedule/:jobId', protect, adminOnly, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { startDate, startTime, interviewDurationMinutes = 30, breaksBetweenMinutes = 5 } = req.body;

    // Validate inputs
    if (!startDate || !startTime) {
      return res.status(400).json({ message: 'startDate and startTime are required.' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Find shortlisted applications for this job
    const applications = await Application.find({ 
      job: jobId, 
      status: { $in: ['shortlisted', 'Shortlisted'] } 
    }).populate('user');
    if (applications.length === 0) {
      return res.status(400).json({ message: 'No shortlisted candidates found to schedule. Please shortlist candidates first.' });
    }

    // Schedule logic
    let currentStart = new Date(`${startDate}T${startTime}:00Z`); // Assuming UTC for simplicity
    let createdSlots = [];

    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      const currentEnd = new Date(currentStart.getTime() + interviewDurationMinutes * 60000);

      const slot = new InterviewSlot({
        job: jobId,
        candidate: app.user._id,
        startTime: currentStart,
        endTime: currentEnd,
        interviewer: 'Assigned Panel'
      });

      await slot.save();
      createdSlots.push(slot);

      // Update application status to interviewing
      app.status = 'interviewing';
      await app.save();

      // Move currentStart to next available slot (including break)
      currentStart = new Date(currentEnd.getTime() + breaksBetweenMinutes * 60000);
    }

    res.status(201).json({ message: `Successfully scheduled ${createdSlots.length} interviews`, slots: createdSlots });
  } catch (error) {
    console.error("Scheduling error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/interviews/:jobId
 * @desc Get all interview slots for a job
 * @access Private/Admin
 */
router.get('/:jobId', protect, adminOnly, async (req, res) => {
  try {
    const slots = await InterviewSlot.find({ job: req.params.jobId }).populate('candidate', 'name email');
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/interviews/student/my-slots
 * @desc Get all interview slots for the logged in student
 * @access Private
 */
router.get('/student/my-slots', protect, async (req, res) => {
  try {
    const slots = await InterviewSlot.find({ candidate: req.user.id }).populate('job', 'title company');
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
