---
title: Test Execution Tasks
impact: HIGH
impactDescription: >
  Failure to properly analyze anomalies, update traceability, or recognize defect clusters
  results in missed defects, false results, and lost opportunities to improve the test process.
  Rigorous execution with proper anomaly analysis maximizes defect detection effectiveness.
tags:
  - test-execution
  - anomaly-analysis
  - defect-reporting
  - defect-clusters
  - traceability
  - ch1
---

# Test Execution Tasks

## Purpose

Test execution is carried out according to the test execution schedule. The TA runs tests, compares results, investigates anomalies, reports defects, logs results, and evaluates findings to improve future testing.

## Core Execution Tasks

### 1. Execute Tests

**Manual execution includes**:
- Executing test procedures (scripted tests)
- Exploratory testing using test charters (session-based testing)
- Regression testing (previously passing tests)
- Confirmation testing (re-testing fixed defects)

**Automated tests**:
- TA can run automated test scripts
- Analysis of automation failures may be delegated to developers, TAEs, or TTAs
- TA manually re-executes failed automated tests to check for false positives

### 2. Analyze Anomalies

An **anomaly** is any result that deviates from expected behavior. Anomaly causes include:

| Cause | Description |
|-------|-------------|
| Defect in test object | The primary cause in most cases |
| Missing preconditions | Test setup was incomplete |
| Incorrect test data | Wrong data was used |
| Defect in test script | The test itself has a bug |
| Defect in test environment | Infrastructure issue |
| Misunderstanding of specifications | Expected result was wrong |

The TA investigates each anomaly before classifying it as a defect.

### 3. Report Defects

For confirmed defects:
- Log the actual result observed
- Include test case, steps, environment, and test data used
- Communicate defect based on observed failure
- Report on defects to test management (as needed)
- Classify defect severity and priority

### 4. Update Traceability

After execution, update traceability to reflect:
- Which test cases were executed
- Pass/fail status
- Which defects were found for which test conditions
- Coverage achieved (test basis elements covered)

This enables:
- Transforming test results to risk/coverage information
- Informing stakeholders of pass/fail status by test condition
- Identifying gaps in coverage

### 5. Evaluate Test Results (Beyond Basic Pass/Fail)

The TA performs deeper analysis:

**Defect cluster recognition**:
- A few components usually contain most defects (Pareto principle)
- Clusters indicate need for more rigorous testing of that component
- See test-result-analysis rule for detailed analysis techniques

**False positive verification**:
- Manually re-execute failed automated tests
- Confirm the failure is a real defect, not a flaky test

**Suggest additional tests**:
- Based on learning during previous tests
- New risks discovered during execution
- Edge cases exposed by defect investigation

**Suggest improvements**:
- To test design (better coverage, updated techniques)
- To test implementation (improved procedures)
- To the system under test (architecture, design patterns)
- To regression test suites (refactoring, scope, automation)

**Identify new risks**:
- Information from test execution may reveal previously unknown risks
- Update risk register accordingly

## Exploratory Testing Execution

When conducting exploratory testing:
- Use session-based testing with test charters
- Follow the charter mission while noting unexpected observations
- Record test logs: questions, observations, ideas for future tests
- Document in a session sheet

## Regression Test Execution

- Execute selected regression tests from the regression suite
- Update traceability with results
- Analyze effectiveness: did previously found defects re-appear? Are new defects in unchanged areas?

## Outputs of Test Execution

| Output | Description |
|--------|-------------|
| Test results | Pass/fail status per test case/procedure |
| Defect reports | Logged and classified defects |
| Updated traceability | Execution results linked to test basis |
| Coverage report | Which test conditions were covered |
| Improvement suggestions | For test design, implementation, or SUT |

## References
- ISTQB CTAL-TA v4.0, Section 1.2.4
- ISTQB CTAL-TA v4.0, Section 5.3.1 (defect cluster analysis)
- ISTQB CTAL-TA v4.0, Section 3.4.1 (session-based testing)
