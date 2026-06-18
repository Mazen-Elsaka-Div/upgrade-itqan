---
title: Functional Testing
impact: HIGH
impactDescription: >
  Confusing functional completeness, correctness, and appropriateness leads to applying
  the wrong techniques and missing an entire sub-characteristic of functional suitability.
  Each sub-characteristic requires distinct test approaches and different timing in the SDLC.
tags:
  - functional-testing
  - functional-suitability
  - functional-completeness
  - functional-correctness
  - functional-appropriateness
  - ch4
---

# Functional Testing

## Overview

Functional testing is one of the core tasks of the Test Analyst. It focuses on the **functional suitability** quality characteristic from ISO/IEC 25010:2023, which has three sub-characteristics:

| Sub-characteristic | Question | Key Focus |
|-------------------|----------|-----------|
| **Functional completeness** | Is everything asked for implemented? | Coverage of all specified tasks and user objectives |
| **Functional correctness** | Are the results correct? | Accuracy, precision, consistency for valid and invalid inputs |
| **Functional appropriateness** | Does implementation fulfill users' needs? | Whether functions help users accomplish their tasks |

## Functional Completeness Testing

### What It Tests
- Verifies that **all specified tasks** of the software are implemented
- Checks that the **intended users' objectives** are achievable
- Key question: "Is everything that was asked for implemented?"

### When to Address It
- **Sequential development**: Review requirements specification as early as possible
- **Agile**: Discuss user stories and acceptance criteria during collaborative user story writing
- **System testing/Acceptance testing**: Dynamic testing to verify completeness

### How to Test It
- **Primary technique**: Behavior-based (scenario-based testing) — confirms all user workflows work
- **Other black-box techniques**: Also suitable for completeness coverage
- **Traceability**: Essential for determining achieved completeness level
  - Test basis → test conditions → test cases → results
  - Missing trace = potentially missing functionality

## Functional Correctness Testing

### What It Tests
- Whether actual results are **correct** (accurate, precise, consistent)
- Applies to both valid and invalid inputs
- Key question: "Are the results right?"

### When to Address It
- Can be tested at **any test level**
- **Shift left**: Most functional correctness testing should occur in component and integration testing
- TA should contribute to these lower test levels even if not formally responsible

### How to Test It
- **All black-box techniques**: Suitable for correctness testing
- **Experience-based techniques**: Complement systematic testing
- **Collaboration-based testing**: Effective for correctness of business logic
- **Critical requirement**: Effective test oracle providing expected results in detail
  - Without a good oracle, correctness cannot be objectively evaluated

## Functional Appropriateness Testing

### What It Tests
- Whether implemented functions **facilitate accomplishing specified tasks**
- Focus on whether the system actually helps users achieve their goals
- Key question: "Does what is implemented truly fulfill users' needs?"

### When to Address It
- **Sequential development**: Dynamic testing starts at system testing and acceptance testing
- **Agile**: Demo sessions allow business stakeholders to evaluate appropriateness

### How to Test It
- **Exploratory testing**: Best for discovering whether users can achieve their goals
- **Collaboration-based testing**: Business stakeholders participate in evaluation
- **Behavior-based techniques**: Also suitable for structured coverage
- **User interface design reviews**: Especially important for interactive applications

## Black-Box Techniques by Sub-characteristic

| Sub-characteristic | Recommended Techniques |
|-------------------|----------------------|
| Completeness | Scenario-based, Use case testing, Traceability-based |
| Correctness | Any black-box technique (domain, combinatorial, decision table, etc.) |
| Appropriateness | Exploratory, collaboration-based, scenario-based |

## Test Oracle for Functional Testing

For **functional correctness**:
- The test basis (specification) is the primary oracle
- Must provide expected results in sufficient detail
- Oracle problem is common in functional correctness testing
- Solutions: pseudo-oracle, model-based testing, metamorphic testing

## Traceability for Completeness

Completeness is determined through traceability:
```
Requirements → Test conditions → Test cases → Test results
     |                |               |
  Coverage?       Covered?        Passed?
```
Missing traceability = cannot determine if a requirement is tested.

## References
- ISTQB CTAL-TA v4.0, Section 4.1
- ISO/IEC 25010:2023 (functional suitability sub-characteristics)
- ISTQB CTFL v4.0.1 (functional testing overview)
