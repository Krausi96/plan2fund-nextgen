# Project Profile vs Program Profile Investigation Handover

## Overview
Investigate the relationship and handling between project profiles and program profiles in the application flow, particularly when users come from the recommendation (reco) flow where a program profile may already be set.

## Key Questions to Investigate

### 1. Profile Creation Flow
- **When is a project profile created?**
  - Is it created when user enters "My Project" section?
  - Is it created during the reco flow?
  - Is it created when a program is selected/generated?

- **When is a program profile created?**
  - During reco questionnaire completion?
  - When programs are generated?
  - When user selects a specific program?

### 2. Reco Flow Specific Behavior
- **What happens when user comes from reco?**
  - Does the reco flow create/populate a program profile?
  - Is this program profile persisted/stored somewhere?
  - How is this program profile accessed when user navigates to "My Project"?

- **Profile State Management**
  - Are both profiles (project and program) created independently?
  - Is there a parent-child relationship between them?
  - Can a project profile exist without a program profile and vice versa?

### 3. Data Flow Analysis
- **Profile Data Sources**
  - Where are project profiles stored?
  - Where are program profiles stored?
  - What data structure do they use?

- **Profile Population**
  - Which fields are populated in each profile?
  - How does data flow from reco answers to these profiles?
  - Are there overlapping fields between the two profiles?

## Technical Areas to Examine

### 1. Relevant Files and Components
```
features/reco/
├── components/
│   ├── ProgramFinder.tsx
│   └── QuestionRenderer.tsx
├── hooks/
│   └── useQuestionLogic.ts
└── data/
    └── questions.ts

features/editor/components/Navigation/CurrentSelection/MyProject/
├── MyProject.tsx
└── LivePreviewBox.tsx

shared/user/
├── storage/
│   └── planStore.ts
└── database/
    └── repository.ts
```

### 2. Key Functions to Trace
- `useQuestionLogic.ts` - Business logic for reco flow
- `ProgramFinder.tsx` - Program generation and selection
- `MyProject.tsx` - Project profile handling
- `planStore.ts` - Storage mechanisms
- `repository.ts` - Database interactions

### 3. State Management Points
- Check how answers are stored during reco flow
- Examine how program recommendations are persisted
- Review project profile creation/mutation logic
- Analyze profile synchronization between flows

## Test Scenarios to Validate

### Scenario 1: Fresh User Journey
1. User starts fresh (no existing profiles)
2. Completes reco questionnaire
3. Generates programs
4. Selects a program
5. Navigates to "My Project"
6. **Expected**: Both profiles should be created appropriately

### Scenario 2: Returning User with Existing Program Profile
1. User has existing program profile from previous reco session
2. User navigates directly to "My Project"
3. **Investigate**: Is the existing program profile accessible?
4. **Investigate**: Can user modify/create new project profile?

### Scenario 3: Mixed State Handling
1. User has partial project profile
2. User comes from reco with new program recommendations
3. **Investigate**: How are conflicts resolved?
4. **Investigate**: Which profile takes precedence?

## Debugging Approach

### 1. Logging Strategy
Add console logs to trace:
- Profile creation events
- Data population flows
- State changes during navigation
- Storage/retrieval operations

### 2. Data Inspection Points
- Check localStorage/sessionStorage contents
- Examine Redux/store state
- Review database entries (if applicable)
- Monitor API calls for profile operations

### 3. Flow Visualization
Create sequence diagrams showing:
- Reco flow → profile creation
- Navigation between sections
- Profile data persistence
- Conflict resolution mechanisms

## Expected Outcomes

### Documentation Deliverables
1. **Flow Diagrams**: Visual representation of profile creation and data flow
2. **State Matrix**: Mapping of profile states and transitions
3. **Conflict Resolution Rules**: How overlapping data is handled
4. **Edge Cases**: Unusual scenarios and their handling

### Code Recommendations
1. **Consistency Improvements**: Standardize profile handling across flows
2. **Error Prevention**: Add safeguards for profile state conflicts
3. **Performance Optimizations**: Efficient profile loading and storage
4. **User Experience**: Clear indication of profile status to users

## Success Criteria
- [ ] Clear understanding of when each profile is created
- [ ] Documentation of data flow between profiles
- [ ] Identification of potential conflict scenarios
- [ ] Recommendations for improving profile management
- [ ] Test cases validating the investigated behaviors

---
*Last Updated: January 27, 2026*
*Assignee: [Colleague Name]*
*Status: Ready for Investigation*