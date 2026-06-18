---
title: Metamorphic Testing
impact: HIGH
impactDescription: >
  Metamorphic testing is the primary solution to the oracle problem, especially for AI-based
  systems and complex algorithms where exact expected results are unavailable. Without it,
  large classes of systems cannot be systematically tested for correctness.
tags:
  - metamorphic-testing
  - metamorphic-relation
  - oracle-problem
  - ai-testing
  - rule-based
  - ch3
---

# Metamorphic Testing

## Definition

Metamorphic testing (MT) generates test cases **based on an existing source test case** by applying a metamorphic relation (MR) to produce one or more follow-up test cases.

## Metamorphic Relation (MR)

An MR defines:
- A **property** of the test item
- How a **change in test case inputs** is reflected in the test case's **expected results**

The TA does not need to know the exact expected output — only the relationship between inputs and outputs.

## Test Execution Process

1. Create a **source test case** with known inputs (expected result may be unknown)
2. Apply the MR to create one or more **follow-up test cases** (transform the inputs)
3. Combine source + follow-up test cases into a **test procedure**
4. Execute all test cases
5. **Joint result evaluation**: If the actual results satisfy the MR, the test passes; if not, it fails
6. On failure: subsequent debugging determines which individual test case failed

## Classic Example: Average Function

**Source test case**: Series [3, 7, 2, 9, 1] → Average = 4.4 (verified to pass)

**MR 1** – Permutation invariance: "Any permutation of the series produces the same average"
- Follow-up: [1, 2, 3, 7, 9] → Expected: same average (4.4)
- Follow-up: [9, 7, 3, 2, 1] → Expected: same average (4.4)

**MR 2** – Scalar multiplication: "If each number is multiplied by x, the average is multiplied by x"
- Follow-up with x=2: [6, 14, 4, 18, 2] → Expected: 8.8

**Combining MRs**: Permute AND multiply by 2 → [2, 4, 6, 14, 18] → Expected: 8.8

## Oracle Problem Solution

MT is particularly valuable when no oracle exists:

**Example**: AI actuarial system predicting age at death from a large dataset
- Exact expected result unknown
- MR: "If cigarettes smoked increases, predicted age of death should decrease"
- Source test: baseline health profile
- Follow-up: same profile with increased cigarette count
- Pass: follow-up predicted age < source predicted age

This provides **partial verification** without knowing the exact expected result.

## Combining with Random Testing

MT can be combined with random testing to generate large numbers of test cases:
1. Use random number generator to create many source test cases
2. Apply MR to each source to create corresponding follow-up test cases
3. Execute all pairs efficiently with automation

## Coverage Considerations

- **No recognized coverage criteria** exist for MT
- Covering each MR once is insufficient (only partial verification)
- Best approach: cover each MR with multiple diverse source test cases
- Use random testing to generate the source test cases

## Applications

| Domain | MR Example |
|--------|-----------|
| Mathematical functions | Permutation invariance, scalar invariance |
| Search engines | More specific query → fewer or equal results |
| Compilers | Adding dead code → same observable output |
| Machine learning | Flipping unrelated features → same classification |
| Load testing | Follow-up test cases using MRs to generate load scenarios |
| Installability testing | Various installation parameter sequences → same installed state |

## MR Discovery

To identify good MRs:
- Analyze mathematical properties of the function (symmetry, monotonicity, invariance)
- Review the specification for stated properties
- Apply domain knowledge about the business problem
- Use patterns from literature (symmetry, addition, permutation, scaling)

## Benefits

- Addresses oracle problem for complex and AI-based systems
- Scalable: one MR generates unlimited follow-up test cases
- Applicable to both functional and non-functional testing
- Preferred technique for AI/ML testing (ISTQB-AI, v1.0)
- Can be automated cost-effectively

## Limitations

- Finding meaningful MRs requires domain expertise
- Does not provide complete oracle (only partial verification)
- A passing MT result does not guarantee correctness

## References
- ISTQB CTAL-TA v4.0, Section 3.3.2
- ISO/IEC/IEEE 29119-4:2021 (test techniques standard)
- Segura, Towey et al., 2020 (metamorphic testing survey)
- Segura, Fraser et al., 2016 (metamorphic testing survey)
- ISTQB-AI v1.0 (AI testing — metamorphic testing as preferred technique)
