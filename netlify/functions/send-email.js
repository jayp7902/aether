const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// 이메일 템플릿 (Function 내부에 포함)
const emailTemplates = {
    'event': `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .event-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            text-align: center;
        }
        .event-content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            font-size: 14px;
            color: #666;
        }
        .highlight {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" class="logo">
        </div>
        
            <div class="content">
                <div class="event-title">{{title}}</div>
                
                <div class="highlight">
                    <p>こんにちは、{{name}}様！</p>
                </div>
                
                {{#if image}}
                <div class="event-image" style="text-align: center; margin: 20px 0;">
                    <img src="{{image}}" alt="{{title}}" style="max-width: 100%; height: auto; border-radius: 8px;">
                </div>
                {{/if}}
                
                <div class="event-content">
                    {{content}}
                </div>
            </div>
        
        <div class="footer">
            <p>このメールは自動送信されています。</p>
            <p>お問い合わせ: info@aether-store.jp</p>
        </div>
    </div>
</body>
</html>`,
    
    'welcome': `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ウェルカムメール</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
        .container { background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .content { margin-bottom: 30px; }
        .footer { text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AETHER</div>
            <p>韓国コスメブランド</p>
        </div>
        <div class="content">
            <h2>こんにちは、{{name}}さん！</h2>
            <p>Aetherにご登録いただき、ありがとうございます。</p>
            <p>ご登録特典として{{points}}ポイントをプレゼントいたします。</p>
            <p>ぜひお買い物をお楽しみください！</p>
        </div>
        <div class="footer">
            <p>AETHER - 韓国コスメブランド</p>
        </div>
    </div>
</body>
</html>`
};

// 이메일 템플릿 로드 함수
function loadEmailTemplate(templateName, data = {}) {
    try {
        console.log(`템플릿 로드 시도: ${templateName}`);
        
        let template = emailTemplates[templateName];
        if (!template) {
            console.error(`템플릿을 찾을 수 없음: ${templateName}`);
            return `<p>템플릿을 찾을 수 없습니다: ${templateName}</p>`;
        }
        
        // 데이터 치환
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, data[key]);
        });
        
        console.log(`템플릿 로드 성공: ${templateName}`);
        return template;
    } catch (error) {
        console.error(`템플릿 로드 실패: ${templateName}`, error);
        return `<p>템플릿을 로드할 수 없습니다. 오류: ${error.message}</p>`;
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
            // 개별 수신자용 HTML 생성 (이름 개별화)
            let personalizedHtml = html;
            
            // 고객별 실제 이름 사용
            const customerName = data.customerData && data.customerData[recipient] 
                ? data.customerData[recipient] 
                : recipient.split('@')[0]; // 백업: 이메일에서 이름 추출
            
            personalizedHtml = personalizedHtml.replace(/{{name}}/g, customerName);
            
            // 이미지 데이터 처리
            if (data.image) {
                let imageUrl = data.image;
                // Base64 데이터인지 확인
                if (imageUrl.startsWith('data:image/')) {
                    // Base64 이미지 데이터를 직접 사용
                    personalizedHtml = personalizedHtml.replace(/{{image}}/g, imageUrl);
                } else if (!imageUrl.startsWith('http')) {
                    // 상대 경로인 경우 절대 URL로 변환
                    imageUrl = `https://aether-store.jp/${imageUrl}`;
                    personalizedHtml = personalizedHtml.replace(/{{image}}/g, imageUrl);
                } else {
                    // 절대 URL인 경우 그대로 사용
                    personalizedHtml = personalizedHtml.replace(/{{image}}/g, imageUrl);
                }
            } else {
                // 이미지가 없는 경우 이미지 섹션 제거
                personalizedHtml = personalizedHtml.replace(/{{#if image}}[\s\S]*?{{\/if}}/g, '');
            }
            
            const mailOptions = {
                from: 'info@aether-store.jp',
                to: recipient,
                subject: subject,
                html: personalizedHtml
            };

            try {
                const result = await transporter.sendMail(mailOptions);
                results.push({ recipient, success: true, messageId: result.messageId });
                console.log(`메일 발송 성공: ${recipient} (${customerName})`);
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