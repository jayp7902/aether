const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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

        // 메일 타입별 HTML 생성
        let html = '';
        switch (type) {
            case 'welcome':
                html = generateWelcomeEmail(data);
                break;
            case 'order-complete':
                html = generateOrderCompleteEmail(data);
                break;
            case 'shipping-start':
                html = generateShippingStartEmail(data);
                break;
            case 'event':
                html = generateEventEmail(data);
                break;
            case 'bulk':
                html = generateBulkEmail(data);
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

// 환영 메일 HTML 생성
function generateWelcomeEmail(data) {
    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ようこそ Aether Storeへ</title>
        <style>
            body { font-family: 'Noto Sans JP', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px; }
            .welcome-title { font-size: 24px; color: #000; margin-bottom: 20px; text-align: center; }
            .points-section { background-color: #f8f9fa; border: 2px solid #333; padding: 20px; margin: 20px 0; text-align: center; }
            .points-amount { font-size: 32px; font-weight: bold; color: #000; margin: 10px 0; }
            .info-section { margin: 20px 0; line-height: 1.6; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; background-color: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Aether Store</div>
                <div>韓国コスメティック専門店</div>
            </div>
            <div class="content">
                <h1 class="welcome-title">ようこそ Aether Storeへ！</h1>
                <div class="info-section">
                    <p>この度は、Aether Storeにご登録いただき、誠にありがとうございます。</p>
                    <p>韓国コスメティックの最新トレンドをお届けする、Aether Storeをどうぞお楽しみください。</p>
                </div>
                <div class="points-section">
                    <h3>🎉 ウェルカムボーナスポイント</h3>
                    <div class="points-amount">300ポイント</div>
                    <p>ご登録おめでとうございます！<br>300ポイントをプレゼントいたします。</p>
                </div>
                <div class="info-section">
                    <h3>ポイントのご利用方法</h3>
                    <ul>
                        <li>1ポイント = 1円としてご利用いただけます</li>
                        <li>マイページからポイント残高をご確認いただけます</li>
                        <li>お買い物時に自動的にポイントが適用されます</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://aether-store.jp/profile" class="button">マイページへ</a>
                    <a href="https://aether-store.jp/shop" class="button">ショッピングを始める</a>
                </div>
            </div>
            <div class="footer">
                <p>株式会社JAYCOS</p>
                <p>〒169-0072 東京都新宿区大久保2丁目21-10 ジュネス大久保 102号</p>
                <p>Tel: 03.3200.5547 | Email: info@aether-store.jp</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 주문 완료 메일 HTML 생성
function generateOrderCompleteEmail(data) {
    const productList = data.items ? data.items.map(item => 
        `<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
            <span>${item.name || item.productName} x ${item.quantity || 1}</span>
            <span>¥${(item.price || item.unitPrice || 0).toLocaleString()}</span>
        </div>`
    ).join('') : '';

    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ご注文完了のお知らせ</title>
        <style>
            body { font-family: 'Noto Sans JP', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px; }
            .order-title { font-size: 24px; color: #000; margin-bottom: 20px; text-align: center; }
            .order-info { background-color: #f8f9fa; border: 2px solid #333; padding: 20px; margin: 20px 0; }
            .order-number { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 10px; }
            .shipping-info { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #333; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Aether Store</div>
                <div>韓国コスメティック専門店</div>
            </div>
            <div class="content">
                <h1 class="order-title">ご注文完了のお知らせ</h1>
                <div class="order-info">
                    <div class="order-number">注文番号: ${data.orderId}</div>
                    <p>この度は、Aether Storeをご利用いただき、誠にありがとうございます。<br>ご注文が正常に完了いたしました。</p>
                </div>
                <div class="product-list">
                    <h3>ご注文商品</h3>
                    ${productList}
                </div>
                <div class="shipping-info">
                    <h3>配送について</h3>
                    <p>・配送は営業日3日以内に順次発送いたします。</p>
                    <p>・配送完了時にはメールでご案内いたします。</p>
                    <p>・配送状況はマイページからご確認いただけます。</p>
                </div>
            </div>
            <div class="footer">
                <p>株式会社JAYCOS</p>
                <p>〒169-0072 東京都新宿区大久保2丁目21-10 ジュネス大久保 102号</p>
                <p>Tel: 03.3200.5547 | Email: info@aether-store.jp</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 배송 시작 메일 HTML 생성
function generateShippingStartEmail(data) {
    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>配送開始のお知らせ</title>
        <style>
            body { font-family: 'Noto Sans JP', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px; }
            .shipping-title { font-size: 24px; color: #000; margin-bottom: 20px; text-align: center; }
            .shipping-info { background-color: #f8f9fa; border: 2px solid #333; padding: 20px; margin: 20px 0; }
            .tracking-number { font-size: 18px; font-weight: bold; color: #000; margin: 15px 0; padding: 10px; background-color: #fff; border: 1px solid #333; text-align: center; }
            .notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Aether Store</div>
                <div>韓国コスメティック専門店</div>
            </div>
            <div class="content">
                <h1 class="shipping-title">配送開始のお知らせ</h1>
                <div class="shipping-info">
                    <p>お客様のご注文商品の配送を開始いたしました。</p>
                    <p>注文番号: ${data.orderId}</p>
                </div>
                <div class="tracking-number">
                    配送追跡番号: ${data.trackingNumber}
                </div>
                <div class="notice">
                    <p><strong>📧 メール版での配送時には追跡番号が表示されない場合があります。</strong></p>
                    <p>メールボックスをご確認ください。</p>
                </div>
            </div>
            <div class="footer">
                <p>株式会社JAYCOS</p>
                <p>〒169-0072 東京都新宿区大久保2丁目21-10 ジュネス大久保 102号</p>
                <p>Tel: 03.3200.5547 | Email: info@aether-store.jp</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 이벤트 메일 HTML 생성
function generateEventEmail(data) {
    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
            body { font-family: 'Noto Sans JP', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px; }
            .event-title { font-size: 24px; color: #000; margin-bottom: 20px; text-align: center; }
            .event-content { margin: 20px 0; line-height: 1.6; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Aether Store</div>
                <div>韓国コスメティック専門店</div>
            </div>
            <div class="content">
                <h1 class="event-title">${data.title}</h1>
                <div class="event-content">
                    ${data.content}
                </div>
            </div>
            <div class="footer">
                <p>株式会社JAYCOS</p>
                <p>〒169-0072 東京都新宿区大久保2丁目21-10 ジュネス大久保 102号</p>
                <p>Tel: 03.3200.5547 | Email: info@aether-store.jp</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 일괄 메일 HTML 생성
function generateBulkEmail(data) {
    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.subject}</title>
        <style>
            body { font-family: 'Noto Sans JP', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; color: #333; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Aether Store</div>
                <div>韓国コスメティック専門店</div>
            </div>
            <div class="content">
                ${data.content}
            </div>
            <div class="footer">
                <p>株式会社JAYCOS</p>
                <p>〒169-0072 東京都新宿区大久保2丁目21-10 ジュネス大久保 102号</p>
                <p>Tel: 03.3200.5547 | Email: info@aether-store.jp</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
