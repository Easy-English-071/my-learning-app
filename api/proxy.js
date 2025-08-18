// File: api/proxy.js

// Hàm này sẽ chạy trên server của Vercel, không phải trên trình duyệt.
export default async function handler(request, response) {
  // Chỉ cho phép phương thức POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Lấy API key từ Biến môi trường đã lưu trên Vercel.
    // Tên biến này (GEMINI_API_KEY) bạn sẽ tạo ở Bước 4.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Nếu không tìm thấy key, báo lỗi server
      return response.status(500).json({ error: 'API key not configured' });
    }

    // 2. Lấy payload (chứa prompt) mà frontend gửi lên
    const frontendPayload = await request.json();

    // 3. Xây dựng URL và payload cuối cùng để gọi đến Google API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    // 4. Gọi đến API của Gemini từ server của Vercel
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frontendPayload), // Chuyển tiếp payload từ frontend
    });

    // 5. Lấy dữ liệu JSON từ phản hồi của Gemini
    const data = await geminiResponse.json();

    // Nếu Gemini trả về lỗi, cũng trả lỗi về cho frontend
    if (!geminiResponse.ok) {
        console.error('Gemini API Error:', data);
        return response.status(geminiResponse.status).json(data);
    }

    // 6. Gửi dữ liệu thành công về lại cho trang HTML
    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
