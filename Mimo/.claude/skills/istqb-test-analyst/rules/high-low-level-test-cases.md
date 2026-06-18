---
title: High-Level and Low-Level Test Cases
impact: HIGH
impactDescription: >
  Conflating high-level and low-level test cases leads to either over-specified test suites
  (brittle, high maintenance) or under-specified suites (no concrete execution guidance).
  Correct application at each project phase optimizes coverage, maintainability, and effort.
tags:
  - test-cases
  - high-level
  - low-level
  - abstract
  - concrete
  - ch1
---

# High-Level and Low-Level Test Cases

## Definitions

### High-Level Test Case (Abstract / Logical)
- Describes **circumstances** in which the test object is examined
- Indicates which test conditions are covered
- Does **not** contain concrete: preconditions, input data, expected outputs, or postconditions
- All expressed at an abstract level

**Example**: "Order more than one book, with the order price resulting in a discount; expected result: discount is assigned"

### Low-Level Test Case (Concrete / Physical)
- The **detailed refinement** of a high-level test case
- Describes exactly: what data to prepare, what actions to take, what the concrete expected result is
- Contains specific: preconditions, input data, expected results, and postconditions

**Example**: "Order books B1 ($10) and B2 ($20), total order price $30; expected result: 10% discount assigned, total price: $27"

## Relationship Between High and Low Level

```
High-Level Test Case
        │
        ├─ Low-Level Test Case 1 (e.g., discount = exactly 10%)
        ├─ Low-Level Test Case 2 (e.g., discount boundary at $50)
        └─ Low-Level Test Case 3 (e.g., discount with currency rounding)
```

- One high-level test case can be implemented in **one or more** low-level test cases
- Sometimes a test case remains high-level, with concrete information determined during execution
- The transition from high to low is often deferred to test implementation (especially when specific test data is needed)

## When to Use Each

### Use High-Level When
- Specific test data is not yet available or defined
- Agile sprint: user stories are still being refined
- Guiding exploratory test sessions (test charter objectives)
- Test conditions are clear but implementation details are not yet finalized
- Regression test selection (select relevant high-level cases)

### Use Low-Level When
- Regulatory compliance requires concrete evidence
- Test automation: scripts need exact input/output values
- Tests will be executed by testers unfamiliar with the system
- Auditors need to approve test cases
- Debugging requires exact reproduction steps

## Transition from High to Low

The transition is more than filling in values — it is a step from **conceptual to technical**:
1. High-level identifies the scenario and coverage intent
2. Low-level specifies exact data, actions, and verification steps
3. Transition often happens during test implementation, not test design

The TA must ensure that **everything necessary to execute** the low-level test cases is known before finalizing them.

## Hybrid Test Cases

In practice, many test cases are **hybrid**:
- Concrete in some aspects (e.g., specific user role, known product)
- Abstract in others (e.g., "any valid payment method")

Hybrids reflect a trade-off between:
- **Maintainability**: Abstract cases require fewer updates when details change
- **Comprehensibility**: Concrete cases are easier to execute and understand

## Role in Regression Testing

For regression tests:
- Selection of existing **high-level test cases** is usually sufficient
- Adaptation of existing **low-level test cases** based on prioritization
- Full redesign is not normally required unless the underlying feature changed significantly

## Guidance for Session-Based Testing

High-level test cases can guide the TA when creating test objectives within a **test charter** for session-based testing:
- The charter outlines what to explore
- The TA elaborates on specific test actions during the session
- Results are recorded in the session sheet

## References
- ISTQB CTAL-TA v4.0, Section 1.3.1
- Koomen et al., 2006 (TMap Next)
- ISTQB CTAL-TA v4.0, Section 3.4.1 (test charters)
