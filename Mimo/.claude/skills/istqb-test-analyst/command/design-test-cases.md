---
title: Design Test Cases
description: >
  Step-by-step workflow for selecting test techniques, creating high-level and low-level
  test cases, defining pass/fail criteria, establishing traceability, and validating
  test cases against all 9 quality criteria.
usage: >
  Use after completing test basis analysis. Prerequisite: test conditions defined and
  prioritized, test oracle identified, test environment requirements known.
tags:
  - test-design
  - test-cases
  - test-techniques
  - pass-fail-criteria
  - quality-criteria
---

# Command: Design Test Cases

## When to Use

Execute this command when:
- Test conditions have been defined and prioritized
- Moving from test analysis to test design
- Designing test cases for new features or changed functionality
- Adapting existing test cases for regression testing

## Prerequisites

- [ ] Test conditions defined and prioritized (see analyze-test-basis command)
- [ ] Test oracle identified for each condition
- [ ] Risk register available for technique selection guidance
- [ ] Test environment and data requirements being defined (can run in parallel)

## Step 1: Select Test Technique

For each test condition (or group of related conditions):

1. **Identify the risk type** behind the condition:
   - Data handling / boundary values → data-based techniques
   - State-dependent behavior → behavior-based techniques
   - Business rules / logic → rule-based techniques
   - Unknown / exploratory → experience-based techniques

2. **Assess risk level** to determine coverage rigor:
   - HIGH risk → rigorous coverage (reliable domain, 1-switch, full decision table)
   - MEDIUM risk → standard coverage (simplified domain, minimized table, pairwise)
   - LOW risk → experience-based or lightweight coverage

3. **Check contextual constraints**:
   - Test basis format (model-based basis → use matching technique)
   - Oracle availability (no oracle → metamorphic testing)
   - Project time/budget constraints
   - Regulatory requirements

4. **Select primary technique** and optionally a secondary technique for complementary coverage

See `select-test-technique.md` for detailed decision guidance.

## Step 2: Determine Test Case Level

Decide: high-level or low-level (or hybrid)?

| Use High-Level When | Use Low-Level When |
|--------------------|-------------------|
| Test data not yet known | Regulatory compliance required |
| Agile sprint, fast turnaround | Automation target |
| Guiding exploratory sessions | Unknown-author execution |
| Regression (select existing cases) | Audit evidence required |

## Step 3: Create High-Level Test Cases

For each test condition:
1. Write a test case title capturing the test objective
2. Describe the scenario at an abstract level
3. Specify abstract preconditions (state the system must be in)
4. Describe the test steps at a conceptual level
5. Define abstract expected results (what should happen)
6. Link to: test condition, requirement(s), risk(s)

**Example high-level test case**:
- Title: "10% discount applied for medium-tier order"
- Precondition: "Active user with items in cart, total in $50-$100 range"
- Steps: "Complete checkout with qualifying order total"
- Expected: "Checkout summary shows 10% discount applied"

## Step 4: Refine to Low-Level Test Cases (If Required)

For each high-level test case requiring low-level detail:
1. Specify exact precondition data (user credentials, system state, test data values)
2. Write step-by-step test actions (specific UI elements, API calls, data values)
3. Define exact expected results (precise output values, system state)
4. Specify postconditions (what the system state should be after the test)

**Example low-level refinement**:
- Precondition: "User 'test_user@example.com' logged in; cart contains Book B1 ($35) and Book B2 ($25)"
- Step 1: "Navigate to /checkout"
- Step 2: "Verify cart total displays $60.00"
- Step 3: "Verify discount line shows '10% discount: -$6.00'"
- Expected: "Total displays $54.00; order status = 'Pending'"

## Step 5: Define Pass/Fail Criteria

For every test case:
1. Define the oracle (specification section, model state, calculated value)
2. Write the expected result with sufficient precision to evaluate:
   - What exact output or state change should occur?
   - What should NOT occur?
3. Define the failure condition: what constitutes a test failure?

Avoid ambiguous expected results: not "discount is applied" but "10% discount line shows -$X.XX".

## Step 6: Establish Traceability

For each test case, record:
```
Requirement → Test Condition → Test Case → Test Data (planned)
```

In test management tool:
- Link test case to test condition
- Link test condition to requirement/user story
- Link test condition to risk register entry
- Tag test case with applicable test technique used

## Step 7: Validate Against Quality Criteria

Review each test case against all 9 criteria:

| Criterion | Verification Question |
|-----------|----------------------|
| Correctness | Does it actually verify the stated test condition? |
| Feasibility | Can all steps be executed in the available environment? |
| Necessity | Does it cover a unique test objective? (check for duplicates) |
| Understandability | Could someone unfamiliar with the system execute it? |
| Traceability | Is it linked to condition, requirement, and risk? |
| Consistency | Does it follow team formatting and vocabulary standards? |
| Precision | Is there exactly one interpretation? |
| Completeness | Are all required attributes present including expected result? |
| Conciseness | Is it focused on few coverage items? Split if too large. |

## Step 8: Define Exit Criteria for Test Design

Use coverage targets from test planning, residual risk acceptance level, and project constraints. When met: test design is complete.

## Related Rules
- [test-design-tasks](../rules/test-design-tasks.md)
- [high-low-level-test-cases](../rules/high-low-level-test-cases.md)
- [test-case-quality-criteria](../rules/test-case-quality-criteria.md)
- [technique-selection](../rules/technique-selection.md)