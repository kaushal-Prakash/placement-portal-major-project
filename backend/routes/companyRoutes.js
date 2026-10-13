import express from 'express';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Feedback from '../models/Feedback.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/companies
 * @desc Get all companies
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/companies/intelligence
 * @desc Get Comprehensive Company Intelligence & Analytics across all visiting recruiters
 * @access Private
 */
router.get('/intelligence', protect, async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    const allJobs = await Job.find().populate('company');
    const allApplications = await Application.find();
    const allFeedbacks = await Feedback.find();

    const intelligenceList = companies.map(comp => {
      const compIdStr = comp._id.toString();
      const compNameLower = (comp.name || '').trim().toLowerCase();

      // Find jobs belonging to this company
      const compJobs = allJobs.filter(j => j.company && j.company._id.toString() === compIdStr);
      const jobIds = new Set(compJobs.map(j => j._id.toString()));

      // Applications for this company
      const compApps = allApplications.filter(a => a.job && jobIds.has(a.job.toString()));
      const appliedCount = compApps.length;
      const shortlistedCount = compApps.filter(a => ['shortlisted', 'Shortlisted'].includes(a.status)).length;
      const placedCount = compApps.filter(a => ['placed', 'Placed'].includes(a.status)).length;
      const conversionRate = appliedCount > 0 ? Math.round((placedCount / appliedCount) * 100) : 0;

      // CTC Stats
      const ctcArr = compJobs.map(j => j.ctc).filter(c => typeof c === 'number' && c > 0);
      const avgCTC = ctcArr.length ? Math.round((ctcArr.reduce((a, b) => a + b, 0) / ctcArr.length) * 10) / 10 : 0;
      const minCTC = ctcArr.length ? Math.min(...ctcArr) : 0;
      const maxCTC = ctcArr.length ? Math.max(...ctcArr) : 0;

      // Feedbacks for this company (case-insensitive name match)
      const compFeedbacks = allFeedbacks.filter(f => (f.company || '').trim().toLowerCase() === compNameLower);
      const reviewCount = compFeedbacks.length;
      const avgRating = reviewCount 
        ? Math.round((compFeedbacks.reduce((a, b) => a + (b.rating || 0), 0) / reviewCount) * 10) / 10 
        : null;

      // Top Tested Skills aggregation
      const skillCounts = {};
      compJobs.forEach(j => {
        (j.requiredSkills || []).forEach(skill => {
          const s = skill.trim();
          if (s) skillCounts[s] = (skillCounts[s] || 0) + 3; // higher weight to explicitly required skills
        });
      });

      compFeedbacks.forEach(f => {
        (f.interviewQuestions || []).forEach(q => {
          const qLower = q.toLowerCase();
          const candidateSkills = [
            "React", "Node.js", "Python", "Java", "C++", "SQL", "MongoDB", "Data Structures", 
            "Algorithms", "System Design", "Docker", "AWS", "Machine Learning", "Microservices"
          ];
          candidateSkills.forEach(cs => {
            if (qLower.includes(cs.toLowerCase())) {
              skillCounts[cs] = (skillCounts[cs] || 0) + 1;
            }
          });
        });
      });

      const topSkills = Object.keys(skillCounts)
        .sort((a, b) => skillCounts[b] - skillCounts[a])
        .slice(0, 5);

      // Past questions snippet
      const sampleQuestions = compFeedbacks
        .flatMap(f => f.interviewQuestions || [])
        .slice(0, 4);

      return {
        _id: comp._id,
        name: comp.name,
        description: comp.description,
        industry: comp.industry || 'Technology',
        website: comp.website,
        totalDrives: compJobs.length,
        totalApplied: appliedCount,
        totalShortlisted: shortlistedCount,
        totalPlaced: placedCount,
        conversionRate,
        avgCTC,
        minCTC,
        maxCTC,
        topSkills: topSkills.length ? topSkills : ["Problem Solving", "Core CS", "Data Structures"],
        reviewCount,
        avgDifficulty: avgRating || 3.5,
        sampleQuestions,
        latestJobId: compJobs.length ? compJobs[compJobs.length - 1]._id : null
      };
    });

    // Sort by companies with highest activity or average package
    intelligenceList.sort((a, b) => (b.totalApplied + b.avgCTC) - (a.totalApplied + a.avgCTC));

    res.json(intelligenceList);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/companies/:id/intelligence
 * @desc Get Intelligence details for a single company
 * @access Private
 */
router.get('/:id/intelligence', protect, async (req, res) => {
  try {
    const comp = await Company.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Company not found' });

    const compJobs = await Job.find({ company: comp._id }).sort({ createdAt: -1 });
    const jobIds = compJobs.map(j => j._id);
    const compApps = await Application.find({ job: { $in: jobIds } }).populate('user', 'name cgpa branch usn');
    const compFeedbacks = await Feedback.find({ 
      company: { $regex: new RegExp(`^${comp.name.trim()}$`, 'i') } 
    }).populate('user', 'name branch');

    const appliedCount = compApps.length;
    const shortlistedCount = compApps.filter(a => ['shortlisted', 'Shortlisted'].includes(a.status)).length;
    const placedCount = compApps.filter(a => ['placed', 'Placed'].includes(a.status)).length;
    const conversionRate = appliedCount > 0 ? Math.round((placedCount / appliedCount) * 100) : 0;

    const ctcArr = compJobs.map(j => j.ctc).filter(c => typeof c === 'number' && c > 0);
    const avgCTC = ctcArr.length ? Math.round((ctcArr.reduce((a, b) => a + b, 0) / ctcArr.length) * 10) / 10 : 0;

    res.json({
      company: comp,
      totalDrives: compJobs.length,
      totalApplied: appliedCount,
      totalShortlisted: shortlistedCount,
      totalPlaced: placedCount,
      conversionRate,
      avgCTC,
      jobs: compJobs,
      feedbacks: compFeedbacks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/companies
 * @desc Create a new company
 * @access Private/Admin
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, industry, website } = req.body;
    const company = new Company({ name, description, industry, website });
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
