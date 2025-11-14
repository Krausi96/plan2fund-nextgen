# Quick Test Guide - Live Testing

## 🚀 Test Right Now

### 1. Start the App
```bash
npm run dev
```

### 2. Go to Recommendation Page
Open: `http://localhost:3000/reco`

### 3. Answer Questions
- **Location**: Austria
- **Company Type**: Startup
- **Funding Amount**: 100k-500k
- **Industry Focus**: Digital

### 4. Check Results
- Should see **Top 5 programs**
- Scores should be **> 0%**
- Austrian programs should rank **high**

---

## 🧪 Test LLM Fallback (No Seeds)

### Option A: Environment Variable
Create `.env.local`:
```bash
NEXT_PUBLIC_DISABLE_SEEDS=true
```

### Option B: Direct API Call
```bash
curl -X POST http://localhost:3000/api/programs/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "location": "austria",
      "company_type": "startup",
      "funding_amount": "100kto500k"
    },
    "use_seeds": false
  }'
```

**Expected**: Programs with `source: "llm_generated"`

---

## 📊 What to Check

### Frontend (Browser)
- ✅ Programs displayed
- ✅ Scores shown (0-100%)
- ✅ Top 5 results
- ✅ No zero-score programs

### Backend (Console)
- ✅ API calls successful
- ✅ Programs extracted/generated
- ✅ Scoring logs visible

### Vercel (If Deployed)
- ✅ Functions → Logs show extraction
- ✅ No errors
- ✅ Response times reasonable

---

## 🐛 Quick Debug

**No programs?**
- Check: LLM API key set?
- Check: Seed URLs exist?
- Check: Browser console for errors

**Wrong programs?**
- Check: Seed filtering working?
- Check: Matching logic correct?

**Low scores?**
- Check: Requirements matching?
- Check: Normalization working?

---

## ✅ Success Criteria

1. **With Seeds**: Programs extracted from URLs, scored, ranked
2. **Without Seeds**: LLM generates programs, scored, ranked
3. **Both**: Top 5 results, no zero-score programs

---

**Ready to test!** 🎯

