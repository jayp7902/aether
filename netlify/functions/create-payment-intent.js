// Netlify Function: Stripe 결제 처리
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 요청 본문 파싱
    const { amount, currency, orderData } = JSON.parse(event.body);

    // 유효성 검사
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '無効な金額です' }),
      };
    }

    // Stripe PaymentIntent 생성
    // metadata는 500자 제한이 있으므로 최소한의 정보만 전달
    const metadata = {
      orderId: orderData.id || 'ORDER-' + Date.now(),
      userEmail: orderData.userEmail || orderData.customerEmail || 'unknown',
      itemCount: orderData.items ? orderData.items.length : 0,
      subtotal: orderData.subtotal || amount,
    };
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // 엔화는 소수점 없음
      currency: currency || 'jpy',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata,
      description: `注文 ${metadata.orderId} - ${metadata.itemCount}点`,
    });

    console.log('✅ PaymentIntent 생성 완료:', paymentIntent.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
    };
  } catch (error) {
    console.error('❌ PaymentIntent 생성 실패:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || '決済処理に失敗しました',
      }),
    };
  }
};

