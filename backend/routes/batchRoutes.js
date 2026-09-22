import express from 'express';
import Batch from '../models/Batch.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/batches
 * @desc Get all batches
 * @access Private/Admin
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ year: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/batches
 * @desc Create a new batch
 * @access Private/Admin
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { year, isActive } = req.body;
    const batch = new Batch({ year, isActive });
    await batch.save();
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/batches/:id
 * @desc Get single batch details
 * @access Private/Admin
 */
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
