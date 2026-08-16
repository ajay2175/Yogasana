# Asana Integrative Advisor — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for remaining tasks.

**Goal:** Deliver lookup UI with four lenses, evidence badges, and seed catalog from research documents.

**Architecture:** Next.js App Router + JSON knowledge graph + lens formatters + progressive disclosure.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS 4

## Global Constraints

- Never collapse textual / biomedical / integrative / lineage-belief claim layers
- Evidence codes required on displayed claims (T1/T2/B0-B3/A1/A2)
- Atman and ojas are non-biomarker fields
- Clinical disclaimer on Clinical lens

## Completed in this session

- [x] Project scaffold at ~/Projects/asana-integrative-advisor
- [x] TypeScript ontology types
- [x] 10 seed asanas with full metadata
- [x] Four-lens UI with complexity slider
- [x] Explore + detail pages
- [x] Advisor and Principles stubs

## Next tasks (Phase 1 completion)

- [ ] Import script from monograph DOCX → JSON (scripts/import_monograph.py)
- [ ] Expand catalog to 55 base asanas
- [ ] Add monograph import tests
- [ ] Phase 2: anshamsha recommendation engine
