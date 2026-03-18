import axios from 'axios';

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  timeout: 10000
});

// 使用CryptoCompare新闻API（免费，无需API key）
async function fetchCryptoNews() {
  try {
    const response = await axiosInstance.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
    console.log('CryptoCompare API响应状态:', response.status);
    
    if (response.data && response.data.Data) {
      console.log('新闻数量:', response.data.Data.length);
      
      return response.data.Data.slice(0, 20).map(item => ({
        title: item.title,
        content: item.body.substring(0, 200),
        url: item.url,
        source: item.source,
        time: new Date(item.published_on * 1000).toISOString(),
        timestamp: item.published_on
      }));
    }
    return [];
  } catch (err) {
    console.error('获取新闻失败:', err.message, err.response?.status);
    return [];
  }
}

export async function getCryptoNews() {
  try {
    const news = await fetchCryptoNews();
    return news.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('获取新闻失败:', err.message);
    return [];
  }
}
