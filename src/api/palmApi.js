// src/api/palmApi.js

const API_BASE_URL = 'http://localhost:8081'; // Spring Boot Backend

export async function enrollPalm(userId, captured, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, captured, token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const responseData = await response.json();
    return { data: responseData };
  } catch (error) {
    console.error("Enroll API Error:", error);
    throw error;
  }
}

export async function checkUserId(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/check-id?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return { data: await response.json() };
  } catch (error) {
    console.error('CheckUserId API Error:', error);
    throw error;
  }
}

export async function verifyPalm(captured, fusionRule = 'WHT') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ captured, fusionRule }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const responseData = await response.json();
    return { data: responseData };
  } catch (error) {
    console.error("Verify API Error:", error);
    throw error;
  }
}