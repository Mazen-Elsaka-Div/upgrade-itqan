---
title: Decision Table Testing
impact: CRITICAL
impactDescription: >
  Business rule defects (missing conditions, overlapping rules, inconsistent actions) are
  among the most costly defects to fix in production. Decision table testing systematically
  verifies every rule and enables static detection of incomplete or inconsistent logic.
tags:
  - decision-table-testing
  - business-rules
  - checksum
  - minimization
  - rule-based
  - ch3
---

# Decision Table Testing

## Definition

Decision table testing verifies the **stateless behavior** of a test item specified by business rules. It uses a tabular format to represent all combinations of conditions and their corresponding actions.

## Decision Table Structure

| | Rule 1 | Rule 2 | Rule 3 | ... |
|--|--------|--------|--------|-----|
| **Condition 1** | T | T | F | |
| **Condition 2** | T | F | - | |
| **Action 1** | X | | | |
| **Action 2** | | X | X | |

- **Conditions**: Input variables that affect the outcome
- **Actions**: Outputs or behaviors resulting from condition combinations
- **Rules**: Each column = one combination of condition values → one set of actions
- **Don't care (–)**: Condition value is irrelevant for this rule

## Creating a Full Decision Table

1. Identify all conditions and their possible values
2. Calculate number of rules: product of number of values per condition
   - 3 binary conditions → 2³ = 8 rules
3. Fill all combinations systematically
4. Define actions for each combination

## Minimization

Full decision tables can be very large. **Minimization** derives an equivalent table with fewer rules.

### Minimization Algorithm
1. Identify rules that are **action-equivalent** (same actions)
2. Among those, find rules differing in **only one condition**
3. If that condition covers **all possible values**, merge the rules
4. Replace the differing condition value with '–' (don't care)
5. Repeat until no further merging is possible

**Important**: Remove **infeasible rules** before merging (combinations that can never occur in practice).

**Note**: Minimization result can depend on the order of column processing; always check whether further minimization is possible after each pass.

## Reviewing the Decision Table

The TA reviews the decision table for:

| Review Criterion | Description |
|-----------------|-------------|
| **Consistency** | If two rules apply to same conditions, they are action-equivalent |
| **Feasibility** | No infeasible rules remain |
| **Completeness** | No feasible combination of conditions is missing |
| **Correctness** | Rules model the system's intended behavior |
| **Non-overlapping** (advisory) | For any condition combination, at most one rule applies |

## Checksum Procedure

Used to verify minimization correctness:

**Calculation**:
1. For each rule in the minimized table:
   - Start with score = 1
   - Each '–' in conditions multiplies the score by the number of individual values for that condition
2. Sum all rule scores = checksum of minimized table

**Interpretation**:
| Checksum Result | Interpretation |
|----------------|----------------|
| Checksum = Original table checksum | Minimization is complete and correct (necessary but not sufficient) |
| Checksum < Original | Minimized table is incomplete (some rules missing) |
| Checksum > Original | Some rules overlap or additional rules exist |

**Important caveat**: Equal checksums alone do not guarantee equivalence. The content must also be verified.

## High-Risk Tables

For decision tables associated with **high risk**:
- Do NOT minimize the table
- Measure decision table coverage against the full (unminimized) feasible decision table
- Every feasible column in the full table should be exercised

## Test Case Design from Decision Tables

- Each rule in the decision table corresponds to one test case (or more if '–' appears)
- For rules with '–', the TA must decide which value to use:
  - If moderate risk: use one representative value
  - If high risk: test all values for the '–' condition

## Decision Table Coverage

**Coverage metric**: Number of columns exercised / Total number of feasible columns in the decision table

## Defect Types Detected

- Missing rules (incomplete coverage of valid conditions)
- Inconsistent rules (same conditions → different actions)
- Overlapping rules (ambiguous behavior)
- Infeasible rules (logic errors in business rules)
- Incorrect actions for given conditions

## Static Defect Detection

Decision tables are particularly effective for **defect prevention**:
- Review the decision table during requirements analysis
- Find omissions, inconsistencies, and redundancies before coding
- Each structural issue in the table corresponds to a potential defect in the implementation

## Example: Loan Approval

| | R1 | R2 | R3 | R4 |
|--|----|----|----|----|
| Credit score ≥ 700 | T | T | F | F |
| Income ≥ $50k | T | F | T | F |
| Approve loan | X | | | |
| Request co-signer | | X | X | |
| Reject | | | | X |

## References
- ISTQB CTAL-TA v4.0, Section 3.3.1
- ISTQB CTFL v4.0.1, Section 4.2.3 (decision table testing basics)
- OMG DMN, 2024 (Decision Model and Notation standard)
