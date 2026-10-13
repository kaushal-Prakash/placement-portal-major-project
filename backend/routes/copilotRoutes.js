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
 * Express Middleware helper: Extract text from candidate's uploaded resume
 */
const extractResumeText = async (resumeUrl) => {
  if (!resumeUrl) return '';
  try {
    const filePath = getResumeFilePath(resumeUrl);
    if (!filePath || !fs.existsSync(filePath)) return '';

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const parseRes = await fetch('http://localhost:8000/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    if (parseRes.ok) {
      const parseData = await parseRes.json();
      return parseData.parsed_text || '';
    }
  } catch (err) {
    console.error('[Copilot Middleware] Resume extraction error:', err.message);
  }
  return '';
};

/**
 * @route POST /api/copilot/mock-interview
 * @desc Conduct AI-powered mock interview combining JD, Resume, and Alumni Feedback
 * @access Private (Student only)
 */
router.post('/mock-interview', protect, async (req, res) => {
  try {
    const { jobId, chatHistory } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can use the mock interviewer' });
    }

    const job = await Job.findById(jobId).populate('company');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = await User.findById(userId);
    const resumeText = await extractResumeText(user.resumeUrl);

    // Fetch Historical Questions for this company from Alumni Feedback Hub
    const companyName = job.company?.name || job.company || '';
    const feedbacks = companyName ? await Feedback.find({ company: new RegExp(companyName, 'i') }) : [];
    let historicalQuestions = [];
    feedbacks.forEach(fb => {
      if (Array.isArray(fb.interviewQuestions)) {
        historicalQuestions.push(...fb.interviewQuestions);
      }
    });
    historicalQuestions = [...new Set(historicalQuestions)].slice(0, 15);

    const jobDescription = `${job.title}. ${job.description} Requirements: ${(job.requirements || job.requiredSkills || []).join(', ')}`;

    // Forward to AI Microservice via Express
    try {
      const aiRes = await fetch('http://localhost:8000/api/copilot/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText || (user.skills || []).join(', ') || 'General Engineering Candidate',
          job_description: jobDescription,
          historical_questions: historicalQuestions,
          chat_history: chatHistory || []
        })
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        return res.json({ reply: aiData.reply });
      }
    } catch (aiErr) {
      console.warn('[Copilot Route] AI Microservice unreachable. Using local conversational fallback:', aiErr.message);
    }

    // High-quality local Express fallback interview simulator
    const step = Math.floor((chatHistory || []).length / 2);
    const reqSkills = (job.requirements || job.requiredSkills || ['problem solving', 'system design']);
    const candidateSkills = (user.skills || []).map(s => String(s).toLowerCase());
    const missing = reqSkills.filter(s => !candidateSkills.includes(String(s).toLowerCase()));
    const targetTopic = missing[0] || reqSkills[0] || 'core software engineering';

    if (step === 0) {
      return res.json({
        reply: `Welcome to your mock interview for **${job.title}** at **${companyName}**! 🎯\n\nI have reviewed your profile. To begin:\n\n**Can you introduce yourself and walk me through your most technically challenging project? Explain your architecture and the primary engineering tradeoffs you made.**`
      });
    } else if (step === 1) {
      return res.json({
        reply: `Great explanation. For this role, deep competency in **${targetTopic}** is essential.\n\n**How would you design a scalable solution utilizing ${targetTopic}, and what strategies would you use to handle high concurrency and potential system failures?**`
      });
    } else if (step === 2) {
      const q = historicalQuestions[0] || `How would you diagnose and resolve a memory leak or database performance bottleneck in production?`;
      return res.json({
        reply: `Well thought out. Here is a challenge commonly discussed in interviews for **${companyName}**:\n\n**"${q}"**\n\nWalk me through your step-by-step approach.`
      });
    } else {
      return res.json({
        reply: `Awesome job! That completes this practice interview round for **${companyName}**.\n\n**Key Takeaways:**\n- **Communication:** Crisp and structured responses.\n- **Skill Focus:** Continue brushing up on **${targetTopic}** before the on-site round.\n- Keep your focus sharp and best of luck!`
      });
    }
  } catch (error) {
    console.error("Copilot mock interview error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/copilot/chat
 * @desc General career copilot chat via Express middleware
 * @access Private (Student only)
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can use the copilot' });
    }

    const user = await User.findById(userId).populate('branch batch');
    const resumeText = await extractResumeText(user.resumeUrl);

    // Forward to FastAPI microservice via Express
    try {
      const aiRes = await fetch('http://localhost:8000/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText || (user.skills || []).join(', ') || 'Engineering Student',
          user_message: message,
          chat_history: chatHistory || []
        })
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        return res.json({ reply: aiData.reply });
      }
    } catch (aiErr) {
      console.warn('[Copilot Chat Route] FastAPI service unavailable. Using Express fallback:', aiErr.message);
    }

    // Express Local Intelligent Fallback
    const msg = (message || '').toLowerCase();
    const skillsList = (user.skills || []).join(', ') || 'programming fundamentals';

    if (msg.includes('study') || msg.includes('prep') || msg.includes('dsa')) {
      return res.json({
        reply: `Based on your profile showcasing **${skillsList}**, here is your priority placement preparation plan:\n\n1. **Data Structures & Algorithms:** Practice Medium-level problems on LeetCode across Binary Search, Dynamic Programming, and Graph Traversals (BFS/DFS).\n2. **Core CS Fundamentals:** Revise Operating Systems (Paging, Thread synchronization, Deadlocks) and Database Management (Indexing, Transactions, Normalization).\n3. **System Design:** Prepare high-level architecture designs for URL shorteners, Rate limiters, and Cache architectures.`
      });
    } else if (msg.includes('resume') || msg.includes('project')) {
      return res.json({
        reply: `Here are 3 resume tips based on campus placement standards:\n\n- **Quantify Impact:** Use metrics like *"Reduced API response latency by 35%"* instead of generic descriptions.\n- **Highlight Your Stack:** Ensure skills like ${skillsList} are reflected directly in project bullet points.\n- **Clean Formatting:** Keep sections structured with clear Dates, Technologies used, and GitHub links.`
      });
    } else {
      return res.json({
        reply: `Hello ${user.name}! I am your **AI Placement Copilot**.\n\nI can assist you with:\n- Identifying missing skill gaps for top recruiters\n- Personalized mock interviews and practice questions\n- Strategic preparation roadmaps for your upcoming drives\n\nWhat role or company are you preparing for?`
      });
    }
  } catch (error) {
    console.error("Copilot chat route error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/copilot/skill-gap
 * @desc Get Skill Gap analysis between student and job opening
 * @access Private (Student only)
 */
router.post('/skill-gap', protect, async (req, res) => {
  try {
    const { jobId } = req.body;
    const user = await User.findById(req.user.id);
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const resumeText = await extractResumeText(user.resumeUrl);
    const requiredSkills = job.requirements || job.requiredSkills || [];

    try {
      const aiRes = await fetch('http://localhost:8000/api/copilot/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText || (user.skills || []).join(' '),
          job_description: `${job.title} ${job.description}`,
          required_skills: requiredSkills
        })
      });

      if (aiRes.ok) {
        return res.json(await aiRes.json());
      }
    } catch {
      // Fallback in Express
    }

    const candidateSkills = (user.skills || []).map(s => String(s).toLowerCase().trim());
    const matched = [];
    const missing = [];

    requiredSkills.forEach(reqSkill => {
      const s = String(reqSkill).toLowerCase().trim();
      if (candidateSkills.some(cs => cs.includes(s) || s.includes(cs))) {
        matched.push(reqSkill);
      } else {
        missing.push(reqSkill);
      }
    });

    const total = requiredSkills.length || 1;
    const coverage = Math.round((matched.length / total) * 100);

    res.json({
      matched_skills: matched,
      missing_skills: missing,
      skill_match_percentage: coverage,
      recommendations: missing.map(m => `Deepen hands-on practice in ${m} before your technical rounds.`)
    });
  } catch (error) {
    console.error("Skill gap route error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
