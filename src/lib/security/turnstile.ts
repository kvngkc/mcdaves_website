interface TurnstileVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // SECURITY: Fail closed in production. A missing secret must never
    // silently disable bot protection on the endpoints that call this
    // (/api/contact, /api/order-intents, /api/pay/initialize).
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[SECURITY] TURNSTILE_SECRET_KEY is not configured in production. ' +
          'Rejecting the request (fail closed).',
      );
      return false;
    }

    // Development-only escape hatch so local setup is not blocked.
    console.warn(
      'TURNSTILE_SECRET_KEY is not configured. Skipping verification (development only).',
    );
    return true;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data: TurnstileVerificationResponse = await res.json();
    return data.success;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}
