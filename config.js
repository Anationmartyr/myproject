// 发布配置
const CONFIG = {
    // 应用信息
    APP_NAME: 'MBTI性格测评',
    VERSION: '1.0.0',
    
    // 功能开关
    ENABLE_ANALYTICS: true,
    ENABLE_SHARE: true,
    ENABLE_DOWNLOAD: true,
    
    // 分享配置
    SHARE_TITLE: '我的MBTI性格测评结果',
    SHARE_DESCRIPTION: '快来测测你的性格类型吧！',
    
    // 联系信息
    CONTACT_EMAIL: 'contact@mbti-test.com',
    WEBSITE_URL: 'https://your-mbti-domain.com',
    
    // 统计配置
    ANALYTICS_ID: 'YOUR_ANALYTICS_ID',
    
    // 国际化
    LANGUAGE: 'zh-CN'
};

// 服务器端配置（如需部署到服务器）
const SERVER_CONFIG = {
    API_ENDPOINT: '/api',
    RESULTS_ENDPOINT: '/api/results',
    FEEDBACK_ENDPOINT: '/api/feedback'
};