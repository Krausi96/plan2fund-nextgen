# API Directory

## Structure

```
pages/api/
├── admin/              # Admin utilities
│   └── setup.ts        # Database setup
├── ai/                 # AI services
│   └── openai.ts       # OpenAI API proxy
├── analytics/          # Analytics & tracking
│   ├── track.ts        # General analytics events
│   └── templates.ts    # Template usage tracking
├── auth/               # Authentication
│   ├── login.ts
│   ├── logout.ts
│   ├── register.ts
│   └── session.ts
├── ml-training/        # ML training data collection
│   ├── plans.ts        # Anonymized plans for ML
│   └── scraper-quality.ts # Extraction quality metrics
├── payments/           # Payment processing
│   ├── create-session.ts
│   ├── success.ts
│   └── webhook.ts
├── programs/           # Program endpoints
│   ├── index.ts        # GET /api/programs
│   ├── recommend.ts    # POST /api/programs/recommend
│   └── [id]/
│       └── requirements.ts # GET /api/programs/[id]/requirements
└── user/               # User management
    ├── profile.ts      # GET/PUT /api/user/profile
    └── delete-data.ts  # POST /api/user/delete-data (GDPR)
```

## Organization Principles

- **Grouped by feature**: Related endpoints in same folder
- **RESTful naming**: Use resource names (user, programs, payments)
- **Clear separation**: Analytics vs ML training vs core features
- **Expandable**: Single-file folders allow future expansion

## Documentation

API documentation moved to `docs/api/` directory.

