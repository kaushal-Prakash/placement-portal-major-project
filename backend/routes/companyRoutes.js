import express from 'express';
import Company from '../models/Company.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/companies
 * @desc Get all companies
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
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
