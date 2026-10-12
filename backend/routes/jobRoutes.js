import express from 'express';
import Job from '../models/Job.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all jobs (public/student)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' })
      .populate('company')
      .populate('allowedBranches')
      .populate('allowedBatches')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET smart feed jobs sorted by match score
router.get('/smart-feed', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' })
      .populate('company')
      .populate('allowedBranches')
      .populate('allowedBatches')
      .lean(); // Use lean to add matchScore later

    // Ensure we fetch the user's resumeUrl
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    
    if (!user || !user.resumeUrl) {
      // Fallback to normal if no resume uploaded
      return res.json(jobs.sort((a, b) => b.createdAt - a.createdAt));
    }

    const fs = await import('fs');
    const path = await import('path');
    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('form-data')).default;

    const { getResumeFilePath } = await import('../utils/resumeHelper.js');
    const filePath = getResumeFilePath(user.resumeUrl);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.json(jobs.sort((a, b) => b.createdAt - a.createdAt));
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    // 1. Parse PDF
    const parseRes = await fetch('http://localhost:8000/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    
    if (!parseRes.ok) {
       return res.json(jobs.sort((a, b) => b.createdAt - a.createdAt));
    }
    
    const parseData = await parseRes.json();
    const resumeText = parseData.parsed_text;

    // 2. Bulk Match
    const jobDescriptions = jobs.map(j => j.description + ' ' + (j.requirements || j.requiredSkills || []).join(' '));
    const matchReq = await fetch('http://localhost:8000/api/bulk-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: resumeText,
        job_descriptions: jobDescriptions
      })
    });

    if (!matchReq.ok) {
       return res.json(jobs.sort((a, b) => b.createdAt - a.createdAt));
    }

    const matchData = await matchReq.json();
    const scores = matchData.match_scores;

    // Attach scores to jobs and sort
    const scoredJobs = jobs.map((job, index) => ({
      ...job,
      matchScore: scores[index]
    }));

    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
    res.json(scoredJobs);

  } catch (error) {
    console.error('Smart feed error:', error);
    // Fallback to basic list on error
    const fallbackJobs = await Job.find({ status: 'open' })
      .populate('company')
      .populate('allowedBranches')
      .populate('allowedBatches')
      .sort({ createdAt: -1 });
    res.json(fallbackJobs);
  }
});


// POST a new job (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    let { 
      title, 
      company, 
      description, 
      requiredCgpa, 
      requiredSkills, 
      driveLink,
      ctc,
      maxBacklogs,
      allowedBranches,
      allowedBatches
    } = req.body;
    
    // Find or create company if company name is passed
    const mongoose = (await import('mongoose')).default;
    let companyDoc = await mongoose.model('Company').findOne({ name: company });
    if (!companyDoc) {
      companyDoc = await mongoose.model('Company').create({ name: company });
    }

    const newJob = new Job({
      title,
      company: companyDoc._id,
      description,
      minCgpa: parseFloat(requiredCgpa) || 0,
      requirements: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : []),
      driveLink,
      ctc: parseFloat(ctc) || 0,
      maxBacklogs: parseInt(maxBacklogs) || 0,
      allowedBranches: allowedBranches || [],
      allowedBatches: allowedBatches || []
    });

    await newJob.save();
    const populatedJob = await Job.findById(newJob._id)
      .populate('company')
      .populate('allowedBranches')
      .populate('allowedBatches');
    res.status(201).json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
