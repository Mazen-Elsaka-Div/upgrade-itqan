---
title: Test Design Tasks
impact: CRITICAL
impactDescription: >
  Poor test design results in test cases that miss defects, are unmaintainable, or fail to
  provide clear pass/fail judgments. Rigorous test design ensures systematic coverage of
  test conditions using appropriate techniques with defined criteria.
tags:
  - test-design
  - test-cases
  - pass-fail-criteria
  - traceability
  - exit-criteria
  - ch1
---

# Test Design Tasks

## Purpose

Test design describes **how** to perform testing to achieve test objectives. It produces test cases (high-level or low-level) based on test conditions. Design depends on required coverage, the test basis, SDLC, project constraints, and tester knowledge.

## Core Design Tasks

### 1. Select Test Level and Approach
- Determine whether high-level or low-level test cases are appropriate (see high-low-level-test-cases rule)
- Apply systematic approach using test techniques, or ad hoc otherwise
- Make design tool-agnostic and technology-independent for portability

### 2. Design Test Cases

**For new/changed conditions**:
- Design test cases according to the 9 quality criteria (see test-case-quality-criteria rule)
- Select appropriate test technique(s) based on risk type (see technique-selection rule)
- Identify clear pass/fail criteria for every test case

**For regression tests**:
- Select existing high-level test cases, or
- Adapt existing low-level test cases based on prioritization
- Full redesign usually not required

### 3. Define Pass/Fail Criteria
- Every test case must have unambiguous expected results
- Expected results come from the test oracle (specification, model, human knowledge)
- A test case without clear pass/fail criteria cannot be evaluated objectively

### 4. Capture Traceability
- Record traceability: test basis → test conditions → test cases
- In experience-based testing, test conditions guide execution (test cases not always documented)
- Some test cases may be based on high-level test objectives without detailed conditions

### 5. Define Additional Work Products
- **Test environment requirements**: Hardware, software, network, middleware (see test-environment-requirements rule)
- **Test data requirements**: Identify, create, or specify (see test-data-requirements rule)

### 6. Determine Exit Criteria
- Use exit criteria from test planning (coverage levels, residual risk levels)
- Other criteria: project constraints (budget, time)
- Exit criteria indicate when test design is complete

## Test Design by Technique Category

| Category | Techniques | Primary Defect Target |
|----------|-----------|----------------------|
| Data-based | Domain testing, Combinatorial, Random | Data handling, boundaries, parameter combinations |
| Behavior-based | CRUD, State Transition, Scenario-based | Missing features, communication, processing defects |
| Rule-based | Decision Table, Metamorphic | Logic defects, business rule violations |
| Experience-based | Session-based, Checklist, Crowd | Unknown defect types, coverage gaps |

## Communicative Role of Test Cases

Test cases serve multiple stakeholders:
- **Other testers**: Must understand how to execute the test
- **Developers**: May implement or re-run failed tests
- **Auditors**: May need to approve test cases
- **Stakeholders**: May review test coverage

Write test cases in language understandable to all relevant stakeholders. Avoid technical jargon when business stakeholders must review.

## Tool-Agnostic Design

Test design should be independent of specific tools or technologies:
- Logical/abstract test cases remain valid if tooling changes
- Test conditions should be expressed in business terms
- Low-level specifics (exact selectors, API paths) belong in implementation, not design

## Design Quality Checklist

Before finalizing test design:
- [ ] Each test case has clear pass/fail criteria
- [ ] Test conditions are covered by at least one test case
- [ ] Traceability from test basis to test cases is complete
- [ ] Test environment and data requirements are defined
- [ ] Exit criteria are defined and measurable
- [ ] Test cases meet all 9 quality criteria

## Outputs of Test Design

| Output | Description |
|--------|-------------|
| Test cases (high/low level) | Covering all prioritized test conditions |
| Pass/fail criteria | Clear expected results per test case |
| Test environment spec | Requirements for env setup |
| Test data spec | Data needed for test execution |
| Traceability matrix | Basis → conditions → cases |

## References
- ISTQB CTAL-TA v4.0, Section 1.2.2
- ISTQB CTAL-TA v4.0, Sections 1.3.1–1.3.5 (work products)
- ISO/IEC/IEEE 29119-3:2021 (test documentation)
