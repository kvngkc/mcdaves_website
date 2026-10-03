import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/security/turnstile';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message, inquiryType, turnstileToken } = body;

    // Validate CAPTCHA
    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Security check failed. Please refresh and try again.' },
        { status: 400 }
      );
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formspreeId = inquiryType === 'b2b'
      ? process.env.NEXT_PUBLIC_FORMSPREE_B2B_ID
      : process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_ID;

    // No Formspree endpoint configured -> the message has NOWHERE to go.
    //
    // Previously this branch returned `{ success: true }` after logging
    // "Formspree ID missing, pretending success." — every inquiry submitted
    // in that state was silently discarded while the customer was told their
    // message had been received. We now report the misconfiguration
    // truthfully and redirect the customer to a channel that works.
    if (!formspreeId) {
      console.error(
        '[Contact] Formspree is not configured (NEXT_PUBLIC_FORMSPREE_CONTACT_ID / NEXT_PUBLIC_FORMSPREE_B2B_ID missing). Refusing to fake success.',
      );
      return NextResponse.json(
        {
          error:
            'Contact form is temporarily unavailable. Please reach us on WhatsApp or by phone.',
        },
        { status: 503 }
      );
    }

    const formspreeRes = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        message,
        inquiryType
      })
    });

    if (formspreeRes.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to deliver message to Formspree.' }, { status: 502 });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
