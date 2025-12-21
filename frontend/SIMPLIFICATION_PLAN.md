# Frontend Flow Simplification Plan

## Current State Analysis

### Pages & Navigation (6 pages)
1. **Home** (`/`) - Landing with 4 feature cards
2. **Chat** (`/chat`) - AI assistant for questions
3. **Declaration** (`/declaration`) - Form questionnaire
4. **Guide GeTax** (`/guide`) - Step-by-step guide with document upload
5. **Documents** (`/documents`) - Standalone document upload
6. **Results** (`/results`) - Tax estimation + archives

### User Journey Issues

#### 1. Multiple Entry Points Create Confusion
- User can start at Declaration OR Guide OR Documents
- No clear recommended path
- Same data can be entered/uploaded in multiple places

#### 2. Redundant Functionality
- **DocumentsPage** and **GuidePage** both handle document uploads
- **Declaration** (questionnaire) and **Guide** both collect similar data
- User might fill data in one place, not see it in another

#### 3. Guide is Now Superior to Declaration
- Guide shows exact GeTax field codes (11.10, 31.40, etc.)
- Guide has inline document upload per section
- Guide auto-applies extracted data to fields
- Declaration is just a generic form without GeTax context

---

## Proposed Simplification

### Phase 1: Consolidate to 4 Pages

| Current | Proposed | Action |
|---------|----------|--------|
| Home | **Home** | Keep, update CTA |
| Chat | **Assistant** | Keep as support |
| Declaration | Remove | Merge into Guide |
| Guide GeTax | **Déclaration** | Main workflow |
| Documents | **Historique** | Document history only |
| Results | **Résultats** | Keep |

### Phase 2: Simplified User Flow

```
Home
  ├─→ "Commencer" → Guide (renamed "Déclaration")
  │                    │
  │                    ├─ Select GeTax page
  │                    ├─ Upload relevant documents
  │                    ├─ See extracted/entered values
  │                    ├─ Copy values to GeTax
  │                    └─ Ask questions inline
  │
  ├─→ "Aide" → Assistant (chat for general questions)
  │
  └─→ "Résultats" → Tax estimation & archives
```

### Phase 3: UI Changes

#### A. Rename "Guide GeTax" to "Déclaration"
- Make it the primary workflow page
- Remove old Declaration page from navigation

#### B. Transform Documents Page to "Historique"
- Show list of uploaded documents (already stored in localStorage)
- Remove upload functionality (now in Guide)
- Add ability to view/re-apply extracted data

#### C. Update Home Page
- Single prominent CTA: "Commencer ma déclaration" → /guide
- Move "Import documents" card to bottom or remove
- Emphasize the simplified flow

#### D. Improve Guide Page
- Add progress indicator (completed sections)
- Show "Documents uploaded" badge per section
- Add "Next section" navigation
- Make it feel like the main app, not a side feature

---

## Implementation Tasks

### Quick Wins (30 min)
- [ ] Rename navigation: "Guide GeTax" → "Déclaration"
- [ ] Update route: `/guide` → `/declaration` (or keep /guide, redirect /declaration)
- [ ] Update Home CTA to point to Guide
- [ ] Remove "Déclaration" nav item (old questionnaire)

### Medium Effort (1-2 hours)
- [ ] Transform DocumentsPage to history-only view
- [ ] Add progress tracking to GuidePage
- [ ] Add "section complete" indicators
- [ ] Add navigation between Guide sections

### Nice to Have
- [ ] Persist Guide section state (last visited)
- [ ] Show upload history per section in Guide
- [ ] Add "compare with last year" feature
- [ ] Export all data as PDF report

---

## Benefits

1. **Clearer User Journey**: One main path to follow
2. **Less Confusion**: No duplicate functionality
3. **Contextual Uploads**: Documents uploaded where relevant
4. **Better GeTax Integration**: Field codes always visible
5. **Simpler Navigation**: 4 items instead of 6
6. **Mobile-Friendly**: Fewer pages = simpler mobile nav

---

## Questions to Consider

1. Should we keep the old Questionnaire as a "quick entry" mode?
   - Pro: Some users might prefer form-style input
   - Con: Adds complexity, maintenance burden

2. Should Documents page show all uploaded docs or just recent?
   - Suggest: Show all, grouped by document type

3. Should we add a "wizard" mode that walks through all sections?
   - Could be a future enhancement

---

## Next Steps

1. Review this plan
2. Decide on naming (Guide vs Déclaration)
3. Decide if we keep old Questionnaire as alternative
4. Implement changes incrementally
