import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import styles from './App.module.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [month, setMonth] = useState('03'); // Default to March
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState({ labels: [], datasets: [] });
  const [pieChartData, setPieChartData] = useState({ labels: [], datasets: [] });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching data with params:', { month, search, page });
      const response = await axios.get(`${API_BASE_URL}/combined`, {
        params: { month, search, page }
      });
      console.log('API response:', response.data);
      
      setTransactions(response.data.transactions.transactions || []);
      setStatistics(response.data.statistics || {});
      setTotalPages(response.data.transactions.totalPages || 1);
      
      if (response.data.barChart && response.data.barChart.length > 0) {
        setBarChartData({
          labels: response.data.barChart.map(item => item._id),
          datasets: [{
            label: 'Number of Items',
            data: response.data.barChart.map(item => item.count),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          }]
        });
      } else {
        setBarChartData({ labels: [], datasets: [] });
      }
      
      if (response.data.pieChart && response.data.pieChart.length > 0) {
        setPieChartData({
          labels: response.data.pieChart.map(item => item._id),
          datasets: [{
            data: response.data.pieChart.map(item => item.count),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
          }]
        });
      } else {
        setPieChartData({ labels: [], datasets: [] });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`An error occurred while fetching data: ${error.message}`);
      setTransactions([]);
      setStatistics({});
      setBarChartData({ labels: [], datasets: [] });
      setPieChartData({ labels: [], datasets: [] });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [month, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setPage(1); // Reset to first page when changing month
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when changing search
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transaction Dashboard</h1>
        <div className={styles.controls}>
          <select className={styles.select} value={month} onChange={handleMonthChange}>
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
              <option key={m} value={m}>{new Date(`2000-${m}-01`).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <input
            className={styles.input}
            type="text"
            placeholder="Search transactions"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </header>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Title</th>
              <th>Description</th>
              <th>Price</th>
              <th>Category</th>
              <th>Sold</th>
              <th>Date of Sale</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>
                  <img 
                    src={transaction.image} 
                    alt={transaction.title} 
                    className={styles.productImage}
                  />
                </td>
                <td>{transaction.title}</td>
                <td className={styles.truncate}>{transaction.description}</td>
                <td>${transaction.price.toFixed(2)}</td>
                <td>{transaction.category}</td>
                <td>{transaction.sold ? 'Yes' : 'No'}</td>
                <td>{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={styles.pagination}>
        <button 
          className={styles.paginationButton} 
          onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
          disabled={page === 1}
        >
          Previous
        </button>
        <span className={styles.paginationInfo}>Page {page} of {totalPages}</span>
        <button 
          className={styles.paginationButton} 
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
      
      <div className={styles.statistics}>
        <h2 className={styles.statisticsTitle}>Statistics</h2>
        <p className={styles.statisticsItem}>Total Sale Amount: ${statistics.totalSaleAmount ? statistics.totalSaleAmount.toFixed(2) : '0.00'}</p>
        <p className={styles.statisticsItem}>Total Sold Items: {statistics.totalSoldItems || 0}</p>
        <p className={styles.statisticsItem}>Total Not Sold Items: {statistics.totalNotSoldItems || 0}</p>
      </div>
      
      <div className={styles.chart}>
        <h2 className={styles.chartTitle}>Bar Chart</h2>
        <div className={styles.chartContainer}>
          {barChartData.labels.length > 0 ? (
            <Bar 
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Items'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Price Range'
                    }
                  }
                }
              }}
            />
          ) : (
            <p>No data available for bar chart</p>
          )}
        </div>
      </div>
      
      <div className={styles.chart}>
        <h2 className={styles.chartTitle}>Pie Chart</h2>
        <div className={styles.chartContainer}>
          {pieChartData.labels.length > 0 ? (
            <Pie 
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: true,
                    text: 'Items by Category'
                  }
                }
              }}
            />
          ) : (
            <p>No data available for pie chart</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;