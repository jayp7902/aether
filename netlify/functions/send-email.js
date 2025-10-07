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
                            <a href="https://aether-store.jp" style="text-decoration: none; display: inline-block;">
                                <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0; margin: 0 auto;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px; text-align: center;">
                            <!-- 이벤트 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center; background-color: #ffffff;">{{title}}</div>
                            
                            <!-- 이미지 -->
                            <div style="text-align: center; margin: 20px 0; background-color: #ffffff;">
                                <img src="{{image}}" alt="{{title}}" style="max-width: 100%; height: auto; display: block; border: 0; margin: 0 auto;">
                            </div>
                            
                            <!-- 이벤트 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">{{content}}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff; color: #666 !important;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff; color: #666 !important;">お問い合わせ: <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a></p>
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
            margin: 0 auto !important;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
            text-align: center !important;
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
                            <a href="https://aether-store.jp" style="text-decoration: none; display: inline-block;">
                                <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0; margin: 0 auto;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px; text-align: center;">
                            <!-- 환영 메시지 -->
                            <div style="font-size: 13.6px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; font-size: 16px !important; max-width: 400px !important; font-weight: bold !important; color: #333 !important; background-color: #ffffff !important;">こんにちは、<span style="color: #333 !important; text-decoration: none !important; background-color: #ffffff !important;">{{name}}</span>様！</p>
                                <p style="text-align: center !important; margin: 10px auto !important; font-size: 13.6px !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">Aetherにご登録いただき、ありがとうございます。</p>
                                <p style="text-align: center !important; margin: 10px auto !important; font-size: 13.6px !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">ご登録特典として<strong style="color: #333 !important; background-color: #ffffff !important;">{{points}}ポイント</strong>をプレゼントいたします。</p>
                                <p style="text-align: center !important; margin: 10px auto !important; font-size: 13.6px !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">ぜひお買い物をお楽しみください！</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff; color: #666 !important;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff; color: #666 !important;">お問い合わせ: <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a></p>
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
        
        /* 모바일 메일 클라이언트용 전체 배경 흰색 강제 */
        html {
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        /* Force white background - 모바일 호환성 강화 */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto !important;
            padding: 20px !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
            /* 모바일 메일 클라이언트용 추가 속성 */
            background-image: none !important;
            background-attachment: scroll !important;
            background-position: 0% 0% !important;
            background-repeat: repeat !important;
        }
        
        /* 모바일에서 흰색 배경 강제 적용 */
        @media only screen and (max-width: 600px) {
            html, body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                -webkit-background-color: #ffffff !important;
            }
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
    
    <!-- Gmail 모바일 호환성을 위한 특별한 구조 -->
    <div class="gmail-fix" style="white-space: nowrap; font: 15px courier; line-height: 0;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div>
    
    <!-- 모바일 호환성을 위한 테이블 기반 구조 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
                <td style="background-color: #ffffff; padding: 20px; mso-padding-alt: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                        <!-- 헤더 -->
                        <tr>
                            <td style="background-color: #ffffff; text-align: center !important; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                                <a href="https://aether-store.jp" style="text-decoration: none; display: inline-block; text-align: center !important;">
                                    <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0; margin: 0 auto !important; text-align: center !important;">
                                </a>
                            </td>
                        </tr>
                        
                        <!-- 콘텐츠 -->
                        <tr>
                            <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px; text-align: center !important;">
                                <!-- 제목 -->
                                <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center !important; background-color: #ffffff;">ご注文ありがとうございます！</div>
                            
                            <!-- 주문 번호 -->
                            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center !important;">
                                <p style="margin: 0; background-color: #f0f0f0; text-align: center !important;">注文番号: <strong>{{orderId}}</strong></p>
            </div>
                            
                            <!-- 주문 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">ご注文いただき、誠にありがとうございます。</p>
                                
                                <!-- 주문 상세 정보 -->
                                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left !important; max-width: 500px; margin-left: auto; margin-right: auto;">
                                    <h3 style="text-align: center !important; margin-bottom: 15px; color: #333;">注文詳細</h3>
                                    
                                    <!-- 주문 상품 -->
                                    <div style="margin-bottom: 15px;">
                                        <strong>注文商品:</strong><br>
                                        <div style="margin-top: 5px;">{{items}}</div>
                </div>
                                    
                                    <!-- 결제 정보 -->
                                    <div style="margin-bottom: 15px;">
                                        <strong>支払い方法:</strong> {{paymentMethod}}<br>
                                        <strong>商品代金:</strong> {{subtotal}}<br>
                                        <strong>配送料:</strong> {{shipping}}<br>
                                        <strong>使用ポイント:</strong> {{pointsUsed}}<br>
                                        <hr style="border: 1px solid #ddd; margin: 10px 0;">
                                        <strong style="font-size: 18px; color: #333;">合計金額: {{totalAmount}}</strong>
                </div>
                                    
                                    <!-- 배송 정보 -->
                                    <div>
                                        <strong>配送先:</strong><br>
                                        <div style="margin-top: 5px;">{{shippingAddress}}</div>
                </div>
                </div>
                                
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">商品の準備ができ次第、配送いたします。</p>
            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff; color: #666 !important;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff; color: #666 !important;">お問い合わせ: <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!-- Gmail 모바일 호환성을 위한 특별한 구조 끝 -->
    <div class="gmail-fix" style="white-space: nowrap; font: 15px courier; line-height: 0;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div>
    
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
                            <a href="https://aether-store.jp" style="text-decoration: none; display: inline-block;">
                                <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0; margin: 0 auto;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px; text-align: center;">
                            <!-- 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center; background-color: #ffffff;">ポイントを獲得しました！</div>
                            
                            <!-- 포인트 정보 -->
                            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; background-color: #f0f0f0;">獲得ポイント: <strong style="color: #333; background-color: #f0f0f0;">{{points}}ポイント</strong></p>
            </div>
                            
                            <!-- 포인트 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">お買い物ありがとうございます！</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">{{reason}}により、{{points}}ポイントを獲得いたしました。</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">獲得したポイントは次回のお買い物でご利用いただけます。</p>
                </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff; color: #666 !important;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff; color: #666 !important;">お問い合わせ: <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a></p>
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

    'password-reset': `<!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>パスワードリセット</title>
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
            margin: 0 auto !important;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
            text-align: center !important;
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
                        <td style="background-color: #ffffff; text-align: center !important; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                            <a href="https://aether-store.jp" style="text-decoration: none; display: inline-block;">
                                <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0; margin: 0 auto;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px; text-align: center;">
                            <!-- 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center !important; background-color: #ffffff;">パスワードリセットのお知らせ</div>
                            
                            <!-- 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">{{email}}様</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">パスワードリセットのご依頼を承りました。</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">以下のボタンをクリックして、新しいパスワードを設定してください。</p>
            </div>
                            
                            <!-- 리셋 버튼 -->
                            <div style="text-align: center !important; margin: 30px 0; background-color: #ffffff;">
                                <a href="{{resetLink}}" style="display: inline-block; background-color: #333; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; background-color: #333 !important; color: #ffffff !important;">
                                    パスワードをリセット
                                </a>
                </div>
                            
                            <!-- 안내 메시지 -->
                            <div style="font-size: 14px; line-height: 1.6; margin-top: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #666 !important; background-color: #ffffff !important;">※このメールに心当たりがない場合は、無視してください。</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #666 !important; background-color: #ffffff !important;">※リンクの有効期限は24時間です。</p>
                </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff; color: #666 !important;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff; color: #666 !important;">お問い合わせ: <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a></p>
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

    'order-cancelled': `<!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>注文キャンセル</title>
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
            margin: 0 auto !important;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
            text-align: center !important;
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
                        <td style="background-color: #ffffff; text-align: center !important; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                            <a href="https://aether-store.jp" style="text-decoration: none; display: inline-block;">
                                <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0; margin: 0 auto;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px; text-align: center;">
                            <!-- 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center !important; background-color: #ffffff;">注文キャンセルのお知らせ</div>
                            
                            <!-- 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">{{customerName}}様</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">いつもAether Storeをご利用いただき、ありがとうございます。</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #333 !important; background-color: #ffffff !important;">下記のご注文がキャンセルされました。</p>
            </div>
                            
                            <!-- 주문 정보 -->
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center !important;">
                                <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; background-color: #f8f9fa;">注文詳細</div>
                                <div style="font-size: 16px; color: #333; margin-bottom: 8px; background-color: #f8f9fa;"><strong>注文番号:</strong> {{orderId}}</div>
                                <div style="font-size: 16px; color: #333; margin-bottom: 8px; background-color: #f8f9fa;"><strong>支払い方法:</strong> {{paymentMethod}}</div>
                                <div style="font-size: 16px; color: #333; margin-bottom: 8px; background-color: #f8f9fa;"><strong>キャンセル日:</strong> {{cancelDate}}</div>
                                <div style="font-size: 16px; color: #333; margin-bottom: 15px; background-color: #f8f9fa;"><strong>キャンセル理由:</strong> {{cancelReason}}</div>
                                
                                <!-- 상품 목록 -->
                                <div style="font-size: 16px; color: #333; margin-bottom: 10px; background-color: #f8f9fa;"><strong>注文商品:</strong></div>
                                <div style="font-size: 14px; color: #666; margin-bottom: 15px; background-color: #f8f9fa; text-align: left;">{{items}}</div>
                                
                                <!-- 금액 정보 -->
                                <div style="border-top: 1px solid #ddd; padding-top: 15px; background-color: #f8f9fa;">
                                    <div style="font-size: 14px; color: #333; margin-bottom: 5px; background-color: #f8f9fa; text-align: right;"><strong>小計:</strong> {{subtotal}}</div>
                                    <div style="font-size: 14px; color: #333; margin-bottom: 5px; background-color: #f8f9fa; text-align: right;"><strong>送料:</strong> {{shipping}}</div>
                                    <div style="font-size: 14px; color: #333; margin-bottom: 5px; background-color: #f8f9fa; text-align: right;"><strong>使用ポイント:</strong> {{pointsUsed}}</div>
                                    <div style="font-size: 16px; color: #333; margin-bottom: 10px; background-color: #f8f9fa; text-align: right; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;"><strong>合計金額:</strong> {{totalAmount}}</div>
                </div>
            </div>
                            
                            <!-- 환불 안내 -->
                            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center !important;">
                                <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; background-color: #e8f5e8;">返金・ポイント返却について</div>
                                <div style="font-size: 16px; color: #333; margin-bottom: 10px; background-color: #e8f5e8;">
                                    <strong>返却ポイント:</strong> {{refundedPoints}}
            </div>
                                <div style="font-size: 14px; color: #666; margin-bottom: 10px; background-color: #e8f5e8;">
                                    ご利用いただいたポイントは自動的にアカウントに戻されます。
        </div>
                                <div style="font-size: 14px; color: #666; background-color: #e8f5e8;">
                                    お支払い方法によっては、返金処理に数日かかる場合がございます。
                                </div>
            </div>
                            
                            <!-- 문의 안내 -->
                            <div style="font-size: 14px; line-height: 1.6; margin-top: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important; color: #666 !important; background-color: #ffffff !important;">ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff; color: #666 !important;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff; color: #666 !important;">お問い合わせ: <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a></p>
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

    'shipping-start': `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>配送開始メール</title>
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
            }
            td {
                background-color: #ffffff !important;
            }
            div {
                background-color: #ffffff !important;
            }
            p {
                background-color: #ffffff !important;
            }
        }
        
        /* Gmail fix */
        .gmail-fix {
            background-color: #ffffff !important;
        }
    </style>
</head>
<body style="background-color: #ffffff !important; background: #ffffff !important; -webkit-background-color: #ffffff !important;">
    <div style="background-color: #ffffff !important; background: #ffffff !important; -webkit-background-color: #ffffff !important;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff !important; background: #ffffff !important; -webkit-background-color: #ffffff !important;">
            <tr>
                <td align="center" style="background-color: #ffffff !important; background: #ffffff !important; -webkit-background-color: #ffffff !important;">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff !important; background: #ffffff !important; -webkit-background-color: #ffffff !important;">
                        <tr>
                            <td style="background-color: #ffffff !important; background: #ffffff !important; -webkit-background-color: #ffffff !important; padding: 40px 20px; text-align: center;">
                                <!-- Logo -->
                                <div style="text-align: center !important; margin-bottom: 30px;">
                                    <a href="https://aether-store.jp" style="text-decoration: none;">
                                        <img src="https://aether-store.jp/assets/img/logo.png" alt="Aether Store" style="max-width: 200px; height: auto; display: block; margin: 0 auto;">
                                    </a>
                                </div>
                                
                                <!-- Greeting -->
                                <p style="text-align: center !important; margin: 0 0 30px 0; font-size: 16px; font-weight: bold !important; color: #333 !important; background-color: #ffffff !important;">こんにちは、<span style="color: #333 !important; text-decoration: none !important; background-color: #ffffff !important;">{{name}}</span>様！</p>
                                
                                <!-- Main Content -->
                                <div style="background-color: #ffffff !important; background: #ffffff !important; -webkit-background-color: #ffffff !important; text-align: center !important; max-width: 500px; margin: 0 auto;">
                                    <h2 style="text-align: center !important; margin: 0 0 20px 0; color: #333 !important; background-color: #ffffff !important;">配送開始のお知らせ</h2>
                                    <p style="text-align: center !important; margin: 0 0 20px 0; color: #555 !important; background-color: #ffffff !important;">ご注文いただいた商品の発送を開始いたしました。</p>
                                    
                                    <!-- Order Details -->
                                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left !important; max-width: 500px; margin-left: auto; margin-right: auto;">
                                        <h3 style="text-align: center !important; margin-bottom: 15px; color: #333 !important; background-color: #f8f9fa !important;">注文詳細</h3>
                                        <p style="margin: 5px 0; color: #555 !important; background-color: #f8f9fa !important;"><strong>注文番号:</strong> {{orderId}}</p>
                                        <p style="margin: 5px 0; color: #555 !important; background-color: #f8f9fa !important;"><strong>商品:</strong> {{items}}</p>
                                        <p style="margin: 5px 0; color: #555 !important; background-color: #f8f9fa !important;"><strong>合計金額:</strong> {{totalAmount}}</p>
                                        <p style="margin: 5px 0; color: #555 !important; background-color: #f8f9fa !important;"><strong>配送先:</strong> {{shippingAddress}}</p>
                                    </div>
                                    
                                    <!-- Shipping Details -->
                                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left !important; max-width: 500px; margin-left: auto; margin-right: auto;">
                                        <h3 style="text-align: center !important; margin-bottom: 15px; color: #333 !important; background-color: #f0f0f0 !important;">配送情報</h3>
                                        <p style="margin: 5px 0; color: #555 !important; background-color: #f0f0f0 !important;"><strong>配送方法:</strong> {{shippingMethod}}</p>
                                        <p style="margin: 5px 0; color: #555 !important; background-color: #f0f0f0 !important;"><strong>追跡番号:</strong> {{trackingNumber}}</p>
                                        <p style="margin: 5px 0; color: #555 !important; background-color: #f0f0f0 !important;"><strong>配達予定日:</strong> {{estimatedDelivery}}</p>
                                    </div>
                                    
                                    <p style="text-align: center !important; margin: 20px 0 0 0; color: #555 !important; background-color: #ffffff !important;">商品の到着をお楽しみにお待ちください。</p>
                                    <p style="text-align: center !important; margin: 20px 0 0 0; color: #555 !important; background-color: #ffffff !important;">ご不明な点がございましたら、お気軽にお問い合わせください。</p>
                                </div>
                                
                                <!-- Footer -->
                                <div style="text-align: center !important; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; background-color: #ffffff !important;">
                                    <p style="margin: 5px 0; color: #666 !important; background-color: #ffffff !important;">Aether Store</p>
                                    <p style="margin: 5px 0; color: #666 !important; background-color: #ffffff !important;">
                                        <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a>
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
    
    <!-- Gmail fix -->
    <div class="gmail-fix" style="background-color: #ffffff !important;"></div>
    
    <!-- Outlook conditional comment -->
    <!--[if mso]>
    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
        <tr>
            <td style="background-color: #ffffff;">
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:400px;">
                    <v:fill type="tile" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" color="#ffffff" />
                </v:rect>
            </td>
        </tr>
    </table>
    <![endif]-->
</body>
</html>`,

    'shipping-complete': `<!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>配送完了メール</title>
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
            margin: 0 auto !important;
            padding: 20px;
            background-color: #ffffff !important;
            background: #ffffff !important;
            -webkit-background-color: #ffffff !important;
            mso-background-color: #ffffff !important;
            text-align: center !important;
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
                        <td style="background-color: #ffffff; text-align: center !important; border-bottom: 2px solid #333; padding: 30px 30px 20px 30px; mso-padding-alt: 30px 30px 20px 30px;">
                            <a href="https://aether-store.jp" style="text-decoration: none; display: inline-block; text-align: center !important;">
                                <img src="https://aether-store.jp/assets/img/logo.png" alt="AETHER" style="max-width: 150px; height: auto; display: block; border: 0; margin: 0 auto !important; text-align: center !important;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 콘텐츠 -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; mso-padding-alt: 30px; text-align: center !important;">
                            <!-- 제목 -->
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center !important; background-color: #ffffff;">配送完了のお知らせ</div>
                            
                            <!-- 주문 번호 -->
                            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center !important;">
                                <p style="margin: 0; background-color: #f0f0f0; text-align: center !important;">注文番号: <strong>{{orderId}}</strong></p>
            </div>
                            
                            <!-- 배송 완료 내용 -->
                            <div style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; background-color: #ffffff; text-align: center !important;">
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">{{name}}様</p>
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">ご注文いただいた商品の配送が完了いたしました。</p>
                                
                                <!-- 배송 상세 정보 -->
                                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left !important; max-width: 500px; margin-left: auto; margin-right: auto;">
                                    <h3 style="text-align: center !important; margin-bottom: 15px; color: #333;">配送詳細</h3>
                                    
                                    <!-- 배송 상품 -->
                                    <div style="margin-bottom: 15px;">
                                        <strong>配送商品:</strong><br>
                                        <div style="margin-top: 5px;">{{items}}</div>
            </div>
                                    
                                    <!-- 배송 정보 -->
                                    <div style="margin-bottom: 15px;">
                                        <strong>配送先:</strong><br>
                                        <div style="margin-top: 5px;">{{shippingAddress}}</div>
            </div>
                                    
                                    <!-- 배송 완료 일시 -->
                                    <div style="margin-bottom: 15px;">
                                        <strong>配送完了日時:</strong> {{deliveryDate}}<br>
                                        <strong>配送業者:</strong> {{shippingCompany}}<br>
                                        <strong>追跡番号:</strong> {{trackingNumber}}
        </div>
                                    
                                    <!-- 안내 메시지 -->
                                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50;">
                                        <p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ 配送完了</p>
                                        <p style="margin: 5px 0 0 0; color: #2e7d32; font-size: 14px;">商品が正常に配送されました。ご利用いただき、ありがとうございました。</p>
                                    </div>
                                </div>
                                
                                <!-- 포인트 적립 정보 -->
                                <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center !important; max-width: 500px; margin-left: auto; margin-right: auto;">
                                    <h3 style="text-align: center !important; margin-bottom: 15px; color: #2d5a2d;">🎉 포인트 적립 완료!</h3>
                                    <p style="text-align: center !important; margin: 10px 0; font-size: 18px; font-weight: bold; color: #2d5a2d;">{{pointsEarned}}포인트가 적립되었습니다</p>
                                    <p style="text-align: center !important; margin: 10px 0; color: #555;">배송 완료로 인한 포인트가 계정에 추가되었습니다.</p>
                                </div>
                                
                                <p style="text-align: center !important; margin: 10px auto !important; max-width: 400px !important;">今後ともAetherをご愛顧いただき、ありがとうございます。</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #ffffff; text-align: center; border-top: 1px solid #ddd; padding: 20px 30px 30px 30px; font-size: 14px; color: #666; mso-padding-alt: 20px 30px 30px 30px;">
                            <p style="margin: 0 0 10px 0; background-color: #ffffff; color: #666 !important;">このメールは自動送信されています。</p>
                            <p style="margin: 0; background-color: #ffffff; color: #666 !important;">お問い合わせ: <a href="mailto:info@aether-store.jp" style="color: #666 !important; text-decoration: underline; background-color: #ffffff !important;">info@aether-store.jp</a></p>
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
// 지불 방법을 일본어로 변환하는 함수
function getPaymentMethodInJapanese(paymentMethod) {
    const paymentMethods = {
        'card': 'クレジットカード',
        'bank-transfer': '銀行振込',
        'bank_transfer': '銀行振込',
        'cash': '現金',
        'paypal': 'PayPal',
        'stripe': 'Stripe決済'
    };
    return paymentMethods[paymentMethod] || '銀行振込';
}

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
        console.log('📧 요청 본문:', event.body);
        
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Invalid JSON in request body',
                    details: parseError.message 
                })
            };
        }
        
        const { to, subject, type, data, templateType } = parsedBody;

        console.log('메일 발송 요청:', { to, subject, type, templateType });
        console.log('📧 받은 데이터:', data);
        console.log('📧 고객 데이터:', data?.customerData);
        
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
            case 'password-reset':
                html = loadEmailTemplate('password-reset', {
                    email: data.email || 'お客様',
                    resetLink: data.resetLink || 'https://aether-store.jp/login.html'
                });
                break;
            case 'order-cancelled':
                html = loadEmailTemplate('order-cancelled', {
                    customerName: data.customerName || 'お客様',
                    orderId: data.orderId || 'N/A',
                    cancelDate: data.cancelDate || new Date().toLocaleDateString('ja-JP'),
                    cancelReason: data.cancelReason || 'システムによるキャンセル',
                    paymentMethod: getPaymentMethodInJapanese(data.paymentMethod),
                    items: data.items || '商品情報なし',
                    subtotal: data.subtotal || '¥0',
                    shipping: data.shipping || '¥0',
                    pointsUsed: data.pointsUsed || '0ポイント',
                    totalAmount: data.totalAmount || '¥0',
                    refundedPoints: data.refundedPoints || '0ポイント'
                });
                break;
            case 'order-complete':
                html = loadEmailTemplate('order-complete', {
                    orderId: data.orderId || 'N/A',
                    items: data.items || '商品情報なし',
                    paymentMethod: data.paymentMethod || '銀行振込',
                    subtotal: data.subtotal || '¥0',
                    shipping: data.shipping || '¥0',
                    pointsUsed: data.pointsUsed || '0ポイント',
                    totalAmount: data.totalAmount || '¥0',
                    shippingAddress: data.shippingAddress || '配送先情報なし'
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
                console.log('📧 이벤트 메일 발송 - 받은 데이터:', JSON.stringify(data, null, 2));
                html = loadEmailTemplate('event', {
                    title: data.title || 'イベントのお知らせ',
                    content: data.content || '',
                    image: data.image || ''
                });
                break;
            case 'test':
                // 테스트 메일 - 선택된 템플릿 타입에 따라 처리
                const testTemplateType = templateType || data.templateType || 'welcome';
                console.log(`테스트 메일 템플릿 타입: ${testTemplateType}`);
                
                switch (testTemplateType) {
                    case 'welcome':
                        html = loadEmailTemplate('welcome', {
                            name: data.name || 'テストユーザー',
                            points: data.points || 300
                        });
                        break;
                    case 'order-complete':
                        html = loadEmailTemplate('order-complete', {
                            orderId: data.orderId || 'TEST-001',
                            items: Array.isArray(data.items) ? data.items.join(', ') : (data.items || 'LALARECIPE バクチノールアイクリーム, COSCELL レチノールボリュームアイバッグクリーム'),
                            paymentMethod: data.paymentMethod || '銀行振込',
                            subtotal: data.subtotal || '¥24,100',
                            shipping: data.shipping || '¥500',
                            pointsUsed: data.pointsUsed || '100ポイント',
                            totalAmount: data.totalAmount || '¥24,500',
                            shippingAddress: data.shippingAddress || '東京都 練馬区 光が丘2-10-1 3009号'
                        });
                        break;
                    case 'points-earned':
                        html = loadEmailTemplate('points-earned', {
                            points: data.points || 100,
                            reason: data.reason || 'テストポイント獲得'
                        });
                        break;
                    case 'shipping-start':
                        html = loadEmailTemplate('shipping-start', {
                            orderId: data.orderId || 'TEST-001',
                            name: data.name || 'テストユーザー',
                            items: data.items || 'LALARECIPE バクチノールアイクリーム, COSCELL レチノールボリュームアイバッグクリーム',
                            shippingAddress: data.shippingAddress || '東京都 練馬区 光が丘2-10-1 3009号',
                            estimatedDelivery: data.estimatedDelivery || new Date().toLocaleDateString('ja-JP'),
                            shippingMethod: data.shippingMethod || 'ヤマト運輸 (宅急便)',
                            trackingNumber: data.trackingNumber || '1234567890',
                            totalAmount: data.totalAmount || '¥24,500'
                        });
                        break;
                    case 'shipping-complete':
                        html = loadEmailTemplate('shipping-complete', {
                            orderId: data.orderId || 'TEST-001',
                            name: data.name || 'テストユーザー',
                            items: data.items || 'LALARECIPE バクチノールアイクリーム, COSCELL レチノールボリュームアイバッグクリーム',
                            shippingAddress: data.shippingAddress || '東京都 練馬区 光が丘2-10-1 3009号',
                            deliveryDate: data.deliveryDate || new Date().toLocaleDateString('ja-JP'),
                            shippingCompany: data.shippingCompany || 'ヤマト運輸',
                            trackingNumber: data.trackingNumber || '1234567890',
                            pointsEarned: data.pointsEarned || 0
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
            
            // 포인트 데이터 처리
            if (data.points) {
                personalizedHtml = personalizedHtml.replace(/{{points}}/g, data.points);
                console.log(`📧 HTML에서 {{points}} 치환 완료: ${data.points}`);
            }
            
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
            code: error.code,
            name: error.name
        });
        
        // 오류 타입별 처리
        let errorMessage = error.message;
        let errorType = error.name || 'UnknownError';
        
        if (error.message.includes('SyntaxError')) {
            errorMessage = '템플릿 처리 중 구문 오류가 발생했습니다.';
            errorType = 'TemplateSyntaxError';
        } else if (error.message.includes('ReferenceError')) {
            errorMessage = '변수 참조 오류가 발생했습니다.';
            errorType = 'ReferenceError';
        } else if (error.message.includes('TypeError')) {
            errorMessage = '데이터 타입 오류가 발생했습니다.';
            errorType = 'TypeError';
        }
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: errorMessage,
                errorType: errorType,
                details: {
                    code: error.code,
                    originalMessage: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            })
        };
    }
};