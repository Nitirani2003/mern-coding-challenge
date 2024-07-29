const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const { month } = req.query;
  const baseUrl = `http://localhost:${process.env.PORT}/api`;
  
  try {
    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      axios.get(`${baseUrl}/transactions?month=${month}`),
      axios.get(`${baseUrl}/statistics?month=${month}`),
      axios.get(`${baseUrl}/charts/bar?month=${month}`),
      axios.get(`${baseUrl}/charts/pie?month=${month}`)
    ]);
    
    res.json({
      transactions: transactions.data,
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching combined data' });
  }
});

module.exports = router;