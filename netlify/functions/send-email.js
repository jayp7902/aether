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

        console.log('메일 발송 요청:', { to, subject, type });
        
        // 환경 변수 확인
        console.log('환경 변수 확인:', {
            hasPassword: !!process.env.GMAIL_APP_PASSWORD,
            passwordLength: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length : 0,
            passwordStart: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.substring(0, 4) + '...' : 'undefined'
        });

        // Gmail SMTP 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'info@aether-store.jp',
                pass: process.env.GMAIL_APP_PASSWORD // 환경변수에서 앱 비밀번호 가져오기
            }
        });

        // 여러 수신자 처리 (쉼표로 구분된 이메일 주소)
        const recipients = to.split(',').map(email => email.trim()).filter(email => email);
        console.log('수신자 목록:', recipients);

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
                html = loadEmailTemplate('event', {
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

        // 각 수신자에게 개별 메일 발송
        const results = [];
        for (const recipient of recipients) {
            const mailOptions = {
                from: 'info@aether-store.jp',
                to: recipient,
                subject: subject,
                html: html
            };

            try {
                const result = await transporter.sendMail(mailOptions);
                results.push({ recipient, success: true, messageId: result.messageId });
                console.log(`메일 발송 성공: ${recipient}`);
            } catch (error) {
                results.push({ recipient, success: false, error: error.message });
                console.error(`메일 발송 실패: ${recipient}`, error);
            }
        }

        // 성공/실패 통계
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: successCount > 0, 
                successCount,
                failCount,
                totalRecipients: recipients.length,
                results: results,
                type: type 
            })
        };

    } catch (error) {
        console.error('메일 발송 오류:', error);
        console.error('오류 상세:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message,
                details: {
                    code: error.code,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            })
        };
    }
};