// File: api/proxy.js

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in Vercel Environment Variables.");
      return response.status(500).json({ error: 'API key not configured on server' });
    }

    const frontendPayload = request.body;

    if (!frontendPayload) {
        return response.status(400).json({ error: 'Request body is missing.' });
    }

    // [THAY ĐỔI] Sử dụng model mới và ổn định hơn
    const modelName = 'gemini-1.5-flash-latest';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frontendPayload),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
        console.error('Gemini API Error:', data);
        // Trả về lỗi chi tiết từ Gemini để frontend có thể hiển thị
        const errorMessage = data?.error?.message || 'Unknown error from Gemini API';
        return response.status(geminiResponse.status).json({ error: errorMessage });
    }

    // Kiểm tra nếu API trả về nhưng không có nội dung (ví dụ: bị chặn vì an toàn)
    if (!data.candidates || data.candidates.length === 0) {
        const blockReason = data.promptFeedback?.blockReason || 'No content returned';
        console.error('API call blocked or returned no content. Reason:', blockReason);
        return response.status(400).json({ error: `Request was blocked. Reason: ${blockReason}` });
    }

    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy Internal Error:', error);
    return response.status(500).json({ error: 'Internal Server Error in proxy' });
  }
}
