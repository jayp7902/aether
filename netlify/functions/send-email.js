const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// 이메일 템플릿 로드 함수
function loadEmailTemplate(templateName, data = {}) {
    try {
        const templatePath = path.join(__dirname, '../../assets/email-templates', `${templateName}.html`);
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // 데이터 치환
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, data[key]);
        });
        
        return template;
    } catch (error) {
        console.error(`템플릿 로드 실패: ${templateName}`, error);
        return '<p>템플릿을 로드할 수 없습니다.</p>';
    }
}

exports.handler = async (event, context) => {
    // CORS 헤더 설정
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS 요청 처리
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // POST 요청만 허용
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { to, subject, type, data } = JSON.parse(event.body);

        // Gmail SMTP 설정
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: 'info@aether-store.jp',
                pass: process.env.GMAIL_APP_PASSWORD // 환경변수에서 앱 비밀번호 가져오기
            }
        });

        // 메일 타입별 HTML 생성 (템플릿 파일 사용)
        let html = '';
        switch (type) {
            case 'welcome':
                html = loadEmailTemplate('welcome', {
                    name: data.name || 'お客様',
                    points: data.points || 300
                });
                break;
            case 'order-complete':
                html = loadEmailTemplate('order-complete', {
                    orderId: data.orderId || 'N/A',
                    items: data.items || []
                });
                break;
            case 'shipping-start':
                html = loadEmailTemplate('shipping-start', {
                    orderId: data.orderId || 'N/A',
                    trackingNumber: data.trackingNumber || 'N/A'
                });
                break;
            case 'event':
                html = loadEmailTemplate('welcome', {
                    name: data.name || 'お客様',
                    title: data.title || 'イベントのお知らせ',
                    content: data.content || ''
                });
                break;
            case 'bulk':
                html = data.html || loadEmailTemplate('welcome', {
                    name: 'お客様',
                    content: data.content || ''
                });
                break;
            default:
                html = data.html || '<p>メールが送信されました。</p>';
        }

        // 메일 옵션 설정
        const mailOptions = {
            from: 'info@aether-store.jp',
            to: to,
            subject: subject,
            html: html
        };

        // 메일 발송
        const result = await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                messageId: result.messageId,
                type: type 
            })
        };

    } catch (error) {
        console.error('메일 발송 오류:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};