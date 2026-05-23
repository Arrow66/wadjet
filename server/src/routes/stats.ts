import express from 'express';
import { getInvestigationStats } from '../services/cache.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const stats = getInvestigationStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats Error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
