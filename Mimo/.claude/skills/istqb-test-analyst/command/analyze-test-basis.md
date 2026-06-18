---
title: Analyze Test Basis
description: >
  Step-by-step workflow for evaluating the test basis, identifying defects, defining test
  conditions, prioritizing by risk, and establishing traceability before test design begins.
usage: >
  Use when beginning test analysis for a new feature, sprint, or test level.
  Prerequisite: test planning completed, test basis available, risks identified.
tags:
  - test-analysis
  - test-conditions
  - traceability
  - entry-criteria
---

# Command: Analyze Test Basis

## When to Use

Execute this command when:
- Starting test analysis for a new feature, user story, or release
- Receiving a new or updated requirements document
- Beginning test analysis for a new test level (system testing, acceptance testing)

## Prerequisites

Before starting, verify entry criteria:
- [ ] Test planning is complete (scope, objectives, approach defined)
- [ ] Test basis (requirements, user stories, specifications) is available
- [ ] Product risks have been identified and documented (at minimum)

If entry criteria are not met: **escalate to test manager before proceeding**.

## Step 1: Check Entry Criteria

1. Confirm test plan exists and is accessible
2. Confirm test scope is clearly defined
3. Confirm test basis version is stable enough for analysis
4. Note any open issues in the test basis that need resolution

## Step 2: Evaluate Test Basis Quality

For each element of the test basis, assess:

**Completeness**: Is all necessary information present?
- [ ] Are all user goals covered?
- [ ] Are error conditions and exceptions described?
- [ ] Are all interfaces and integrations specified?

**Consistency**: Are there contradictions?
- [ ] Do different sections agree on the same terms and behaviors?
- [ ] Are boundary values consistent across related requirements?

**Testability**: Can this be verified?
- [ ] Are acceptance criteria measurable and observable?
- [ ] Are expected results determinable?
- [ ] Are preconditions and postconditions specified?

**Ambiguity**: Is the language precise?
- [ ] Are all terms defined or use consistent vocabulary?
- [ ] Are requirements free of subjective language ("fast", "easy", "reasonable")?

## Step 3: Identify Defects in the Test Basis

For each defect found:
1. Document the defect with: location, type (missing, inconsistent, ambiguous, untestable), description
2. Classify: can the test analyst proceed despite this defect?
   - **Blocking**: Must be resolved before analysis can continue
   - **Non-blocking**: Analysis can proceed; defect tracked separately
3. Report defects to product owner/requirements author
4. If not fixed immediately: document and continue analysis noting the assumption made

**Defect types to look for**:
- Incompleteness: missing error handling, missing data ranges, missing edge cases
- Inconsistency: conflicting behaviors described in different sections
- Ambiguity: subjective requirements, undefined terms
- Infeasibility: requirements that cannot be implemented or tested

## Step 4: Define Test Conditions

**Start high-level**:
1. Identify each distinct behavior, feature, or risk area as a high-level test condition
2. Write at the level of "what" not "how"
3. Examples:
   - "Discount calculation when order total exceeds threshold"
   - "User authentication with expired credentials"
   - "Order creation with out-of-stock items"

**Refine to detailed conditions**:
1. For each high-level condition, identify specific scenarios
2. Include positive cases (valid inputs, happy paths)
3. Include negative cases (invalid inputs, error conditions)
4. Include boundary cases (edge values, limits)
5. Examples:
   - "10% discount applied when total > $50 and ≤ $100"
   - "20% discount applied when total > $100"
   - "No discount when total ≤ $50"

## Step 5: Prioritize Test Conditions by Risk

For each test condition, assign priority based on:
- Risk level from risk register (HIGH/MEDIUM/LOW)
- Business criticality of the feature
- Likelihood of defects in this area

Prioritization drives:
- Which conditions to test first
- Which conditions get more rigorous coverage criteria
- Which conditions can be deferred if time is short

## Step 6: Determine Test Oracle Requirements

For each test condition:
1. Identify the source of expected results (test oracle)
2. If oracle is clear (specification provides expected behavior): document it
3. If oracle problem exists: select oracle strategy
   - Pseudo-oracle, model-based, metamorphic, or human oracle
4. Flag conditions with oracle problems for discussion with team

## Step 7: Document Traceability

Create traceability from:
```
Test Basis Element → Test Condition(s)
```

For each test condition:
- Record which requirement(s) or user story it covers
- Record which risk(s) it addresses
- Tag with priority and oracle source

Use test management tool to maintain this traceability.

## Outputs

| Output | Description |
|--------|-------------|
| Defect list | Defects found in the test basis |
| Test conditions (high-level) | Prioritized, traceable to basis |
| Test conditions (detailed) | Refined sub-conditions |
| Oracle notes | Oracle type required per condition |
| Traceability matrix | Basis → conditions mapping |

## Next Step

Proceed to `design-test-cases.md` command.

## Related Rules
- [test-analysis-tasks](../rules/test-analysis-tasks.md)
- [test-oracle](../rules/test-oracle.md)
- [risk-analysis](../rules/risk-analysis.md)