---
title: Root Cause Analysis with Defect Classification
impact: HIGH
impactDescription: >
  RCA without consistent defect classification cannot identify systemic patterns across
  many defects. Standardized classification (ODC, IEEE 1044) bridges quantitative defect
  statistics and qualitative root causes, enabling process improvement that prevents recurrence.
tags:
  - root-cause-analysis
  - rca
  - defect-classification
  - odc
  - ieee-1044
  - ch5
---

# Root Cause Analysis with Defect Classification

## Definition

**Root cause analysis (RCA)**: A technique for identifying and addressing the **underlying or fundamental causes** of a defect, rather than only its symptoms.

**Primary objective**: Prevent the **recurrence** of defects.

## Why Defect Classification Enables RCA

**Problem**: Many defects need analysis; individual detailed RCA for each is impractical.

**Solution**: Classify defects first, then perform RCA for defect **types** rather than individual defects.

**Benefit**: Defect classification:
- Extracts information about development process from individual defects
- Turns defect data into a process measurement
- Provides insight into types of errors made during development
- Bridges quantitative statistics and qualitative root causes

## RCA Techniques

| Technique | Description |
|-----------|-------------|
| **Five Whys** | Ask "why" five times to drill down from symptom to root cause |
| **Cause-effect diagrams** | Fishbone/Ishikawa diagrams mapping causes to effects |
| **Pareto analysis** | Identify the 20% of causes responsible for 80% of defects |
| **Defect taxonomies** | Classify defects using structured taxonomies (Beizer, 1990; Catolino, 2019) |
| **Fault tree analysis** | Top-down deductive analysis of failure paths |

## Defect Classification Methods

### 1. Orthogonal Defect Classification (ODC)
**Source**: Chillarege, 1992

**Principle**: Classifies each defect into **orthogonal (mutually exclusive) attributes**, collected at two points:
- **When defect is reported** (trigger, impact)
- **When defect is fixed** (defect type, source, age, qualifier)

**Key ODC attributes**:
| Attribute | Description | Values (examples) |
|-----------|-------------|------------------|
| Defect type | Nature of the fix | Function, Assignment, Algorithm, Interface, Build, Documentation |
| Trigger | What triggered detection | Coverage, Variation, Sequencing, Interaction, Review |
| Impact | What the customer experiences | Reliability, Performance, Usability, Security |

**Value**: The distribution of ODC attributes reveals systemic issues in development process.

### 2. IEEE 1044
**Source**: IEEE Standard 1044:2009

**Purpose**: Standard classification for software anomalies providing:
- Core set of attributes for classification of failures and defects
- Standardized across projects and organizations

**Use case**: Cross-organizational defect data comparison and industry benchmarking.

### 3. Severity-Based Classification

Simple classification by impact:
| Severity | Description |
|----------|-------------|
| Critical | System crash, data loss, security breach |
| Major | Feature completely unusable |
| Minor | Feature partially works; workaround available |
| Trivial | Cosmetic, no functional impact |

**Limitation**: Does not capture root cause information; useful for prioritization only.

### 4. Defect Taxonomy Models

**Examples**:
- Beizer, 1990 — classic defect taxonomy
- Catolino et al., 2019 — modern taxonomy

Defects can also be mapped to quality attributes using:
- ISO/IEC 25010:2023 quality model
- FURPS model (Grady et al., 1987): Functionality, Usability, Reliability, Performance, Supportability

## RCA Process

```
Step 1: Collect defects
        ↓
Step 2: Classify defects uniformly (ODC, IEEE 1044, or agreed scheme)
        ↓
Step 3: Analyze distribution (Pareto: which types occur most?)
        ↓
Step 4: Select top defect types for detailed RCA
        ↓
Step 5: Apply RCA technique (5 Whys, fishbone) to each type
        ↓
Step 6: Identify root causes (process, tools, skills, communication)
        ↓
Step 7: Propose corrective actions
        ↓
Step 8: Implement and verify effectiveness
        ↓
Step 9: Update checklists, processes, training
```

## TA's Role in RCA

- **Support organization** in standardizing defect classification
- **Collect detailed defect data** for classification and analysis
- **Participate in RCA sessions** with subject matter experts
- **Propose corrective actions** to address identified root causes
- **Verify** that corrective actions had the desired effect (using DRE, PCE metrics)

## Standardization Benefit

Uniform defect classification throughout the entire SDLC:
- From early testing to production
- Enables comparison across releases, projects, and organizations
- Improves communication about defects
- Enables industry benchmarking

## Example RCA Application

**Observed pattern**: High frequency of "boundary condition" defects in a payment system.

**Classification**: ODC defect type = "Algorithm"; trigger = "Coverage"

**5 Whys**:
1. Why? Boundary not handled correctly
2. Why? Equivalence partition analysis incomplete
3. Why? Domain testing not applied for numeric inputs
4. Why? Testers not aware of domain testing technique
5. Why? No standard test technique selection guidance exists

**Root cause**: Missing test technique guidance in team standards.

**Corrective action**: Create test technique selection guide (see technique-selection rule); add domain testing to checklist for numeric calculations; provide training.

## References
- ISTQB CTAL-TA v4.0, Section 5.3.2
- Chillarege, 1992 (Orthogonal Defect Classification)
- IEEE 1044:2009 (standard for software anomaly classification)
- Beizer, 1990 (defect taxonomy)
- Catolino et al., 2019 (defect taxonomy)
- ISO/IEC 25010:2023 (quality model for defect mapping)
- ISTQB-ITP v1.0 (improving the test process)
