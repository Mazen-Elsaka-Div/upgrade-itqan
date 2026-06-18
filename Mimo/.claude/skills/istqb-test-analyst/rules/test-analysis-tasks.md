---
title: Test Analysis Tasks
impact: CRITICAL
impactDescription: >
  Inadequate test analysis leads to incomplete test coverage, undetected defects in the test basis,
  and misaligned test conditions. Proper analysis ensures the test basis is testable and all
  significant test conditions are identified, prioritized, and traced.
tags:
  - test-analysis
  - test-conditions
  - traceability
  - entry-criteria
  - ch1
---

# Test Analysis Tasks

## Purpose

Test analysis is the activity where the TA determines "what to test." It produces test conditions that guide test design. The TA also checks the quality of the test basis and provides early feedback to product owners.

## Entry Criteria Check

Before starting test analysis, the TA verifies:
1. **Test planning complete**: Test scope, objectives, and approach are defined
2. **Test basis defined**: Requirements, user stories, or other specifications are available
3. **Risks identified**: Product risks have been evaluated and documented (if required)

Failure to meet entry criteria means the TA should escalate, not proceed blindly.

## Core Analysis Tasks

### 1. Evaluate the Test Basis
- Check completeness: Are all features covered?
- Check testability: Can the requirements be verified?
- Identify defects: Incompleteness, inconsistencies, ambiguities
- Document defects if not directly fixed
- Determine required test oracles (see test-oracle rule)
- Apply modeling for formal representation (see model-based-defect-detection rule)
- Apply review techniques (see review-techniques rule)

### 2. Identify Test Conditions

**Definition**: A test condition is an aspect of the test object that can be evaluated by one or more test cases.

**Process**:
1. Start with high-level test conditions (e.g., "functionality of screen X")
2. Refine to detailed conditions (e.g., "Screen X rejects account numbers one digit too short")
3. Ensure each condition addresses a test objective
4. Align conditions with identified product risks

**In Agile environments**: Test conditions can be expressed as acceptance criteria for user stories.

### 3. Prioritize Test Conditions
- Consider product risk levels: higher risk → higher priority
- Use risk register to guide prioritization
- Balance coverage with available effort

### 4. Determine Regression Scope (Incremental/Iterative)
- Perform impact analysis to determine what changed
- Identify test conditions affected by changes
- Scope regression testing based on impact

### 5. Capture Traceability
- Test conditions must be traceable to elements of the test basis
- Traceability supports coverage assessment and change impact analysis
- Format: test basis element → test condition → (later) test case

## Progressive Refinement Approach

```
High-level condition:     "Discount calculation on checkout"
        ↓
Detailed condition 1:     "10% discount applied when order total > $50"
Detailed condition 2:     "20% discount applied when order total > $100"
Detailed condition 3:     "No discount applied when order total ≤ $50"
Detailed condition 4:     "Discounts are not stackable"
```

This approach:
- Supports sufficient coverage
- Enables early start to test design (even before user stories are fully refined)
- Provides stakeholders with understandable test scope

## Stakeholder Involvement

The TA involves stakeholders in reviewing test conditions to ensure:
- The test basis is clearly understood
- Testing is aligned with test objectives
- Business priorities are reflected in condition prioritization

## Outputs of Test Analysis

| Output | Description |
|--------|-------------|
| Defect reports | Defects found in the test basis |
| Test conditions | Prioritized list traceable to test basis |
| Regression scope | Identified set of test conditions for regression |
| Test oracle identification | Oracle types required per condition |

## Common Mistakes

- Proceeding without meeting entry criteria (leads to wasted effort)
- Creating test conditions too abstract (e.g., "test the login") with no measurable coverage
- Failing to prioritize (all conditions treated equally regardless of risk)
- Missing traceability (cannot assess coverage or handle changes)
- Defining test conditions in isolation without stakeholder review

## References
- ISTQB CTAL-TA v4.0, Section 1.2.1
- ISTQB CTFL v4.0.1, Section 4.5.1 (collaborative user story writing)
- ISTQB CTFL v4.0.1, Section 1.4.4 (traceability)
