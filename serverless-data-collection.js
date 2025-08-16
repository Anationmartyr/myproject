// 无服务器数据收集方案
// 使用免费的第三方服务收集用户测试结果

const DataCollector = {
    // 方案1：使用Google Apps Script（免费）
    googleAppsScript: {
        // 在Google Apps Script中创建以下代码：
        /*
        // Google Apps Script代码（在https://script.google.com创建）
        function doPost(e) {
            const data = JSON.parse(e.postData.contents);
            const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
            
            sheet.appendRow([
                new Date(),
                data.personalityType,
                data.scores.EI,
                data.scores.SN,
                data.scores.TF,
                data.scores.JP,
                JSON.stringify(data.answers),
                data.completionTime,
                data.userAgent,
                data.ipAddress
            ]);
            
            return ContentService.createTextOutput(JSON.stringify({success: true}))
                .setMimeType(ContentService.MimeType.JSON);
        }
        */
        
        endpoint: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
        
        async sendData(data) {
            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {'Content-Type': 'application/json'}
                });
                return await response.json();
            } catch (error) {
                console.error('数据发送失败:', error);
            }
        }
    },

    // 方案2：使用Netlify Functions（免费）
    netlifyFunctions: {
        /*
        // 在netlify/functions/collect-results.js中创建：
        exports.handler = async (event, context) => {
            const data = JSON.parse(event.body);
            
            // 这里可以保存到数据库或发送邮件
            console.log('收到测试结果:', data);
            
            return {
                statusCode: 200,
                body: JSON.stringify({success: true})
            };
        };
        */
        
        endpoint: '/.netlify/functions/collect-results',
        
        async sendData(data) {
            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {'Content-Type': 'application/json'}
                });
                return await response.json();
            } catch (error) {
                console.error('数据发送失败:', error);
            }
        }
    },

    // 方案3：使用EmailJS（免费邮件通知）
    emailJS: {
        serviceId: 'your_service_id',
        templateId: 'your_template_id',
        publicKey: 'your_public_key',
        
        async sendData(data) {
            const templateParams = {
                personality_type: data.personalityType,
                ei_score: data.scores.EI,
                sn_score: data.scores.SN,
                tf_score: data.scores.TF,
                jp_score: data.scores.JP,
                answers: JSON.stringify(data.answers, null, 2),
                completion_time: data.completionTime,
                timestamp: new Date().toLocaleString('zh-CN')
            };
            
            try {
                // 需要在HTML中引入EmailJS
                // <script src="https://cdn.emailjs.com/sdk/3.2.0/email.min.js"></script>
                if (typeof emailjs !== 'undefined') {
                    await emailjs.send(this.serviceId, this.templateId, templateParams);
                    return {success: true};
                }
            } catch (error) {
                console.error('邮件发送失败:', error);
            }
        }
    },

    // 方案4：使用Airtable（免费数据库）
    airtable: {
        baseId: 'your_airtable_base_id',
        apiKey: 'your_airtable_api_key',
        tableName: 'MBTI_Results',
        
        async sendData(data) {
            try {
                const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/${this.tableName}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fields: {
                            'Personality Type': data.personalityType,
                            'EI Score': data.scores.EI,
                            'SN Score': data.scores.SN,
                            'TF Score': data.scores.TF,
                            'JP Score': data.scores.JP,
                            'Answers': JSON.stringify(data.answers),
                            'Completion Time': data.completionTime,
                            'Timestamp': new Date().toISOString()
                        }
                    })
                });
                return await response.json();
            } catch (error) {
                console.error('Airtable数据发送失败:', error);
            }
        }
    },

    // 通用数据收集方法
    async collectResults(results) {
        const data = {
            personalityType: results.type,
            scores: results.scores,
            answers: results.answers,
            completionTime: results.completionTime,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };

        // 同时发送到多个服务（提高成功率）
        const promises = [
            this.googleAppsScript.sendData(data),
            this.emailJS.sendData(data),
            this.airtable.sendData(data)
        ];

        // 至少一个成功即可
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success);
        
        return successful.length > 0;
    }
};

// 集成到现有quiz.js中
// 在showResults函数最后添加：
window.collectTestResults = async function(results) {
    try {
        const success = await DataCollector.collectResults(results);
        console.log('测试结果收集状态:', success ? '成功' : '失败');
    } catch (error) {
        console.error('结果收集错误:', error);
    }
};