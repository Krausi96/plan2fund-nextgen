# ProgramFinder Wizard – Updated Q&A Table

## ✅ Updated Questions (10 Total: 8 Core + 2 Advanced)

| Q# | ID | Question (EN) | Question (DE) | Type | Options (EN) | Options (DE) | Required | Priority | Advanced | Used in Matching? |
|----|----|--------------|---------------|------|-------------|-------------|----------|----------|----------|-------------------|
| **Q1** | `funding_intent` | "Are you looking for a funding option for a project or venture?" | "Suchst du eine Finanzierungsmöglichkeit für ein Projekt oder Vorhaben?" | Single-select | • Yes, I want to find funding programs<br>• Not yet – I just need planning/editor help | • Ja, ich möchte Förderprogramme finden<br>• Noch nicht – ich brauche zuerst Planung/Editor-Hilfe | ✅ | 1 | ❌ | ❌ (Gate only) |
| **Q2** | `organisation_stage` | "What best describes your organisation and current project stage?" | "Was beschreibt deine Organisation und aktuelle Projektphase am besten?" | Single-select | • Exploring an idea (no company yet, planning phase)<br>• Early-stage startup (building first product/prototype, < 6 months old)<br>• Growing startup (incorporated, first customers, < 3 years old)<br>• Established SME (3+ years operating, expanding/innovating)<br>• Research institution or university<br>• Public body or municipality<br>• Other organisation type | • Ideenphase (noch kein Unternehmen, Planungsphase)<br>• Frühphasen-Startup (erste Produkt/Prototyp-Entwicklung, < 6 Monate alt)<br>• Wachsendes Startup (gegründet, erste Kunden, < 3 Jahre alt)<br>• Etabliertes KMU (3+ Jahre am Markt, expandierend/innovierend)<br>• Forschungsinstitution oder Universität<br>• Öffentliche Einrichtung oder Gemeinde<br>• Andere Organisation | ✅ | 2 | ❌ | ✅ (20 pts, critical - derives company_stage) |
| **Q3** | `revenue_status` | "What best describes your current situation regarding funding?" | "Was beschreibt deine aktuelle Situation bezüglich Finanzierung am besten?" | Single-select | • Pre-revenue (no sales yet)<br>• Early revenue (some sales, < €500k/year)<br>• Established revenue (€500k+/year)<br>• Not applicable (public sector, research institution, non-profit) | • Vor Umsatz (noch keine Verkäufe)<br>• Früher Umsatz (einige Verkäufe, < €500k/Jahr)<br>• Etablierter Umsatz (€500k+/Jahr)<br>• Nicht zutreffend (öffentlicher Sektor, Forschung, Non-Profit) | ✅ | 3 | ❌ | ✅ (Determines funding type eligibility: grants/loans/equity) |
| **Q4** | `location` | "Where will the project or venture take place?" | "Wo wird das Projekt oder Vorhaben stattfinden?" | Single-select + region text | • Austria<br>• Germany<br>• EU<br>• International<br><br>+ Optional region text input | • Österreich<br>• Deutschland<br>• EU<br>• International<br><br>+ Optional region text input | ✅ | 4 | ❌ | ✅ (35 pts, highest weight) |
| **Q5** | `funding_amount` | "How much funding do you plan to request (if any)?" | "Wie viel Förderung möchtest du (falls nötig) anfragen?" | Range slider (0–€1M) | Slider with editable number | Slider mit editierbarer Zahl | ✅ | 5 | ❌ | ✅ (20 pts, critical) |
| **Q6** | `industry_focus` | "Which focus best describes your project?" | "Welche Ausrichtung beschreibt dein Projekt am besten?" | Multi-select + subcategories | • Digital & Software<br>• Climate & Sustainability<br>• Health & Life Sciences<br>• Manufacturing & Hardware<br>• Internationalisation<br>• Something else<br><br>+ Subcategories (e.g., Digital → AI, FinTech, HealthTech, etc.) | • Digital & Software<br>• Klima & Nachhaltigkeit<br>• Gesundheit & Life Sciences<br>• Produktion & Hardware<br>• Internationalisierung<br>• Anderes<br><br>+ Subcategories | ✅ | 6 | ❌ | ✅ (10 pts) |
| **Q7** | `co_financing` | "Can your organisation contribute part of the project budget?" | "Kann deine Organisation einen Teil des Projektbudgets beitragen?" | Single-select + percentage | • Yes, we can cover a share (e.g., 20%+) → show percentage input<br>• No, we need full external funding<br>• Flexible, depends on program | • Ja, wir können einen Anteil beisteuern (z.B. 20%+) → Prozent-Eingabe<br>• Nein, wir brauchen vollständige externe Finanzierung<br>• Flexibel, hängt vom Programm ab | ✅ | 7 | ❌ | ✅ (Critical for eligibility, filters grants vs loans/equity) |
| **Q8** | `use_of_funds` | "How will you invest support or funding?" | "Wie investierst du Unterstützung oder Fördermittel?" | Multi-select | • Product development & R&D<br>• Hiring & team growth<br>• Equipment & infrastructure<br>• Marketing & go-to-market<br>• International expansion<br>• Working capital<br>• Other | • Produktentwicklung & F&E<br>• Einstellungen & Teamausbau<br>• Ausstattung & Infrastruktur<br>• Marketing & Markteintritt<br>• Internationale Expansion<br>• Betriebskapital<br>• Sonstiges | ❌ | 8 | ❌ | ✅ (+2 pts bonus) |
| **Q9** | `deadline_urgency` | "When do you need a funding decision?" | "Bis wann benötigst du eine Förderentscheidung?" | Single-select | • Within 1 month<br>• Within 1–3 months<br>• Within 3–6 months<br>• 6+ months | • Innerhalb von 1 Monat<br>• Innerhalb von 1–3 Monaten<br>• Innerhalb von 3–6 Monaten<br>• 6+ Monate | ❌ | 9 | ✅ | ⚠️ (3 pts, but matching needs implementation) |
| **Q10** | `impact_focus` | "Which impact areas apply?" | "Welche Wirkungsbereiche treffen zu?" | Multi-select | • Environmental / Climate<br>• Social / Inclusion<br>• Regional development<br>• Research & innovation<br>• Education / Workforce<br>• Other | • Umwelt / Klima<br>• Sozial / Inklusion<br>• Regionale Entwicklung<br>• Forschung & Innovation<br>• Bildung / Fachkräfte<br>• Sonstiges | ❌ | 10 | ✅ | ✅ (4 pts) |

---

## ❌ Removed Questions

### **Q8 (Old): `project_duration`** – REMOVED

| Q# | ID | Question (EN) | Question (DE) | Type | Options (EN) | Options (DE) | Required | Priority | Advanced | Used in Matching? |
|----|----|--------------|---------------|------|-------------|-------------|----------|----------|----------|-------------------|
| **Q8** | `project_duration` | "How long will the funded work run?" | "Wie lange wird die geförderte Arbeit laufen?" | Range slider (1–36 months) | Slider (1–36 months) | Slider (1–36 Monate) | ❌ | 8 | ✅ | ❌ (Not used!) |

**Reason for removal:**
- Not used in matching/scoring – pure data collection
- No `projectDurationMatches` function exists
- Low value for users

---

### **Q12 (Old): `team_size`** – REMOVED

| Q# | ID | Question (EN) | Question (DE) | Type | Options (EN) | Options (DE) | Required | Priority | Advanced | Used in Matching? |
|----|----|--------------|---------------|------|-------------|-------------|----------|----------|----------|-------------------|
| **Q12** | `team_size` | "How large is your active team?" | "Wie groß ist dein aktives Team?" | Single-select | • Solo founder<br>• 2–5 people<br>• 6–20 people<br>• 20+ people | • Solo-Gründer:in<br>• 2–5 Personen<br>• 6–20 Personen<br>• 20+ Personen | ❌ | 12 | ✅ | ❌ (5 pts, but matching is stub) |

**Reason for removal:**
- Matching function is stub (`teamSizeMatches` always returns `true`)
- Scoring bonus given but no actual filtering happens
- Most programs don't have team size requirements

---

## Summary

**Before:** 12 questions (7 core + 5 advanced)  
**After:** 10 questions (8 core + 2 advanced)

**Changes:**
- ✅ Merged Q2 (`company_type`) + Q3 (`project_scope`) → New Q2 (`organisation_stage`)
- ✅ Added new Q3 (`revenue_status`) for funding type eligibility
- ✅ Moved Q11 (`co_financing`) → Q7 (core, now required)
- ❌ Removed Q8 (`project_duration`) - not used in matching
- ❌ Removed Q12 (`team_size`) - matching is stub




