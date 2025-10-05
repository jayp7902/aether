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
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Force white background */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Outlook specific styles */
        .outlook-bg {
            background-color: #ffffff !important;
        }
        
        /* Force white background on all elements */
        table, td, div, p {
            background-color: #ffffff !important;
            background: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Mobile specific styles */
        @media only screen and (max-width: 600px) {
            body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                background-image: none !important;
            }
            table {
                background-color: #ffffff !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            td {
                background-color: #ffffff !important;
                padding: 10px !important;
                border: none !important;
            }
            .mobile-bg-fix {
                background-color: #ffffff !important;
                background: #ffffff !important;
                background-image: none !important;
            }
        }
        
        /* iOS Mail specific */
        @media screen and (max-width: 600px) {
            body {
                -webkit-text-size-adjust: none !important;
                background-color: #ffffff !important;
            }
        }
        
        /* Android Gmail specific */
        .gmail-fix {
            display: none !important;
            display: none;
        }
        
        /* Gmail specific */
        u + .body .gmail-fix {
            display: none;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #ffffff !important;
            }
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
<body style="margin: 0; padding: 0; background-color: #ffffff;">
    <!--[if mso]>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff;">
        <tr>
            <td style="background-color: #ffffff; padding: 20px;">
    <![endif]-->
    
    <!-- Gmail fix -->
    <div class="gmail-fix" style="white-space: nowrap; font: 15px/1 courier;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div>
    
    <!-- VML Background for Outlook -->
    <!--[if mso]>
    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
        <v:fill type="tile" color="#ffffff" />
    </v:background>
    <![endif]-->
    
    <!-- 모바일 호환성을 위한 테이블 기반 구조 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="mobile-bg-fix">
        <tr>
            <td style="background-color: #ffffff; padding: 20px; mso-padding-alt: 20px;" class="mobile-bg-fix">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="mobile-bg-fix">
                    <!-- 헤더 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                            <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0;">
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px;">
                            <!-- 이벤트 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center; background-color: #ffffff;">{{title}}</div>
                            
                            <!-- 인사 -->
                            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; background-color: #f0f0f0;">こんにちは、{{name}}様！</p>
                            </div>
                            
                            <!-- 이미지 -->
                            <div style="text-align: center; margin: 20px 0; background-color: #ffffff;">
                                <img src="{{image}}" alt="{{title}}" style="max-width: 100%; height: auto; display: block; border: 0;">
                            </div>
                            
                            <!-- 이벤트 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff;">{{content}}</div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff;">お問い合わせ: info@aether-store.jp</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!--[if mso]>
            </td>
        </tr>
    </table>
    <![endif]-->
</body>
</html>`,
    
    'welcome': `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ウェルカムメール</title>
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Force white background */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Outlook specific styles */
        .outlook-bg {
            background-color: #ffffff !important;
        }
        
        /* Force white background on all elements */
        table, td, div, p {
            background-color: #ffffff !important;
            background: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Mobile specific styles */
        @media only screen and (max-width: 600px) {
            body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                background-image: none !important;
            }
            table {
                background-color: #ffffff !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            td {
                background-color: #ffffff !important;
                padding: 10px !important;
                border: none !important;
            }
            .mobile-bg-fix {
                background-color: #ffffff !important;
                background: #ffffff !important;
                background-image: none !important;
            }
        }
        
        /* iOS Mail specific */
        @media screen and (max-width: 600px) {
            body {
                -webkit-text-size-adjust: none !important;
                background-color: #ffffff !important;
            }
        }
        
        /* Android Gmail specific */
        .gmail-fix {
            display: none !important;
            display: none;
        }
        
        /* Gmail specific */
        u + .body .gmail-fix {
            display: none;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #ffffff !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
    <!--[if mso]>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff;">
        <tr>
            <td style="background-color: #ffffff; padding: 20px;">
    <![endif]-->
    
    <!-- Gmail fix -->
    <div class="gmail-fix" style="white-space: nowrap; font: 15px/1 courier;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div>
    
    <!-- VML Background for Outlook -->
    <!--[if mso]>
    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
        <v:fill type="tile" color="#ffffff" />
    </v:background>
    <![endif]-->
    
    <!-- 모바일 호환성을 위한 테이블 기반 구조 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="mobile-bg-fix">
        <tr>
            <td style="background-color: #ffffff; padding: 20px; mso-padding-alt: 20px;" class="mobile-bg-fix">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="mobile-bg-fix">
                    <!-- 헤더 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                            <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0;">
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px;">
                            <!-- 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center; background-color: #ffffff;">ようこそ Aether Storeへ！</div>
                            
                            <!-- 인사 -->
                            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; background-color: #f0f0f0;">こんにちは、{{name}}様！</p>
                            </div>
                            
                            <!-- 환영 메시지 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff;">
                                <p>Aetherにご登録いただき、ありがとうございます。</p>
                                <p>ご登録特典として<strong style="color: #333; background-color: #ffffff;">{{points}}ポイント</strong>をプレゼントいたします。</p>
                                <p>ぜひお買い物をお楽しみください！</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff;">お問い合わせ: info@aether-store.jp</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!--[if mso]>
            </td>
        </tr>
    </table>
    <![endif]-->
</body>
</html>`,
    
    'order-complete': `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>注文完了メール</title>
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Force white background */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Force white background on all elements */
        table, td, div, p {
            background-color: #ffffff !important;
            background: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Mobile specific styles */
        @media only screen and (max-width: 600px) {
            body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                background-image: none !important;
            }
            table {
                background-color: #ffffff !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            td {
                background-color: #ffffff !important;
                padding: 10px !important;
                border: none !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
    <!--[if mso]>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff;">
        <tr>
            <td style="background-color: #ffffff; padding: 20px;">
    <![endif]-->
    
    <!-- 모바일 호환성을 위한 테이블 기반 구조 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
        <tr>
            <td style="background-color: #ffffff; padding: 20px; mso-padding-alt: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                    <!-- 헤더 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                            <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0;">
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px;">
                            <!-- 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center; background-color: #ffffff;">ご注文ありがとうございます！</div>
                            
                            <!-- 주문 번호 -->
                            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; background-color: #f0f0f0;">注文番号: <strong>{{orderId}}</strong></p>
                            </div>
                            
                            <!-- 주문 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff;">
                                <p>ご注文いただき、誠にありがとうございます。</p>
                                <p>以下の商品をお申し込みいただきました：</p>
                                <p>{{items}}</p>
                                <p>商品の準備ができ次第、配送いたします。</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff;">お問い合わせ: info@aether-store.jp</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!--[if mso]>
            </td>
        </tr>
    </table>
    <![endif]-->
</body>
</html>`,
    
    'points-earned': `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ポイント獲得メール</title>
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Force white background */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Force white background on all elements */
        table, td, div, p {
            background-color: #ffffff !important;
            background: #ffffff !important;
            mso-background-color: #ffffff !important;
        }
        
        /* Mobile specific styles */
        @media only screen and (max-width: 600px) {
            body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                background-image: none !important;
            }
            table {
                background-color: #ffffff !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            td {
                background-color: #ffffff !important;
                padding: 10px !important;
                border: none !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
    <!--[if mso]>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff;">
        <tr>
            <td style="background-color: #ffffff; padding: 20px;">
    <![endif]-->
    
    <!-- 모바일 호환성을 위한 테이블 기반 구조 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
        <tr>
            <td style="background-color: #ffffff; padding: 20px; mso-padding-alt: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                    <!-- 헤더 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                            <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0;">
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px;">
                            <!-- 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center; background-color: #ffffff;">ポイントを獲得しました！</div>
                            
                            <!-- 포인트 정보 -->
                            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; background-color: #f0f0f0;">獲得ポイント: <strong style="color: #333; background-color: #f0f0f0;">{{points}}ポイント</strong></p>
                            </div>
                            
                            <!-- 포인트 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff;">
                                <p>お買い物ありがとうございます！</p>
                                <p>{{reason}}により、{{points}}ポイントを獲得いたしました。</p>
                                <p>獲得したポイントは次回のお買い物でご利用いただけます。</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff;">お問い合わせ: info@aether-store.jp</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!--[if mso]>
            </td>
        </tr>
    </table>
    <![endif]-->
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
        console.log('📧 받은 데이터:', data);
        console.log('📧 고객 데이터:', data.customerData);
        
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
                // 이벤트 메일은 개별 고객별로 처리하므로 여기서는 기본 템플릿만 로드
                html = loadEmailTemplate('event', {
                    title: data.title || 'イベントのお知らせ',
                    content: data.content || '',
                    image: data.image || ''
                });
                break;
            case 'test':
                // 테스트 메일 - 선택된 템플릿 타입에 따라 처리
                const templateType = data.templateType || 'welcome';
                console.log(`테스트 메일 템플릿 타입: ${templateType}`);
                
                switch (templateType) {
                    case 'welcome':
                        html = loadEmailTemplate('welcome', {
                            name: data.name || 'テストユーザー',
                            points: data.points || 300
                        });
                        break;
                    case 'order-complete':
                        html = loadEmailTemplate('order-complete', {
                            orderId: data.orderId || 'TEST-001',
                            items: Array.isArray(data.items) ? data.items.join(', ') : (data.items || 'テスト商品1, テスト商品2')
                        });
                        break;
                    case 'points-earned':
                        html = loadEmailTemplate('points-earned', {
                            points: data.points || 100,
                            reason: data.reason || 'テストポイント獲得'
                        });
                        break;
                    case 'event':
                        html = loadEmailTemplate('event', {
                            title: data.title || 'テストイベント',
                            content: data.content || 'これはテストメールです。',
                            image: data.image || '',
                            name: data.name || 'テストユーザー'
                        });
                        break;
                    default:
                        html = loadEmailTemplate('welcome', {
                            name: data.name || 'テストユーザー',
                            points: data.points || 300
                        });
                }
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
            console.log(`📧 ${recipient} 처리 시작`);
            console.log(`📧 받은 고객 데이터:`, data.customerData);
            
            let customerName = data.customerData && data.customerData[recipient] 
                ? data.customerData[recipient] 
                : recipient.split('@')[0]; // 백업: 이메일에서 이름 추출
            
            console.log(`📧 초기 이름:`, customerName);
            
            // 이름이 "名前なし"인 경우 이메일에서 추출
            if (customerName === '名前なし' || !customerName) {
                customerName = recipient.split('@')[0];
                console.log(`📧 이름이 없어서 이메일에서 추출:`, customerName);
            }
            
            console.log(`📧 최종 사용할 이름:`, customerName);
            
            personalizedHtml = personalizedHtml.replace(/{{name}}/g, customerName);
            console.log(`📧 HTML에서 {{name}} 치환 완료`);
            
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
                // 이미지가 없는 경우 이미지 섹션을 숨김
                personalizedHtml = personalizedHtml.replace(/<!-- 이미지 -->[\s\S]*?<\/div>/g, '');
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
};