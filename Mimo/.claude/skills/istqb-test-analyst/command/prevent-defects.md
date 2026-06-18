---
title: Prevent Defects
description: >
  Step-by-step workflow for defect prevention: selecting and applying review techniques,
  using behavioral models to detect specification defects, classifying defects, performing
  RCA, and implementing improvements to prevent recurrence.
usage: >
  Use throughout the SDLC. Apply Part A before development (phase containment).
  Apply Part B after testing cycles (recurrence prevention).
tags:
  - defect-prevention
  - review-techniques
  - root-cause-analysis
  - phase-containment
  - rca
---

# Command: Prevent Defects

## When to Use

1. **Before development** (phase containment): requirements reviews, sprint planning, model creation
2. **After testing cycles** (recurrence prevention): retrospectives, post-release defect analysis

## Part A: Phase Containment (Pre-Development)

### Step A1: Select Review Technique

| Test Basis Type | Recommended Technique |
|----------------|----------------------|
| Informal requirements text | PBR or checklist-based |
| Use cases / scenarios | Scenario-based reviewing |
| Multi-user system | Role-based reviewing |
| High-risk, complex spec | PBR (deepest review) |
| Time-constrained | Checklist-based or ad hoc |

Combine PBR + checklist-based for highest-complexity specifications.

### Step A2: Prepare and Execute Review

- Checklist-based: tailor checklist to test basis type and risk level
- Scenario-based: prepare "dry run" scenarios from the specification
- PBR: assign perspectives (tester, designer, end user); tester attempts to generate draft tests

During review: record all anomalies (location, type, severity). Capture beyond checklist items.

**Anomaly types**: missing information, inconsistencies, ambiguities, untestable requirements.

### Step A3: Use Behavioral Models for Specification Defects

**Behavioral specs** → build state transition diagrams (find missing states, deadlocks, nondeterminism); CRUD matrices (find missing operations); activity diagrams (find dead-end paths, missing exceptions).

**Rule-based specs** → create decision table; check completeness (checksum), consistency, feasibility.

**Data-heavy specs** → create domain model; check for overlapping partitions, gaps, missing ranges.

### Step A4: Consolidate and Report

Merge findings, eliminate duplicates, classify by type/severity/location, present to product owner, track resolution.

---

## Part B: Defect Recurrence Prevention (Post-Testing)

### Step B1: Collect and Classify Defects

1. Export all defects from the testing cycle
2. Classify using agreed scheme:
   - **ODC**: Defect type (Function/Algorithm/Interface), Trigger, Impact
   - **IEEE 1044**: Standard anomaly attributes
   - **Severity-based**: Critical/Major/Minor/Trivial
3. Maintain consistent classification throughout the SDLC

### Step B2: Analyze Distribution

1. Frequency counts by defect type and quality characteristic
2. Pareto analysis: top 20% of types causing 80% of defects
3. Compare actual vs. predicted defect clusters

### Step B3: Calculate Metrics

- **DDP** = Defects found in testing / Total defects (found + escaped) → low DDP = test level ineffective
- **PCE** = Defects introduced and removed in same phase / Total introduced in phase → low PCE = phase containment failing

### Step B4: Perform RCA

For top defect types from Pareto: apply Five Whys or cause-effect diagram. Identify root cause category (process / people / tools / environment).

### Step B5: Implement and Verify Improvements

- Update checklists with newly discovered defect types
- Update technique selection guidance
- Update team processes (Definition of Ready/Done)
- After next cycle: recalculate DDP and PCE; retain effective changes

## Related Rules
- [review-techniques](../rules/review-techniques.md)
- [model-based-defect-detection](../rules/model-based-defect-detection.md)
- [defect-prevention-practices](../rules/defect-prevention-practices.md)
- [root-cause-analysis](../rules/root-cause-analysis.md)
- [test-result-analysis](../rules/test-result-analysis.md)
- [phase-containment](../rules/phase-containment.md)