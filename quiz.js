// 增强版MBTI测评系统

let currentQuestionIndex = 0;
let answers = [];
let userAnswers = [];
let currentTestId = null;

// 初始化
function initQuiz() {
    // 生成唯一测试ID
    currentTestId = generateTestId();
    
    // 绑定欢迎页面事件
    document.getElementById('start-btn').addEventListener('click', startQuiz);
    
    // 绑定分享事件
    document.getElementById('share-btn').addEventListener('click', showShareModal);
    document.getElementById('share-result-btn').addEventListener('click', showShareModal);
    document.getElementById('download-btn').addEventListener('click', downloadReport);
    
    // 绑定模态框事件
    document.querySelector('.close').addEventListener('click', closeShareModal);
    document.querySelectorAll('.share-option').forEach(btn => {
        btn.addEventListener('click', handleShare);
    });
    
    // 点击模态框外部关闭
    document.getElementById('share-modal').addEventListener('click', function(e) {
        if (e.target === this) closeShareModal();
    });
    
    // 显示欢迎页面
    showWelcome();
}

function showWelcome() {
    document.getElementById('welcome-container').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
}

function startQuiz() {
    document.getElementById('welcome-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    
    // 发送开始测试事件
    gtag('event', 'test_start', {
        'test_id': currentTestId,
        'timestamp': new Date().toISOString()
    });
    
    showQuestion();
    updateProgress();
}

function showQuestion() {
    const question = questions[currentQuestionIndex];
    document.getElementById('question-number').textContent = currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('option-a').textContent = question.optionA;
    document.getElementById('option-b').textContent = question.optionB;
    document.getElementById('progress-text').textContent = 
        `第 ${currentQuestionIndex + 1} 题，共 ${questions.length} 题`;
    
    // 清除之前的选择
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function selectAnswer(answer) {
    // 移除其他选项的选中状态
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 添加当前选项的选中状态
    event.target.closest('.option-btn').classList.add('selected');
    
    // 记录答案
    answers[currentQuestionIndex] = answer;
    
    // 记录详细答题信息
    const question = questions[currentQuestionIndex];
    userAnswers.push({
        questionIndex: currentQuestionIndex,
        question: question.question,
        category: question.category,
        selectedOption: answer === 'A' ? question.optionA : question.optionB,
        selectedValue: answer,
        timestamp: new Date().toISOString()
    });
    
    // 发送答题事件
    gtag('event', 'question_answered', {
        'test_id': currentTestId,
        'question_index': currentQuestionIndex,
        'category': question.category,
        'answer': answer,
        'timestamp': new Date().toISOString()
    });
    
    // 延迟进入下一题
    setTimeout(() => {
        nextQuestion();
    }, 500);
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
        updateProgress();
    } else {
        showLoading();
        setTimeout(() => {
            showResult();
            hideLoading();
        }, 1500);
    }
}

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progress').style.width = progress + '%';
}

function showLoading() {
    document.getElementById('loading-screen').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none';
}

function calculatePersonality() {
    const scores = {
        E: 0, I: 0,
        S: 0, N: 0,
        T: 0, F: 0,
        J: 0, P: 0
    };
    
    // 计算各项得分
    questions.forEach((question, index) => {
        const answer = answers[index];
        const category = question.category;
        
        switch (category) {
            case 'EI':
                if (answer === 'A') scores.E++;
                else scores.I++;
                break;
            case 'SN':
                if (answer === 'A') scores.S++;
                else scores.N++;
                break;
            case 'TF':
                if (answer === 'A') scores.T++;
                else scores.F++;
                break;
            case 'JP':
                if (answer === 'A') scores.J++;
                else scores.P++;
                break;
        }
    });
    
    // 确定人格类型
    let personality = '';
    personality += scores.E > scores.I ? 'E' : 'I';
    personality += scores.S > scores.N ? 'S' : 'N';
    personality += scores.T > scores.F ? 'T' : 'F';
    personality += scores.J > scores.P ? 'J' : 'P';
    
    // 计算百分比
    const percentages = {
        EI: Math.round((Math.max(scores.E, scores.I) / 3) * 100),
        SN: Math.round((Math.max(scores.S, scores.N) / 3) * 100),
        TF: Math.round((Math.max(scores.T, scores.F) / 3) * 100),
        JP: Math.round((Math.max(scores.J, scores.P) / 3) * 100)
    };
    
    return {
        type: personality,
        scores: scores,
        percentages: percentages,
        breakdown: {
            EI: { E: scores.E, I: scores.I },
            SN: { S: scores.S, N: scores.N },
            TF: { T: scores.T, F: scores.F },
            JP: { J: scores.J, P: scores.P }
        }
    };
}

function showResult() {
    const result = calculatePersonality();
    const personalityInfo = personalityTypes[result.type];
    
    // 隐藏问题容器，显示结果容器
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';
    document.getElementById('progress-bar').style.display = 'none';
    
    // 显示结果
    document.getElementById('personality-type').textContent = result.type;
    document.getElementById('personality-name').textContent = personalityInfo.name;
    document.getElementById('personality-description').textContent = personalityInfo.description;
    
    // 显示特征
    const traitsList = document.getElementById('traits-list');
    traitsList.innerHTML = '';
    personalityInfo.traits.forEach(trait => {
        const li = document.createElement('li');
        li.textContent = trait;
        traitsList.appendChild(li);
    });
    
    // 显示维度分析
    showDimensionChart(result);
    
    // 收集用户数据
    collectUserData(result, personalityInfo);
    
    // 发送完成事件
    gtag('event', 'test_complete', {
        'test_id': currentTestId,
        'personality_type': result.type,
        'completion_time': new Date().toISOString()
    });
}

function showDimensionChart(result) {
    const chart = document.getElementById('dimension-chart');
    chart.innerHTML = '';
    
    const dimensions = [
        { label: '外向-内向', left: 'E', right: 'I', leftScore: result.scores.E, rightScore: result.scores.I },
        { label: '感觉-直觉', left: 'S', right: 'N', leftScore: result.scores.S, rightScore: result.scores.N },
        { label: '思考-情感', left: 'T', right: 'F', leftScore: result.scores.T, rightScore: result.scores.F },
        { label: '判断-知觉', left: 'J', right: 'P', leftScore: result.scores.J, rightScore: result.scores.P }
    ];
    
    dimensions.forEach(dim => {
        const total = dim.leftScore + dim.rightScore;
        const leftPercent = total > 0 ? Math.round((dim.leftScore / total) * 100) : 50;
        const rightPercent = 100 - leftPercent;
        
        const bar = document.createElement('div');
        bar.className = 'dimension-bar';
        bar.innerHTML = `
            <div class="dimension-label">${dim.label}</div>
            <div class="dimension-scale">
                <div class="dimension-fill" style="width: ${leftPercent}%"></div>
            </div>
            <div style="margin-left: 10px; font-size: 0.8rem; color: #666;">
                ${dim.left} ${leftPercent}% | ${dim.right} ${rightPercent}%
            </div>
        `;
        chart.appendChild(bar);
    });
}

function collectUserData(result, personalityInfo) {
    const userData = {
        testId: currentTestId,
        timestamp: new Date().toISOString(),
        personalityResult: {
            type: result.type,
            name: personalityInfo.name,
            description: personalityInfo.description,
            traits: personalityInfo.traits
        },
        detailedAnalysis: result,
        answers: userAnswers,
        summary: {
            totalQuestions: questions.length,
            answeredQuestions: answers.length,
            completionRate: ((answers.length / questions.length) * 100).toFixed(1) + '%',
            testDuration: calculateTestDuration()
        }
    };
    
    // 将数据保存到本地存储
    saveToLocalStorage(userData);
    
    // 创建分享内容
    createShareContent(userData);
    
    console.log('用户MBTI测评数据：', JSON.stringify(userData, null, 2));
}

function calculateTestDuration() {
    if (userAnswers.length > 0) {
        const startTime = new Date(userAnswers[0].timestamp);
        const endTime = new Date(userAnswers[userAnswers.length - 1].timestamp);
        const duration = Math.round((endTime - startTime) / 1000);
        return `${duration}秒`;
    }
    return '未知';
}

function generateTestId() {
    return 'mbti_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function saveToLocalStorage(data) {
    let records = JSON.parse(localStorage.getItem('mbti_records') || '[]');
    records.push(data);
    localStorage.setItem('mbti_records', JSON.stringify(records));
    localStorage.setItem('current_mbti_result', JSON.stringify(data));
}

function createShareContent(userData) {
    const shareText = `我在MBTI性格测评中获得了 ${userData.personalityResult.type} (${userData.personalityResult.name}) 类型！\n\n` +
        `${userData.personalityResult.description}\n\n` +
        `快来测测你的性格类型吧！`;
    
    window.mbtiShareContent = {
        text: shareText,
        url: window.location.href,
        type: userData.personalityResult.type,
        name: userData.personalityResult.name
    };
}

// 分享功能
function showShareModal() {
    document.getElementById('share-modal').style.display = 'flex';
}

function closeShareModal() {
    document.getElementById('share-modal').style.display = 'none';
}

function handleShare(event) {
    const platform = event.target.dataset.platform;
    const shareData = window.mbtiShareContent;
    
    if (!shareData) return;
    
    switch (platform) {
        case 'wechat':
            alert('请截图保存结果，在微信中分享');
            break;
        case 'weibo':
            const weiboUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
            window.open(weiboUrl, '_blank');
            break;
        case 'qq':
            const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?title=MBTI性格测评&summary=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
            window.open(qqUrl, '_blank');
            break;
        case 'link':
            navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => {
                alert('分享内容已复制到剪贴板');
            });
            break;
    }
    
    closeShareModal();
    
    // 发送分享事件
    gtag('event', 'share_result', {
        'test_id': currentTestId,
        'platform': platform,
        'personality_type': shareData.type
    });
}

function downloadReport() {
    const currentData = JSON.parse(localStorage.getItem('current_mbti_result'));
    if (!currentData) return;
    
    const report = generateDetailedReport(currentData);
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MBTI详细报告_${currentData.personalityResult.type}_${new Date().toISOString().split('T')[0]}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // 发送下载事件
    gtag('event', 'download_report', {
        'test_id': currentTestId,
        'personality_type': currentData.personalityResult.type
    });
}

function generateDetailedReport(data) {
    return `
MBTI性格测评详细报告
====================

测试ID: ${data.testId}
测评时间: ${new Date(data.timestamp).toLocaleString('zh-CN')}
测试时长: ${data.summary.testDuration}

您的性格类型: ${data.personalityResult.type} - ${data.personalityResult.name}

类型描述:
${data.personalityResult.description}

维度分析:
${Object.entries(data.detailedAnalysis.breakdown).map(([key, value]) => {
    const total = value[key[0]] + value[key[1]];
    const leftPercent = total > 0 ? Math.round((value[key[0]] / total) * 100) : 50;
    const rightPercent = 100 - leftPercent;
    return `${key}: ${key[0]} ${leftPercent}% | ${key[1]} ${rightPercent}%`;
}).join('\n')}

核心特征:
${data.personalityResult.traits.map(trait => '• ' + trait).join('\n')}

答题详情:
${data.answers.map((answer, index) => `
${index + 1}. [${answer.category}] ${answer.question}
   选择: ${answer.selectedOption}
   时间: ${new Date(answer.timestamp).toLocaleTimeString('zh-CN')}`).join('')}

完成度: ${data.summary.completionRate}

---
本报告由MBTI在线测评系统生成
访问 ${window.location.origin} 进行更多测试

隐私声明: 所有数据仅保存在您的设备本地，未经您的同意不会上传到服务器。
    `.trim();
}

function restartQuiz() {
    currentQuestionIndex = 0;
    answers = [];
    userAnswers = [];
    currentTestId = generateTestId();
    
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('progress-bar').style.display = 'block';
    
    showWelcome();
    
    // 发送重新开始事件
    gtag('event', 'test_restart', {
        'test_id': currentTestId,
        'timestamp': new Date().toISOString()
    });
}

// 导出功能增强
function exportAllData() {
    const records = JSON.parse(localStorage.getItem('mbti_records') || '[]');
    if (records.length === 0) {
        alert('暂无历史记录');
        return;
    }
    
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mbti_all_data_${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    gtag('event', 'export_all_data', {
        'record_count': records.length
    });
}

function viewHistory() {
    const records = JSON.parse(localStorage.getItem('mbti_records') || '[]');
    if (records.length === 0) {
        alert('暂无历史记录');
        return;
    }
    
    console.log('=== 历史测评记录 ===');
    records.forEach((record, index) => {
        console.log(`${index + 1}. ${record.personalityResult.type} - ${new Date(record.timestamp).toLocaleString('zh-CN')}`);
    });
    
    alert(`共找到 ${records.length} 条测评记录，详情已打印到控制台`);
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', function() {
    initQuiz();
    
    // 为选项按钮添加点击事件
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const answer = this.getAttribute('data-value');
            selectAnswer(answer);
        });
    });
});

// 键盘支持
document.addEventListener('keydown', function(e) {
    if (document.getElementById('quiz-container').style.display === 'block' && 
        document.getElementById('question-container').style.display !== 'none') {
        if (e.key === '1' || e.key === 'a' || e.key === 'A') {
            selectAnswer('A');
        } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
            selectAnswer('B');
        }
    }
});

// 在控制台提供额外功能
console.log(`
🎯 MBTI测评系统已加载
================
📊 版本: 1.0.0
🔧 可用命令：
- viewHistory() - 查看历史记录
- exportAllData() - 导出所有数据
- restartQuiz() - 重新开始测试

💡 使用提示：
- 按 1/A 或 2/B 键快速答题
- 结果页面支持分享和下载
- 所有数据保存在浏览器本地
`);

// 在文件末尾添加：

// Google Sheets数据收集集成
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSc8_b-8kTu8oyrTkqsuJdMDmg5w2-A5S9o4fIFy2QNg0UbvH7MUbDxfZ-3tl8GE8o/exec'; // 替换为您的实际URL

async function sendResultsToGoogleSheets(results) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbwSc8_b-8kTu8oyrTkqsuJdMDmg5w2-A5S9o4fIFy2QNg0UbvH7MUbDxfZ-3tl8GE8o/exec') {
        console.log('Google Sheets集成未配置');
        return;
    }

    const data = {
        personalityType: results.type,
        scores: results.scores,
        answers: userAnswers,
        completionTime: results.completionTime,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 200),
        referrer: document.referrer || '直接访问',
        url: window.location.href
    };

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'},
            mode: 'cors'
        });
        
        const result = await response.json();
        console.log('✅ 测试结果已保存到Google Sheets');
        return result.success;
    } catch (error) {
        console.error('❌ 数据保存失败:', error);
        return false;
    }
}

// 修改showResults函数，在显示结果后发送数据
const originalShowResults = showResults;
showResults = async function() {
    const results = originalShowResults();
    
    // 异步发送数据（不影响用户体验）
    setTimeout(() => {
        sendResultsToGoogleSheets(results);
    }, 1000);
    
    return results;
};
