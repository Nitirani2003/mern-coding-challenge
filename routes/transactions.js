const express = require('express');
const router = express.Router();
const axios = require('axios');
const Transaction = require('../models/Transaction');

router.get('/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transaction.deleteMany({});
    await Transaction.insertMany(response.data);
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Error initializing database' });
  }
});

router.get('/transactions', async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
  
  try {
    let query = { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: isNaN(search) ? 0 : Number(search) }
      ];
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(Number(perPage));

    res.json({
      transactions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / perPage)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

router.get('/statistics', async (req, res) => {
  const { month } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

  try {
    const stats = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: '$price' },
          totalSoldItems: { $sum: { $cond: ['$sold', 1, 0] } },
          totalNotSoldItems: { $sum: { $cond: ['$sold', 0, 1] } }
        }
      }
    ]);

    res.json(stats[0] || { totalSaleAmount: 0, totalSoldItems: 0, totalNotSoldItems: 0 });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

router.get('/bar-chart', async (req, res) => {
  const { month } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

  try {
    const barChartData = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$price', 100] }, then: '0 - 100' },
                { case: { $lte: ['$price', 200] }, then: '101 - 200' },
                { case: { $lte: ['$price', 300] }, then: '201 - 300' },
                { case: { $lte: ['$price', 400] }, then: '301 - 400' },
                { case: { $lte: ['$price', 500] }, then: '401 - 500' },
                { case: { $lte: ['$price', 600] }, then: '501 - 600' },
                { case: { $lte: ['$price', 700] }, then: '601 - 700' },
                { case: { $lte: ['$price', 800] }, then: '701 - 800' },
                { case: { $lte: ['$price', 900] }, then: '801 - 900' },
              ],
              default: '901 - above'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json(barChartData);
  } catch (error) {
    console.error('Error fetching bar chart data:', error);
    res.status(500).json({ error: 'Error fetching bar chart data' });
  }
});

router.get('/pie-chart', async (req, res) => {
  const { month } = req.query;
  const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;

  try {
    const pieChartData = await Transaction.aggregate([
      { $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(pieChartData);
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).json({ error: 'Error fetching pie chart data' });
  }
});

router.get('/combined', async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;

  try {
    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      axios.get(`http://localhost:${process.env.PORT}/api/transactions`, { params: { month, search, page, perPage } }),
      axios.get(`http://localhost:${process.env.PORT}/api/statistics`, { params: { month } }),
      axios.get(`http://localhost:${process.env.PORT}/api/bar-chart`, { params: { month } }),
      axios.get(`http://localhost:${process.env.PORT}/api/pie-chart`, { params: { month } })
    ]);

    res.json({
      transactions: transactions.data,
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data
    });
  } catch (error) {
    console.error('Error fetching combined data:', error);
    res.status(500).json({ error: 'Error fetching combined data' });
  }
});

module.exports = router;