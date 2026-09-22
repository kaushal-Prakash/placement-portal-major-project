import express from 'express';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch'; // May need to install node-fetch or use native fetch if Node >= 18
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { evaluateApplicationRules } from '../utils/rulesEngine.js';

const router = express.Router();

/**
 * @route POST /api/applications/:jobId
 * @desc Apply for a job and calculate AI match score
 * @access Private (Student only)
 */
router.post('/:jobId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply' });
    }

    const { jobId } = req.params;
    const userId = req.user.id;

    // 1. Check if application already exists
    const existingApp = await Application.findOne({ user: userId, job: jobId });
    if (existingApp) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // 2. Get Job and User details
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = await User.findById(userId);
    if (!user.resumeUrl) {
      return res.status(400).json({ message: 'Please upload a resume first' });
    }

    // Evaluate against campus policies
    const ruleEvaluation = evaluateApplicationRules(user, job);
    if (!ruleEvaluation.allowed) {
      return res.status(403).json({ message: ruleEvaluation.reason });
    }

    if (user.isBlacklisted) {
      return res.status(403).json({ message: 'You are blacklisted from applying to jobs.' });
    }

    // 3. Connect to AI Microservice for parsing and matching
    let matchScore = null;

    let aiFeedback = "AI matching failed.";

    try {
      // The resume path relative to the backend root
      // e.g. /uploads/1628192837-resume.pdf -> uploads/1628192837-resume.pdf
      const filePath = path.join(process.cwd(), user.resumeUrl);

      // Parse PDF using FastAPI
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const parseRes = await fetch('http://localhost:8000/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!parseRes.ok) throw new Error('Failed to parse PDF');
      
      const parseData = await parseRes.json();
      const resumeText = parseData.parsed_text;

      // Get Match Score using FastAPI
      const matchReq = await fetch('http://localhost:8000/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: job.description + ' ' + job.requiredSkills.join(' ')
        })
      });

      if (matchReq.ok) {
        const matchData = await matchReq.json();
        matchScore = matchData.match_score;
        aiFeedback = "Successfully matched using AI";
      }

    } catch (aiError) {
      console.error('AI Error:', aiError);
      // Fallback to manual review if AI fails
    }

    // 4. Save Application
    const newApplication = new Application({
      user: userId,
      job: jobId,
      matchScore: matchScore,
      aiFeedback: aiFeedback
    });

    await newApplication.save();
    res.status(201).json({ message: 'Application submitted successfully', matchScore });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/applications/job/:jobId
 * @desc Get all applications for a specific job
 * @access Private (Admin only)
 */
router.get('/job/:jobId', protect, adminOnly, async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('user', 'name email cgpa resumeUrl')
      .sort({ matchScore: -1 }); // Sort by highest score first
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/applications/my
 * @desc Get my applications
 * @access Private (Student only)
 */
router.get('/my', protect, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate('job', 'title company');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/applications/:id/status
 * @desc Update application status
 * @access Private (Admin only)
 */
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // If placed, update user's isPlaced status
    if (status === 'placed') {
      const user = await User.findById(application.user);
      user.isPlaced = true;
      user.placedJob = application.job;
      await user.save();
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
