import express from 'express';
import cors from 'cors';
import { getTopGainers, getHotCoins, getAnomalies, getMarketStats, getKlineData, getCryptoNews } from './api/binance.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/top-gainers', async (req, res) => {
  try {
    const data = await getTopGainers(10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/hot-coins', async (req, res) => {
  try {
    const data = await getHotCoins();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/market-stats', async (req, res) => {
  try {
    const data = await getMarketStats();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/kline/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await getKlineData(symbol);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const data = await getCryptoNews();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/anomalies', async (req, res) => {
  try {
    const data = await getAnomalies();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Happy Crypto API running on port ${PORT}`);
});
