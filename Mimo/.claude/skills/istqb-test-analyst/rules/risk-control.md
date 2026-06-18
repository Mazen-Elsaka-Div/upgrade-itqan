---
title: Risk Control and Regression Test Selection
impact: CRITICAL
impactDescription: >
  Without systematic regression test selection, either too many tests are run (inefficient)
  or too few (risky). The TA must select regression tests based on appropriate criteria,
  continuously evaluate effectiveness, and improve selection over time.
tags:
  - risk-control
  - risk-mitigation
  - regression-testing
  - impact-analysis
  - risk-based-testing
  - ch2
---

# Risk Control and Regression Test Selection

## Overview

Risk control involves:
- **Risk mitigation**: Actions to reduce risk likelihood or impact
- **Risk monitoring**: Ongoing tracking of risk levels

The TA's role is crucial in several risk mitigation actions:
1. Performing reviews (see review-techniques rule)
2. Applying appropriate test techniques and coverage (see technique-selection rule)
3. Applying appropriate test types (see Chapter 4 rules)
4. **Performing regression testing** (primary focus of this rule)

## Regression Testing Objective

The main objective of regression testing is to ensure **confidence in the quality of the test object after a change**. Constraints (time, budget, environment, test data) may prevent running all regression tests, making selection necessary.

The TA must:
- Review the scope of regression testing with every test cycle
- Consider whether the existing regression test suite needs adjustment
- Apply appropriate selection techniques based on the situation

## Regression Test Selection Techniques

### 1. Impact Analysis (Most Reliable for Automated Tests)
- **How**: Tools register which configuration items are activated during each test case execution; when a change occurs, track which items changed and select tests that interact with them
- **Requires**: Automated configuration management system
- **Benefit**: Ensures tests focus on areas most likely to reveal failures after a change
- **Also applicable**: For manual test execution if the TA knows which tests interact with changed items

### 2. Risk-Based Test Selection
- **How**: Maintain traceability of regression test suite to risk register; when risk register is updated after a change, adjust the regression suite to cover highest risk levels
- **Requires**: Up-to-date risk register with traceability to test cases
- **Use when**: Risk levels are well understood and documented

### 3. History-Based Testing
- **How**: Evaluate past test executions; select tests that exposed defects or were sensitive to similar changes; include some tests not run recently
- **Benefit**: Increases likelihood of exposing similar defects to those found previously
- **Use when**: Historical defect data is available and reliable

### 4. Coverage-Based Testing
- **How**: Select a small number of tests that achieve maximum coverage based on chosen test technique(s)
- **Caution**: Balance amount of tests with coverage increase per test
- **Use when**: Coverage metrics are the primary quality gate

### 5. Requirement Traceability Matrix
- **How**: Assess impact of requirement changes on associated tests; select regression tests for directly affected and related features
- **In Agile**: Select tests covering acceptance criteria impacted by new/changed user stories
- **Benefit**: Catches unintended side effects on related features
- **Use when**: Requirements changes are the primary driver of change

### 6. Operational Profiles
- **How**: Select tests based on patterns of use (most common user journeys); prioritize critical usage patterns
- **Example**: Login → search → add to cart → checkout (for an online store)
- **Use when**: Application changed significantly; need a quick overview of overall functionality

## Selecting the Right Technique

No technique is universally superior. Decision factors:

| Factor | Preferred Technique |
|--------|-------------------|
| Automated test suite | Impact analysis (tool-supported) |
| Manual test suite, well-documented risks | Risk-based selection |
| Historical defect data available | History-based |
| Coverage metrics are primary concern | Coverage-based |
| Requirements change is the driver | Traceability matrix |
| Application significantly reworked | Operational profiles |

**Best practice**: Use a **combination** of selection techniques for comprehensive and effective regression testing.

## Balancing Coverage vs. Suite Size

The TA must carefully balance:
- **Need for coverage**: More tests = higher confidence
- **Manageable suite size**: Execution time constraints, resource limitations
- **Cost vs. benefit**: Each additional test must justify its execution cost

## Continuous Improvement of Regression Selection

After each test cycle:
1. Analyze test results to determine effectiveness of selection techniques used
2. Retain techniques that found defects or provided value
3. Replace techniques that proved ineffective
4. Adjust suite size and composition

This continuous improvement is essential in iterative and incremental development models where changes are frequent.

## References
- ISTQB CTAL-TA v4.0, Section 2.2
- ISTQB CTFL v4.0.1, Section 5.2.4 (risk mitigation)
- Juergens et al., 2018 (impact analysis tools)
- Engström et al., 2010 (regression test selection study)
