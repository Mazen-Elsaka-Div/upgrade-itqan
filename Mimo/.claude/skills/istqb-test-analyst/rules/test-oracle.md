---
title: Test Oracle
impact: HIGH
impactDescription: >
  Without a reliable test oracle, pass/fail determination is impossible or subjective.
  The oracle problem must be explicitly addressed in test design; ignoring it leads to
  tests that cannot be evaluated and defects that go undetected.
tags:
  - test-oracle
  - oracle-problem
  - metamorphic-testing
  - pseudo-oracle
  - expected-results
  - ch1
---

# Test Oracle

## Definition

A **test oracle** is the mechanism for determining the expected results in dynamic testing. It provides the basis for comparing actual results against expected results to determine pass or fail.

## Oracle Sources

- **Test basis (primary)**: Textual or formal specification provides expected behavior
- **Human experience/knowledge**: Expert judgment about correct behavior
- **Existing system**: Legacy system or reference implementation
- **Formal model**: Mathematical or behavioral model
- **Automated oracle**: Required when inputs are auto-generated or human oracles are too costly

## The Test Oracle Problem

A cost-effective test oracle may not always be available. This is the **test oracle problem**.

### Contributing Factors

| Factor | Description |
|--------|-------------|
| Data-related complexity | Large number of valid outputs makes comparison hard |
| Non-determinism | AI-based systems produce probabilistic outputs |
| Probabilistic behavior | Randomized algorithms, simulations |
| Missing requirements | Expected behavior not documented |
| Ambiguous requirements | Multiple interpretations possible |

## Solutions to the Oracle Problem

### 1. Pseudo-Oracles
- **What**: Independently developed systems fulfilling the same specification as the test object
- **Examples**: Legacy systems, simplified reference implementations
- **Use case**: Critical systems (safety-critical, financial)
- **Cost**: High (requires developing a separate system)
- **Benefit**: High confidence in results

### 2. Model-Based Testing
- Formalize the test oracle as part of the test model
- Enables generation of expected outputs and derivation of tests from the model
- Behavior-based test techniques (state transition, scenario-based) often implement an automated oracle
- Tool support available for model execution

### 3. Property-Based Testing
- Specify **properties** (invariants) of the test object
- Verify relations between input and expected results
- If a property relation is not met, the test fails
- Well-suited for test automation
- Effectiveness depends on the quality of the properties defined

### 4. Metamorphic Testing
- Does not require exact expected results
- Uses **metamorphic relations (MRs)**: properties describing how output changes when input changes
- See metamorphic-testing rule for detailed guidance
- Preferred for AI-based systems

### 5. Human Oracles
- Human experts determine the expected results
- Preferred for exploratory testing
- May be costly and scarce
- Subject to human error and inconsistency

### 6. Assertions
- Built into test automation code or the test object itself
- Executable statements that verify state or behavior
- In test objects: usually verify what is necessary for continuation of the task
- Complement other oracle mechanisms

## Oracle Selection Guide

```
Can expected results be derived from the test basis?
├── Yes → Use specification as oracle
└── No (oracle problem)
    ├── Is the system critical? → Pseudo-oracle or MBT
    ├── Are invariants/properties definable? → Property-based testing
    ├── Are input-output relations known? → Metamorphic testing
    ├── Is human judgment available? → Human oracle (exploratory testing)
    └── Is automation needed? → Assertions or MBT oracle
```

## Determining Oracles During Test Analysis

The TA determines the test oracles needed **during test analysis** (not test execution). Early identification:
- Ensures correct expected results are captured in test cases
- Identifies cases where oracle problem exists and must be addressed
- May lead to requirements clarification requests

## References
- ISTQB CTAL-TA v4.0, Section 1.3.4
- Barr et al., 2014 (oracle problem and solutions survey)
- ISTQB CTAL-TA v4.0, Section 3.3.2 (metamorphic testing)
