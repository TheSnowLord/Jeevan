const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function requestOtp(phone: string) {
  const response = await fetch(`${API_URL}/api/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Unable to send OTP.");
  return data as { message: string; expires_in: number };
}

export async function verifyOtp(phone: string, otp: string) {
  const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Invalid OTP.");
  return data as {
    access_token: string;
    token_type: string;
    is_new_user: boolean;
    user: { phone: string; role: string };
  };
}