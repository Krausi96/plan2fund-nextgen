# Plan2Fund Docs

## Goal (5 sentences)
Plan2Fund’s MVP must ship with a functional **Reco** (=8 Qs, reasons/unmet, Canva-style free text) and **Plan** (intake ? editable chapters + autosave snapshots).  
The repo’s /docs are the **single source of truth**; read them sequentially before coding.  
Agent must work in small slices with idempotent **PowerShell commits**, push to main, deploy to Vercel, and fix build errors until green.  
**Env parity** (.env.local ? Vercel ? CI) and **Supabase RLS** via x-pf-session are mandatory.  
Stop only when /docs/agent/README.md acceptance is fully met and a thank-you email is sent after paid checkout.

## Structure
- [Agent](./agent/README.md)  
- [Product](./product/README.md)  
- [Tech](./tech/README.md)  
- [Legal](./legal/README.md)  
- [Backlog](./BACKLOG.md)  