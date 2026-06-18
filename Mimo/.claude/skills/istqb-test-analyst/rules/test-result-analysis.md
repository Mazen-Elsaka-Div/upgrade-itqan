---
title: Analyzing Test Results to Improve Defect Detection
impact: HIGH
impactDescription: >
  Test results contain valuable information beyond individual pass/fail outcomes. Failing to
  analyze defect clusters, DDP, structural coverage, and arrival patterns means missing
  systematic improvement opportunities that would prevent future defect escapes.
tags:
  - test-result-analysis
  - defect-clusters
  - ddp
  - defect-detection-percentage
  - coverage-analysis
  - ch5
---

# Analyzing Test Results to Improve Defect Detection

## Purpose

Test results allow identification of failures AND provide feedback to improve defect detection effectiveness. Systematic analysis of test results enables the TA to:
- Identify where testing was effective/ineffective
- Target additional test effort where needed
- Improve regression test suite coverage
- Detect patterns that indicate systemic quality problems

## Analysis Techniques

### 1. Defect Cluster Analysis

**Principle**: A few components usually contain most defects (Pareto principle / 20-80 rule).

**Process**:
1. After testing, identify actual defect-prone areas (actual clusters)
2. Compare **predicted** vs. **actual** defect clusters
3. In case of discrepancies, apply more rigorous testing to areas with more defects than expected

**Criteria for measuring clusters**:
- **Defect density**: Defects per unit of code/functionality
- **Defect severity**: Critical/major clusters matter more than trivial clusters
- Small clusters of critical/major defects are more important than large clusters of minor/cosmetic defects

**What to do**:
- Areas with MORE defects than predicted → increase testing rigor
- Areas with FEWER defects than predicted → investigate: are tests effective? Was the prediction wrong?

### 2. Defect Detection Percentage (DDP) Analysis

**Definition**: DDP is one of the most important test effectiveness measures for a test level.

**Formula**:
```
DDP = Defects found by test level / Total defects (found + escaped)
```

**Counting boundaries**:
- Include only defects the test level could have detected
- Temporal limits: defects found within a defined time frame after release
- Exclusion criteria: defects in third-party components, specific customer environments

**Interpretation**:
| DDP | Implication |
|-----|-------------|
| High DDP | Test level is effective at detecting defects |
| Low DDP | High percentage of escaped defects; test level is ineffective |

**Response to low DDP**:
- Analyze reasons for escape
- Propose measures to improve
- Make the test level more focused and rigorous

**Divide by severity**: DDP by severity level — priority of reducing escaped defects depends on severity.

### 3. Structural Coverage Analysis

**Purpose**: Assess extent to which tests have exercised specific areas of the test object.

**Coverage types** (typically measured with tools):
- Statement coverage
- Branch coverage
- Path coverage
- Neuron coverage (for ML models)

**Process**:
1. Measure structural coverage after test execution
2. Identify low-coverage areas
3. Target additional test effort on low-coverage, high-risk areas
4. Increasing coverage in these areas helps discover new, previously escaped defects

**Risk filtering**: When selecting additional coverage targets, prioritize by risk level.

### 4. Test Gap Analysis

**Purpose**: Assess extent to which tests have exercised **recent code changes**.

**Difference from structural coverage**:
- Structural coverage identifies all under-covered areas (including old, stable code)
- Test gap analysis focuses on **new or changed code** that has not been tested

**Benefit**: More targeted than full structural coverage:
- New changes not tested at all → highest priority
- Old, stable code with low coverage → lower priority (may have been reliable for years)

**Process**:
1. Identify recently changed code (through version control diff)
2. Analyze which test cases cover those changes
3. Design tests for uncovered new/changed code

### 5. Defect Arrival Pattern Analysis

**Purpose**: Compare actual defect detection rates against theoretical distribution patterns.

**Classic example**: **Rayleigh model** (Elsayed, 2021)
- Single peak distribution
- Skewed to the right
- Pattern: defects found first increase → reach maximum → slowly drop toward zero

**Interpretation examples**:

| Actual Pattern | Implication |
|---------------|-------------|
| Constant low level when pattern predicts increase | Existing tests are too weak, unable to detect additional defects |
| Peak earlier than expected | Testing may be finding easy defects first; harder defects remain |
| Pattern follows Rayleigh closely | Testing is proceeding as expected |
| No decrease after peak | Defects may be introduced as fast as they are found |

**Use case**: Infer strength of existing test cases and potential for improvement.

## Using Defect Metrics Accurately

Common metrics used in analysis:
- Number of defects
- Defect detection percentage
- Test pass/fail counts
- Code coverage percentages
- Defect density

**Important caveat**: Test failure count ≠ defect count:
- Multiple tests may detect the same defect
- One test may reveal multiple defects
- Severity of defects may differ from criticality of tests
- A critical test case may fail due to a cosmetic defect

To calculate actual defects detected: analyze debugging results carefully for the many-to-many relationship between test results and defects.

## Improvement Actions Based on Analysis

| Finding | Action |
|---------|--------|
| Defect cluster in area X | Apply more rigorous technique in area X |
| Low DDP for test level | Review technique selection; add more test cases |
| Low structural coverage in area Y | Design tests targeting area Y (if high risk) |
| Test gap for new feature | Design tests for untested new code |
| Flat arrival pattern | Investigate if tests are too weak or defects are exhausted |

## References
- ISTQB CTAL-TA v4.0, Section 5.3.1
- ISTQB CTFL v4.0.1, Section 1.3 (defect clustering)
- Elsayed, 2021 (Rayleigh model / defect arrival patterns)
