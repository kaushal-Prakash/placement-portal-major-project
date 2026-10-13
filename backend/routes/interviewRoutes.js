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

      // Check and resolve candidate scheduling conflicts across all companies (Feature 8)
      let conflict = await InterviewSlot.findOne({
        candidate: app.user._id,
        $or: [
          { startTime: { $lt: currentEnd, $gte: currentStart } },
          { endTime: { $gt: currentStart, $lte: currentEnd } }
        ]
      });

      while (conflict) {
        // Shift start time by interview duration plus break if conflict found
        currentStart = new Date(currentEnd.getTime() + breaksBetweenMinutes * 60000);
        currentEnd = new Date(currentStart.getTime() + interviewDurationMinutes * 60000);
        conflict = await InterviewSlot.findOne({
          candidate: app.user._id,
          $or: [
            { startTime: { $lt: currentEnd, $gte: currentStart } },
            { endTime: { $gt: currentStart, $lte: currentEnd } }
          ]
        });
      }

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

      // Trigger Resend email notification
      import('../utils/emailService.js').then(({ triggerInterviewScheduledEmail }) => {
        triggerInterviewScheduledEmail(app.user, job, slot).catch(e => console.error('[Resend Slot Error]:', e));
      });

      // Move currentStart to next available slot (including break)
      currentStart = new Date(currentEnd.getTime() + breaksBetweenMinutes * 60000);
    }

    res.status(201).json({ message: `Successfully scheduled ${createdSlots.length} interviews without conflicts`, slots: createdSlots });
  } catch (error) {
    console.error("Scheduling error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/interviews/:jobId
 * @desc Get all interview slots for a job with full candidate and branch details
 * @access Private/Admin
 */
router.get('/:jobId', protect, adminOnly, async (req, res) => {
  try {
    const slots = await InterviewSlot.find({ job: req.params.jobId })
      .populate({
        path: 'candidate',
        select: 'name email usn branch cgpa phone activeBacklogs',
        populate: { path: 'branch', select: 'name code' }
      })
      .sort({ startTime: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/interviews/slot/:slotId
 * @desc Update an interview slot status or panel details
 * @access Private/Admin
 */
router.put('/slot/:slotId', protect, adminOnly, async (req, res) => {
  try {
    const { status, interviewer, startTime, endTime } = req.body;
    const slot = await InterviewSlot.findById(req.params.slotId);
    if (!slot) return res.status(404).json({ message: 'Interview slot not found' });

    if (status) slot.status = status;
    if (interviewer !== undefined) slot.interviewer = interviewer;
    if (startTime) slot.startTime = new Date(startTime);
    if (endTime) slot.endTime = new Date(endTime);

    await slot.save();
    const populated = await InterviewSlot.findById(slot._id).populate({
      path: 'candidate',
      select: 'name email usn branch cgpa phone activeBacklogs',
      populate: { path: 'branch', select: 'name code' }
    });
    res.json({ message: 'Slot updated successfully', slot: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route DELETE /api/interviews/slot/:slotId
 * @desc Remove/cancel an interview slot
 * @access Private/Admin
 */
router.delete('/slot/:slotId', protect, adminOnly, async (req, res) => {
  try {
    const slot = await InterviewSlot.findByIdAndDelete(req.params.slotId);
    if (!slot) return res.status(404).json({ message: 'Interview slot not found' });
    res.json({ message: 'Interview slot deleted successfully' });
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
