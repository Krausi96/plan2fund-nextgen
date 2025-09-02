# 🧱 Backlog (Agent-Mode)

## Reco (3a)
- [ ] \deriveQuestionsFromPrograms()\ (info-gain) + templates
- [ ] Persist survey (\eco_sessions\/\eco_answers\) + live narrowing
- [ ] **RecoIntake** UI + **SignalsPanel**
- [ ] Extraction API (\/api/recommend/free-text\): heuristics + optional LLM
- [ ] **EduPanel** content (EN/DE) with contextual triggers
- [ ] Complete \data/programs.json\ coverage

## Plan (3b)
- [ ] **PlanIntake** UI → \/api/intake/plan\ → chapter skeletons
- [ ] Editor autosave (2–5s + onBlur), snapshots (\plan_versions\)
- [ ] CoachPanel calculators (TAM/SAM/SOM, depreciation, ICP, responsibilities)
- [ ] Preview metrics (completeness/complexity) + validation gates

## Platform
- [ ] Cookie middleware issuing \pf_session\
- [ ] Supabase migrations + RLS policies (session header)
- [ ] \/pricing\ draft orders; Stripe Checkout + webhook
- [ ] \/export\ PDF/DOCX → Storage + signed URL; Thank-You + Resend
- [ ] README quickstart; Vercel env set; CI green build

**Done →** Move items here with links to commits/PRs and short notes.