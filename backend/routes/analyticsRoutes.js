import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/analytics
 * @desc Get placement analytics data
 * @access Private/Admin
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const placedStudents = await User.countDocuments({ role: 'student', isPlaced: true });
    
    // Batch-wise aggregation
    const batchStats = await User.aggregate([
      { $match: { role: 'student' } },
      { 
        $group: {
          _id: "$batch",
          totalStudents: { $sum: 1 },
          placedStudents: { $sum: { $cond: [{ $eq: ["$isPlaced", true] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: '_id',
          as: 'batchInfo'
        }
      },
      { $unwind: { path: "$batchInfo", preserveNullAndEmptyArrays: true } },
      { 
        $project: {
          batchYear: "$batchInfo.year",
          totalStudents: 1,
          placedStudents: 1,
          placementRate: { 
            $cond: [
              { $gt: ["$totalStudents", 0] }, 
              { $multiply: [{ $divide: ["$placedStudents", "$totalStudents"] }, 100] }, 
              0
            ]
          }
        }
      },
      { $sort: { batchYear: -1 } }
    ]);

    // Top companies by job posts
    const jobs = await Job.find().populate('company');
    let companyCounts = {};
    jobs.forEach(job => {
      const companyName = job.company ? job.company.name : 'Unknown';
      companyCounts[companyName] = (companyCounts[companyName] || 0) + 1;
    });

    const topCompanies = Object.keys(companyCounts)
      .map(company => ({ company, count: companyCounts[company] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      placementRate: totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0,
      totalStudents,
      placedStudents,
      topCompanies,
      batchStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/analytics/predictive
 * @desc Get predictive placement probabilities for students
 * @access Private/Admin
 */
router.get('/predictive', protect, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isPlaced: false }).populate('batch branch');
    
    // Fetch all applications to calculate average match scores
    const applications = await Application.find();
    
    const predictions = students.map(student => {
      let score = 0;
      let riskLevel = "Low";
      
      // CGPA Factor (Max 40 points)
      if (student.cgpa >= 9.0) score += 40;
      else if (student.cgpa >= 8.0) score += 30;
      else if (student.cgpa >= 7.0) score += 20;
      else if (student.cgpa >= 6.0) score += 10;
      
      // Backlog Factor (Penalty up to -30)
      if (student.activeBacklogs > 0) score -= (student.activeBacklogs * 15);
      if (student.historyOfBacklogs > 0) score -= 5;
      
      // AI Match Score Factor (Max 60 points)
      const studentApps = applications.filter(app => app.user.toString() === student._id.toString() && app.matchScore);
      let avgMatch = 0;
      if (studentApps.length > 0) {
        avgMatch = studentApps.reduce((acc, curr) => acc + curr.matchScore, 0) / studentApps.length;
        score += (avgMatch * 0.6); // 60% of average match score
      } else {
        // If no apps, assume average potential based on CGPA
        score += (student.cgpa ? (student.cgpa * 4) : 0);
      }
      
      // Cap score between 5 and 99
      let placementProbability = Math.max(5, Math.min(99, Math.round(score)));
      
      if (placementProbability < 40) riskLevel = "High";
      else if (placementProbability < 70) riskLevel = "Medium";
      else riskLevel = "Low";

      return {
        _id: student._id,
        name: student.name,
        usn: student.usn,
        cgpa: student.cgpa,
        branch: student.branch?.code || 'N/A',
        batch: student.batch?.year || 'N/A',
        applicationsCount: studentApps.length,
        avgMatchScore: Math.round(avgMatch),
        placementProbability,
        riskLevel
      };
    });

    // Sort by lowest probability to highlight at-risk students
    predictions.sort((a, b) => a.placementProbability - b.placementProbability);

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
