import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route POST /api/upload/resume
 * @desc Upload a resume file
 * @access Private (Requires valid JWT token)
 */
router.post('/resume', protect, (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size allowed is 5MB.' });
      }
      return res.status(400).json({ message: err.message || 'Error uploading file' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file format' });
    }
    
    // The file path relative to the root URL
    const filePath = `/uploads/${req.file.filename}`;
    
    // Update the user's resumeUrl in the database
    await User.findByIdAndUpdate(req.user.id, { resumeUrl: filePath });

    res.status(200).json({
      message: 'File uploaded successfully',
      filePath: filePath
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

export default router;
