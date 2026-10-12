import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import { protect } from '../middleware/authMiddleware.js';
import { getResumeFilePath } from '../utils/resumeHelper.js';

const router = express.Router();

/**
 * @route POST /api/copilot/mock-interview
 * @desc Conduct a mock interview
 * @access Private (Student only)
 */
router.post('/mock-interview', protect, async (req, res) => {
  try {
    const { jobId, chatHistory } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can use the mock interviewer' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = await User.findById(userId);
    if (!user.resumeUrl) {
      return res.status(400).json({ message: 'Please upload a resume first' });
    }

    // 1. Fetch Resume Text
    let resumeText = "";
    try {
      const filePath = getResumeFilePath(user.resumeUrl);
      if (filePath && fs.existsSync(filePath)) {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const parseRes = await fetch('http://localhost:8000/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        if (parseRes.ok) {
          const parseData = await parseRes.json();
          resumeText = parseData.parsed_text;
        }
      }
    } catch (e) {
      console.error("Resume parsing error in copilot", e);
    }

    // 2. Fetch Historical Questions for this company
    const feedbacks = await Feedback.find({ company: new RegExp(job.company, 'i') });
    let historicalQuestions = [];
    feedbacks.forEach(fb => {
      historicalQuestions.push(...fb.interviewQuestions);
    });
    // Limit to recent 20 unique questions to avoid context overflow
    historicalQuestions = [...new Set(historicalQuestions)].slice(0, 20);

    // 3. Call AI Microservice
    const aiReqBody = {
      resume_text: resumeText,
      job_description: job.description + ' ' + job.requiredSkills.join(' '),
      historical_questions: historicalQuestions,
      chat_history: chatHistory || []
    };

    const aiRes = await fetch('http://localhost:8000/api/copilot/mock-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiReqBody)
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      return res.status(500).json({ message: 'AI Service Error', details: errorText });
    }

    const aiData = await aiRes.json();
    res.json({ reply: aiData.reply });

  } catch (error) {
    console.error("Copilot route error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/copilot/chat
 * @desc General career copilot chat
 * @access Private (Student only)
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can use the copilot' });
    }

    const user = await User.findById(userId);
    let resumeText = "";
    
    // Fetch Resume Text if available
    if (user.resumeUrl) {
      try {
        const filePath = getResumeFilePath(user.resumeUrl);
        if (filePath && fs.existsSync(filePath)) {
          const formData = new FormData();
          formData.append('file', fs.createReadStream(filePath));

          const parseRes = await fetch('http://localhost:8000/api/parse-pdf', {
            method: 'POST',
            body: formData,
          });
          if (parseRes.ok) {
            const parseData = await parseRes.json();
            resumeText = parseData.parsed_text;
          }
        }
      } catch (e) {
        console.error("Resume parsing error in copilot", e);
      }
    }

    // Call AI Microservice
    const aiReqBody = {
      resume_text: resumeText || "No resume uploaded yet.",
      user_message: message,
      chat_history: chatHistory || []
    };

    const aiRes = await fetch('http://localhost:8000/api/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiReqBody)
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      return res.status(500).json({ message: 'AI Service Error', details: errorText });
    }

    const aiData = await aiRes.json();
    res.json({ reply: aiData.reply });

  } catch (error) {
    console.error("Copilot chat route error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
