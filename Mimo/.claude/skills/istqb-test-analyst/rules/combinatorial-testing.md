---
title: Combinatorial Testing
impact: CRITICAL
impactDescription: >
  Interaction failures between parameters can only be detected through combinatorial testing.
  Missing parameter combinations in test cases leaves entire classes of defects undetected.
  Pairwise coverage detects ~97% of failures involving one or two parameter interactions.
tags:
  - combinatorial-testing
  - pairwise-testing
  - n-wise
  - classification-trees
  - interaction-failures
  - data-based
  - ch3
---

# Combinatorial Testing

## Definition

Combinatorial testing aims to reveal failures caused by **specific combinations of parameter values** (interaction failures). Not every parameter contributes to a failure — most failures are triggered by a single parameter value or interactions between a small number of parameters.

## Key Insight

Empirical research (D. Kuhn et al., 2004) shows:
- ~97% of failures are caused by one or two interacting conditions
- Pairwise testing is therefore highly effective
- This aligns with the **coupling effect hypothesis**: detecting simple defects often uncovers complex defects

## Two Main Approaches

### 1. Combinations of Configuration Parameters
- Different environment configurations (OS, browser, device)
- Same test case can be executed with different configuration combinations
- Well-suited for adaptability and installability testing

### 2. Combinations of Input Data Values
- Different input values for multiple parameters
- Each combination becomes a complete test case
- Creates a test suite for the system under test

## Terminology

**Parameter-value pair**: A specific parameter and its value, e.g., `(color, red)`.

## Coverage Criteria

### Base Choice Coverage
- Assumes some parameter-value pairs are more important than others
- Select one **base parameter-value pair** per parameter
- **Base coverage item**: the combination of all base parameter-value pairs
- **Additional coverage items**: replace one base value at a time with each non-base value

### Pairwise Coverage (N=2)
- Coverage items are **pairs** of parameter-value pairs for any two parameters
- Ensures every combination of any two parameter values is covered at least once
- Tools available for generating minimal pairwise test sets (though finding the minimum is NP-hard)
- Detects ~97% of failures (two-parameter interactions)

### N-Wise Coverage
- Extends pairwise to all N-tuples of parameter values
- N=3: all triples covered; N=4: all quadruples; etc.
- Number of test cases grows with N but remains practical for small N
- Use N>2 only when there is evidence of higher-order interactions

## Implementation Steps

### Step 1: Identify Parameters and Values
- List all input parameters or configuration parameters
- Enumerate possible values for each parameter

### Step 2: Apply Equivalence Partitioning (if needed)
- For parameters with many values, apply EP first to reduce the value count
- Represent each partition by a representative value

### Step 3: Capture in Classification Tree
- Organize parameters and their values in a hierarchical classification tree
- Supports systematic management of combinations

### Step 4: Select Coverage Level
- Pairwise (N=2) for most situations
- Higher N for safety-critical or high-risk areas

### Step 5: Generate Test Cases
- Use tools (e.g., ACTS from NIST, Hexawise) to generate minimal test sets
- Adjust for constraints (invalid combinations, required combinations)

### Step 6: Add Constraints
- Invalid combinations: some parameter-value pairs cannot co-occur
- Required combinations: specific combinations known to be problematic
- Infeasible combinations: remove from test set

## Example

Parameters: Browser (Chrome, Firefox, Safari), OS (Windows, macOS, Linux), Version (v1, v2)

Full combination count: 3 × 3 × 2 = 18

Pairwise coverage requires significantly fewer test cases (typically 6-9 for this example).

## Classification Tree

```
Configuration
├── Browser
│   ├── Chrome
│   ├── Firefox
│   └── Safari
├── OS
│   ├── Windows
│   ├── macOS
│   └── Linux
└── App Version
    ├── v1
    └── v2
```

## When to Use Combinatorial Testing

- Software with multiple configuration parameters
- User interfaces with multiple input fields interacting
- System configuration testing (adaptability, installability)
- When exhaustive testing is impossible due to combination explosion
- Integration testing with multiple interacting components

## References
- ISTQB CTAL-TA v4.0, Section 3.1.2
- Ammann et al., 2008 (combinatorial testing criteria)
- Forgács et al., 2019 (combinatorial testing)
- D. Kuhn et al., 2004 (empirical study: 97% failures from 1-2 interactions)
- Cohen et al., 1994 (coupling effect hypothesis)
- Czerwonka, 2004 (tools for combinatorial testing)
