import { useState, useEffect } from 'react'
import axios from 'axios'
import Sparkline from './components/Sparkline'
import './App.css'

const API_URL = ''

function Header({ marketStats }) {
  return (
    <header className="bg-[#181A20] border-b border-[#2B3139]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#F0B90B]">Happy Crypto 🚀</h1>
          {marketStats && (
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-gray-500">24h成交: </span>
                <span className="text-white font-medium">${(marketStats.totalVolume / 1e9).toFixed(2)}B</span>
              </div>
              <div>
                <span className="text-gray-500">BTC.D: </span>
                <span className="text-white font-medium">{marketStats.btcDominance}%</span>
              </div>
              <div>
                <span className="text-gray-500">恐惧贪婪: </span>
                <span className={`font-medium ${marketStats.fearGreedIndex > 60 ? 'text-[#0ECB81]' : marketStats.fearGreedIndex < 40 ? 'text-[#F6465D]' : 'text-yellow-500'}`}>
                  {marketStats.fearGreedIndex}
                </span>
              </div>
              <div>
                <span className="text-gray-500">资金费率: </span>
                <span className={`font-medium ${marketStats.fundingRate > 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                  {marketStats.fundingRate > 0 ? '+' : ''}{marketStats.fundingRate}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function CoinRow({ item, klineData }) {
  const changeColor = item.change24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
  const sparkColor = item.change24h >= 0 ? '#0ECB81' : '#F6465D'
  
  return (
    <a 
      href={`https://www.binance.com/zh-CN/futures/${item.symbol}USDT`}
      target="_blank"
      rel="noopener noreferrer"
      className="grid grid-cols-5 gap-2 px-3 py-3 hover:bg-[#2B3139] transition text-xs cursor-pointer"
    >
      <div className="font-medium text-white">{item.symbol}</div>
      <div className="text-gray-400">${item.price.toFixed(4)}</div>
      <div className="flex justify-center">
        <Sparkline data={klineData[item.symbol] || []} color={sparkColor} />
      </div>
      <div className={changeColor}>{item.change24h > 0 ? '+' : ''}{item.change24h.toFixed(2)}%</div>
      <div className="text-gray-400 text-right">${(item.volume24h / 1e6).toFixed(1)}M</div>
    </a>
  )
}

export default function App() {
  const [topGainers, setTopGainers] = useState([])
  const [hotCoins, setHotCoins] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [marketStats, setMarketStats] = useState(null)
  const [klineData, setKlineData] = useState({})
  const [news, setNews] = useState([])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [gainersRes, hotRes, anomaliesRes, statsRes, newsRes] = await Promise.all([
        axios.get(`${API_URL}/api/top-gainers`),
        axios.get(`${API_URL}/api/hot-coins`),
        axios.get(`${API_URL}/api/anomalies`),
        axios.get(`${API_URL}/api/market-stats`),
        axios.get(`${API_URL}/api/news`)
      ])
      
      setTopGainers(gainersRes.data.data || [])
      setHotCoins(hotRes.data.data || [])
      setAnomalies(anomaliesRes.data.data || [])
      setMarketStats(statsRes.data.data)
      setNews(newsRes.data.data || [])
      
      const allSymbols = [...new Set([
        ...gainersRes.data.data.map(c => c.symbol),
        ...hotRes.data.data.map(c => c.symbol),
        ...anomaliesRes.data.data.map(c => c.symbol)
      ])]
      
      const klinePromises = allSymbols.map(symbol => 
        axios.get(`${API_URL}/api/kline/${symbol}`).then(res => [symbol, res.data.data])
      )
      
      const klines = await Promise.all(klinePromises)
      setKlineData(Object.fromEntries(klines))
    } catch (err) {
      console.error('获取数据失败:', err)
    }
  }

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'bullish') return <span className="text-[#0ECB81] text-xs">📈 利好</span>
    if (sentiment === 'bearish') return <span className="text-[#F6465D] text-xs">📉 利空</span>
    return <span className="text-gray-500 text-xs">➖ 中性</span>
  }

  const getTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white">
      <Header marketStats={marketStats} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 auto-rows-fr">
          <section className="bg-[#181A20] rounded-lg p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-3 text-[#F0B90B]">📈 24小时涨幅榜</h2>
            <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs text-gray-500 border-b border-[#2B3139]">
              <div>币种</div>
              <div>价格</div>
              <div className="text-center">趋势</div>
              <div>24h涨跌</div>
              <div className="text-right">成交量</div>
            </div>
            <div className="flex-1 overflow-auto">
              {topGainers.map(item => <CoinRow key={item.symbol} item={item} klineData={klineData} />)}
            </div>
          </section>

          <section className="bg-[#181A20] rounded-lg p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-3 text-[#F0B90B]">🔥 热门币种</h2>
            <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs text-gray-500 border-b border-[#2B3139]">
              <div>币种</div>
              <div>价格</div>
              <div className="text-center">趋势</div>
              <div>24h涨跌</div>
              <div className="text-right">成交量</div>
            </div>
            <div className="flex-1 overflow-auto">
              {hotCoins.map(item => <CoinRow key={item.symbol} item={item} klineData={klineData} />)}
            </div>
          </section>

          <section className="bg-[#181A20] rounded-lg p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-3 text-[#F0B90B]">⚡ 异常波动预警</h2>
            <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs text-gray-500 border-b border-[#2B3139]">
              <div>币种</div>
              <div>价格</div>
              <div>24h涨跌</div>
              <div>异常类型</div>
            </div>
            <div className="flex-1 overflow-auto">
              {anomalies.map(item => (
                <a
                  key={item.symbol}
                  href={`https://www.binance.com/zh-CN/futures/${item.symbol}USDT`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-4 gap-2 px-3 py-3 hover:bg-[#2B3139] transition text-xs cursor-pointer"
                >
                  <div className="font-medium text-white">{item.symbol}</div>
                  <div className="text-gray-400">${item.price.toFixed(4)}</div>
                  <div className={item.change24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
                    {item.change24h > 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={item.severity === 'high' ? 'text-[#F6465D]' : 'text-yellow-500'}>⚡</span>
                    <span className="text-gray-400">{item.reason}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="bg-[#181A20] rounded-lg p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-3 text-[#F0B90B]">📰 加密新闻</h2>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px]">
              {news.length === 0 ? (
                <div className="text-gray-500 text-xs text-center py-4">加载中...</div>
              ) : (
                news.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[#1E2329] rounded hover:bg-[#2B3139] transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-medium text-white flex-1 pr-2">{item.title}</h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{getTimeAgo(item.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">{item.source}</span>
                      {getSentimentBadge(item.sentiment)}
                    </div>
                  </a>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
      
      <footer className="border-t border-[#2B3139] py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-xs text-gray-500">
          <p>Author: <span className="text-[#F0B90B] font-medium">@恐龙博士</span> | 本网站不构成投资意见</p>
        </div>
      </footer>
    </div>
  )
}
