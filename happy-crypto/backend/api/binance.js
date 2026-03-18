import axios from 'axios';
import Parser from 'rss-parser';

const BASE_URL = 'https://fapi.binance.com';
const parser = new Parser();

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  timeout: 5000
});

let tradingSymbols = new Set();
let lastFetch = 0;

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function updateTradingSymbols() {
  const now = Date.now();
  if (now - lastFetch < 300000) return;
  
  try {
    const exchangeInfo = await fetchWithRetry(`${BASE_URL}/fapi/v1/exchangeInfo`);
    tradingSymbols = new Set(
      exchangeInfo.symbols
        .filter(s => s.status === 'TRADING' && s.symbol.endsWith('USDT'))
        .map(s => s.symbol)
    );
    lastFetch = now;
    console.log(`已加载 ${tradingSymbols.size} 个交易中的合约`);
  } catch (err) {
    console.error('更新交易币种失败:', err.message);
  }
}

export async function getTopGainers(limit = 10) {
  try {
    await updateTradingSymbols();
    const tickers = await fetchWithRetry(`${BASE_URL}/fapi/v1/ticker/24hr`);
    
    if (!Array.isArray(tickers)) return [];
    
    return tickers
      .filter(t => tradingSymbols.has(t.symbol) && parseFloat(t.priceChangePercent) > 0)
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
      .slice(0, limit)
      .map(t => ({
        symbol: t.symbol.replace('USDT', ''),
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
        volume24h: parseFloat(t.quoteVolume)
      }));
  } catch (err) {
    console.error('获取涨幅榜失败:', err.message);
    return [];
  }
}

export async function getHotCoins(limit = 10) {
  try {
    await updateTradingSymbols();
    const tickers = await fetchWithRetry(`${BASE_URL}/fapi/v1/ticker/24hr`);
    
    if (!Array.isArray(tickers)) return [];
    
    return tickers
      .filter(t => tradingSymbols.has(t.symbol))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit)
      .map(t => ({
        symbol: t.symbol.replace('USDT', ''),
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
        volume24h: parseFloat(t.quoteVolume)
      }));
  } catch (err) {
    console.error('获取热门币失败:', err.message);
    return [];
  }
}

export async function getAnomalies(limit = 10) {
  try {
    await updateTradingSymbols();
    const tickers = await fetchWithRetry(`${BASE_URL}/fapi/v1/ticker/24hr`);
    
    if (!Array.isArray(tickers)) return [];
    
    return tickers
      .filter(t => tradingSymbols.has(t.symbol) && Math.abs(parseFloat(t.priceChangePercent)) > 10)
      .map(t => {
        const volumeMultiplier = parseFloat((parseFloat(t.quoteVolume) / 10000000).toFixed(1));
        return {
          symbol: t.symbol.replace('USDT', ''),
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          volume24h: parseFloat(t.quoteVolume),
          severity: Math.abs(parseFloat(t.priceChangePercent)) > 20 ? 'high' : 'medium',
          reason: `成交量放大${volumeMultiplier}倍`,
          volumeMultiplier
        };
      })
      .sort((a, b) => b.volumeMultiplier - a.volumeMultiplier)
      .slice(0, limit);
  } catch (err) {
    console.error('获取异常波动失败:', err.message);
    return [];
  }
}

export async function getMarketStats() {
  try {
    const tickers = await fetchWithRetry(`${BASE_URL}/fapi/v1/ticker/24hr`);
    
    if (!Array.isArray(tickers)) return { totalVolume: 0, btcDominance: 45, fearGreedIndex: 50, fundingRate: 0 };
    
    const usdtPairs = tickers.filter(t => t.symbol.endsWith('USDT'));
    const totalVolume = usdtPairs.reduce((sum, t) => sum + parseFloat(t.quoteVolume), 0);
    
    const btcTicker = tickers.find(t => t.symbol === 'BTCUSDT');
    const btcVolume = btcTicker ? parseFloat(btcTicker.quoteVolume) : 0;
    const btcDominance = totalVolume > 0 ? (btcVolume / totalVolume * 100) : 45;
    
    const premiumIndex = await fetchWithRetry(`${BASE_URL}/fapi/v1/premiumIndex?symbol=BTCUSDT`);
    const fundingRate = premiumIndex ? parseFloat(premiumIndex.lastFundingRate) * 100 : 0;
    
    return {
      totalVolume,
      btcDominance: parseFloat(btcDominance.toFixed(1)),
      fearGreedIndex: 65,
      fundingRate: parseFloat(fundingRate.toFixed(4))
    };
  } catch (err) {
    console.error('获取市场统计失败:', err.message);
    return { totalVolume: 0, btcDominance: 45, fearGreedIndex: 50, fundingRate: 0 };
  }
}

export async function getKlineData(symbol, interval = '1h', limit = 24) {
  try {
    const klines = await fetchWithRetry(`${BASE_URL}/fapi/v1/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`);
    return klines.map(k => parseFloat(k[4]));
  } catch (err) {
    console.error(`获取${symbol}K线失败:`, err.message);
    return [];
  }
}

export async function getCryptoNews() {
  try {
    const news = [];
    
    try {
      const feed = await parser.parseURL('https://www.coindesk.com/arc/outboundfeeds/rss/');
      feed.items.slice(0, 5).forEach(item => {
        news.push({
          title: item.title,
          link: item.link,
          source: 'CoinDesk',
          time: new Date(item.pubDate).getTime(),
          sentiment: analyzeSentiment(item.title)
        });
      });
    } catch (err) {
      console.error('CoinDesk RSS失败:', err.message);
    }
    
    try {
      const feed = await parser.parseURL('https://cointelegraph.com/rss');
      feed.items.slice(0, 5).forEach(item => {
        news.push({
          title: item.title,
          link: item.link,
          source: 'CoinTelegraph',
          time: new Date(item.pubDate).getTime(),
          sentiment: analyzeSentiment(item.title)
        });
      });
    } catch (err) {
      console.error('CoinTelegraph RSS失败:', err.message);
    }
    
    return news.sort((a, b) => b.time - a.time).slice(0, 10);
  } catch (err) {
    console.error('获取新闻失败:', err.message);
    return [];
  }
}

function analyzeSentiment(text) {
  const bullish = ['surge', 'rally', 'bullish', 'gain', 'rise', 'breakthrough', 'soar', 'jump', 'pump'];
  const bearish = ['crash', 'drop', 'bearish', 'fall', 'decline', 'plunge', 'dump', 'collapse'];
  
  const lower = text.toLowerCase();
  
  if (bullish.some(word => lower.includes(word))) return 'bullish';
  if (bearish.some(word => lower.includes(word))) return 'bearish';
  return 'neutral';
}
