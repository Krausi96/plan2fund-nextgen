# ⚖️ GDPR Baseline (MVP)

- **No sign-in.** Use pseudonymous cookie \pf_session\; no PII until Checkout.
- **Data minimization.** Only store content needed for reco/plan/checkout/export.
- **RLS.** Scope by \session_id\ (header \x-pf-session\).
- **No analytics trackers at MVP.**
- **Data Subject Requests.** Provide support email. Add deletion/export on request.
- **Email.** Transactional only (Resend). Verify sending domain.
- **LLM.** Keep \AI_ENABLED=false\ in production until legal & DPA signed with EU-region provider.