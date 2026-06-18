---
title: Quality Criteria for Test Cases
impact: CRITICAL
impactDescription: >
  Test cases not meeting quality criteria cause high maintenance costs, execution errors,
  false results, and poor coverage. All 9 criteria must be applied to every test case
  to ensure the test suite remains reliable, understandable, and maintainable over time.
tags:
  - test-cases
  - quality-criteria
  - correctness
  - traceability
  - maintainability
  - ch1
---

# Quality Criteria for Test Cases

## Why Quality Criteria Matter

Neglecting test case quality leads to:
- High maintainability costs
- Reduced comprehensibility (cannot be executed by anyone other than the author)
- Execution delays (ambiguous steps)
- False-positive and false-negative results
- Poor defect detection effectiveness

## The 9 Quality Criteria

### 1. Correctness
- The test case must facilitate **accurate verification** of the test conditions on which it is based
- The test case must actually test what it claims to test
- Incorrect expected results lead to false-positive or false-negative judgments

### 2. Feasibility
- It must be **possible to execute** the test case
- Infeasible preconditions, unavailable test data, or impossible actions make a test case useless
- Check: Can all preconditions be met? Is the required test environment available?

### 3. Necessity
- Every test case should cover a **clear test objective** as expressed in its title or summary
- Duplicates should be avoided (redundant coverage wastes effort)
- Do not create test cases for things that should not be tested

### 4. Understandability
- Test cases may be **reviewed, modified, and executed by people other than the author**
- Write in language and format understandable to all relevant stakeholders
- Do not explain the obvious; do not leave out what is not obvious
- Complex test cases should be simplified or split up

Understandability serves:
- Other testers executing the test
- Developers implementing or re-running tests
- Auditors approving the test suite

### 5. Traceability
- Test cases must be **traceable to test conditions, requirements, and risks**
- Enables the TA to keep test cases up to date when the test basis changes
- Traceability supports coverage assessment and impact analysis
- Without traceability, it is impossible to determine what is covered

### 6. Consistency
- **Consistent language, formatting, and structure** across all test cases
- Makes test cases easier to understand and maintain
- The TA may use a glossary to ensure consistent terminology
- Inconsistency across a test suite increases cognitive load and errors

### 7. Precision
- There should be **only one interpretation** of a test case
- Avoid ambiguous terms: "suitable," "as needed," "several," "appropriate"
- Precision prevents:
  - False-negative results (tester interprets loosely, accepts wrong behavior)
  - False-positive results (tester interprets strictly, rejects correct behavior)

### 8. Completeness
- All **necessary attributes** must be present
- Required elements include (per ISO/IEC/IEEE 29119-3):
  - Required test data (see test-data-requirements rule)
  - Clear expected result
  - Preconditions and postconditions
  - Test case identifier and title
- A test case without a clear expected result cannot be evaluated

### 9. Conciseness
- **Granularity** should correspond to the test basis and test conditions
- Prefer **smaller test cases** focused on a few coverage items over large monolithic ones

Benefits of smaller, focused test cases:
- Easier to find the cause of failures
- Can be flexibly combined into test procedures and suites
- A failure does not block subsequent tests
- Easier to maintain individually

**Trade-off**: One large test case vs. several small test cases → prefer smaller when practical.

## Criteria Summary Table

| Criterion | Question to Ask | Risk if Violated |
|-----------|----------------|-----------------|
| Correctness | Does it verify what it claims? | Wrong pass/fail judgment |
| Feasibility | Can it be executed? | Blocked test execution |
| Necessity | Is it needed? | Redundant effort |
| Understandability | Can others execute it? | Execution errors |
| Traceability | Is it linked to requirements? | Cannot assess coverage |
| Consistency | Is formatting/language uniform? | Confusion, maintenance cost |
| Precision | Is there one interpretation? | False results |
| Completeness | Are all attributes present? | Missing expected result |
| Conciseness | Is granularity appropriate? | Blocking failures, poor diagnosis |

## Application

The format and level of detail depend on project and product context. Agree on standards within the test team before writing test cases. Apply all 9 criteria during test case review.

## References
- ISTQB CTAL-TA v4.0, Section 1.3.2
- ISO/IEC/IEEE 29119-3:2021 (test case attributes)
