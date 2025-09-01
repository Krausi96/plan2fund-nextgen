# 🤖 Agent Guide

## Ziel
Baue und teste autonom ein funktionierendes MVP von **Plan2Fund**.

## Akzeptanzkriterien (MVP Definition of Done)
- User kann den Reco-Wizard ausfüllen  
- User erhält einen automatisch generierten Business Plan Draft  
- Preview & Pricing funktionieren  
- Checkout mit Stripe führt zu Bestätigung  
- Export (PDF/Docx) ist möglich  

## Agent-Loop
1. Lese /docs sequential  
2. Plane kleinen Arbeitsschritt  
3. Implementiere → Commit & Push  
4. Trigger Vercel-Deployment  
5. Prüfe Logs & Fix  
6. Wiederhole bis alle MVP-Kriterien erfüllt

## Grüner Build
- 
pm run build erfolgreich  
- Vercel Deployment erfolgreich  
- Alle MVP-Flows klickbar im Browser

## Environment Handling
- .env bleibt **lokal** (niemals committen).  
- .env.example enthält Dummy-Werte → definiert benötigte Variablen.  
- Für Deployments → Werte ins Vercel Dashboard (Environment Variables) eintragen.  
