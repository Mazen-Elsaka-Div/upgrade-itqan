---
title: Review Techniques for Test Basis Quality
impact: CRITICAL
impactDescription: >
  Selecting the wrong review technique wastes reviewer effort and misses the defects
  most likely to occur in that test basis type. Five techniques serve different purposes;
  the TA must select or combine them based on reviewing goals and test basis characteristics.
tags:
  - review-techniques
  - ad-hoc-review
  - checklist-review
  - perspective-based-reading
  - pbr
  - phase-containment
  - ch5
---

# Review Techniques for Test Basis Quality

## Purpose

Reviewing the test basis prevents defects from escaping to subsequent phases. The TA applies review techniques during the individual review to identify defects in:
- Requirements specifications
- User stories and acceptance criteria
- Design documents
- Models (state diagrams, activity diagrams, decision tables)

## Review Technique Selection Factors

Selection should consider:
- Reviewing goals and objectives
- Project objectives
- Available resources (time, reviewers)
- Test basis type (textual, model-based, scenario-based)
- Associated risk levels
- Business domain complexity
- Company culture

## The Five Review Techniques

### 1. Ad Hoc Reviewing

**Process**: Reviewers work informally without a structured process. Little or no guidance provided.

**Characteristics**:
- Minimal preparation required
- Highly dependent on reviewer skills
- Reviewers read and document anomalies as encountered

**When to use**:
- Quick, informal reviews
- When time is very constrained
- As a supplement to other techniques

**Limitation**: Without management, can produce a high volume of **duplicate anomaly reports** from multiple reviewers covering the same areas.

### 2. Checklist-Based Reviewing

**Process**: Evaluate the test basis against a predefined checklist.

**Characteristics**:
- Checklists remind reviewers of specific points to check
- Can de-personalize the review (focus on items, not reviewer preferences)
- Checklists can be generic or specific to quality characteristic/test objective/test basis type

**TA tasks**:
- Tailor checklist to test basis type, risk level, and test conditions
- Update checklists with previously missed defects
- Not limited to checklist items — capture anomalies beyond the list

**When to use**:
- Known defect types are a concern
- Consistency across multiple reviewers required
- Risk-focused review needed
- Regular inspection-style reviews

### 3. Scenario-Based Reviewing

**Process**: Simulate a process or activity to identify anomalies. Most effective for scenario-based test basis (use cases, activity diagrams).

**Characteristics**:
- Reviewers perform "dry runs" based on expected usage
- Scenarios provide guidelines but reviewers can go beyond them
- Particularly effective for behavioral specifications

**When to use**:
- Test basis contains use cases or activity diagrams
- Process flows are the main content
- End-to-end behavior must be verified

**Value**: Reviewers can find not only documented defects but also gaps in exception handling.

### 4. Role-Based Reviewing

**Process**: Assign specific roles to reviewers based on user types or organizational roles.

**Typical roles**:
- End user types: experienced user, inexperienced user, senior user, child user
- Organizational roles: administrator, regular user, power user
- Each role can be described by a **persona** (concrete but fictional character)

**Characteristics**:
- Distributes responsibilities based on roles
- Allows individuals to focus on specific aspects
- Ensures comprehensive coverage of all user perspectives
- Reduces duplication (reviewers focus on their assigned role)

**When to use**:
- System has multiple distinct user types
- Different roles have different permissions or workflows
- Usability and accessibility review

### 5. Perspective-Based Reading (PBR)

**Process**: Review the test basis from various perspectives/viewpoints. Reviewers attempt to use the test basis to generate the work product they would derive from it.

**Example perspectives**:
- Designer: Can this be implemented as specified?
- Tester: Can acceptance tests be derived from this? Is all necessary information present?
- Marketer: Does this meet market needs?
- Administrator: Are deployment/configuration requirements clear?
- End user: Can I understand what the system will do?

**Characteristics**:
- More in-depth individual reviewing
- Less duplication of anomalies among reviewers
- Tester would attempt to generate draft acceptance tests from requirements
- **Strongest technique** for finding missing information and inconsistencies

**When to use**:
- High-complexity specifications
- Multiple stakeholder perspectives important
- Requirements completeness is critical
- Time investment justified by risk level

## Technique Comparison

| Technique | Preparation | Finding Type | Duplication Risk | Best For |
|-----------|-------------|-------------|-----------------|---------|
| Ad hoc | Low | Any | High | Quick review, supplement |
| Checklist-based | Medium | Known types | Low | Risk-focused, consistency |
| Scenario-based | Medium | Behavioral | Medium | Use cases, process flows |
| Role-based | Medium | Role-specific | Low | Multi-user systems |
| PBR | High | Missing info, inconsistency | Low | Complex specs, high risk |

## Combining Techniques

For complex specifications:
- Use **PBR** as the primary technique for deep individual review
- Supplement with **checklist-based** for known risk areas
- Add **scenario-based** for behavioral sections

## References
- ISTQB CTAL-TA v4.0, Section 5.2.2
- ISO/IEC 20246:2017 (work product reviews)
- ISTQB CTFL v4.0.1, Section 3.2 (review types)
