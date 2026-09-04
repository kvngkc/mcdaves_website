---
description: Security guidelines and policies for the McDaves platform.
---

# McDaves Security Rules

1. **Row Level Security (RLS)**: Every consumer-facing table must have active RLS. Policies must strictly scope to `auth.uid() = customer_id` for mutations.
2. **Input Validation**: All incoming API requests must be validated using `zod`. Never trust client-provided IDs for payment or order statuses.
3. **Secret Management**: Never commit `.env` files. Ensure server-side secrets are only accessed in Node.js environments.
4. **Webhook Security**: Payment webhooks (e.g. Paystack) must mathematically verify HMAC signatures before trusting payload status.
