---
title: Defect Prevention Practices
impact: HIGH
impactDescription: >
  Focusing only on defect detection without prevention leads to repeated defect patterns,
  high rework costs, and poor product quality. DRE and PCE metrics quantify the effectiveness
  of prevention efforts and guide improvement priorities.
tags:
  - defect-prevention
  - dre
  - pce
  - shift-left
  - quality-assurance
  - ch5
---

# Defect Prevention Practices

## Definition

**Defect prevention**: Implementing actions that reduce the likelihood of (re)occurrence of defects and mitigate the propagation of defects to subsequent SDLC phases.

**Benefits**:
- Reduced costs and labor
- Increased productivity
- Improved product quality

Defect prevention is the responsibility of the whole team; the TA contributes their specific knowledge and experience.

## Three Levels of Defect Prevention

| Level | Goal | Activities |
|-------|------|-----------|
| **Prevent introduction** | Stop defects from being created | Quality assurance, requirements review, design review |
| **Prevent propagation** (phase containment) | Stop defects from escaping to later phases | Reviews, modeling, testing within the same phase |
| **Prevent recurrence** | Stop the same type of defect from appearing again | RCA, process improvement, updated checklists |

## TA Contributions to Defect Prevention

### 1. Participating in Risk Analysis
- Ensures identified risks are properly mitigated
- Selects the most adequate test techniques for each risk
- Influences test planning to allocate effort to high-risk areas

### 2. Reviewing Requirements, Models, and Specifications
- Early detection of defects in the test basis
- Prevents defects from escaping into code
- Significantly decreases the cost of fixing defects (exponentially more expensive after coding)
- See review-techniques rule and model-based-defect-detection rule

### 3. Participating in Retrospectives
- Identifies potential improvements in test analysis, design, implementation, and execution
- Examples of improvements:
  - Using more effective test techniques
  - Targeting testing of specific risk areas
  - Improving test data to reduce false positives/negatives
  - Improving test environments for reliability

### 4. Defect Data Collection and Evaluation
- Collecting detailed defect data for classification and statistical analysis
- Enables root cause analysis (see root-cause-analysis rule)
- Facilitates process improvement based on defect patterns

### 5. Participating in Root Cause Analysis
- Prevents defects from reoccurrence
- Proposes corrective actions to address identified root causes
- Works with team to implement and verify improvements

## Metrics for Measuring Prevention Effectiveness

### Defect Removal Efficiency (DRE)

**Formula**:
```
DRE = Defects removed before release / Total number of defects
```

**Interpretation**:
- High DRE → fewer defects escape to production
- May imply better defect prevention practices
- **Limitation**: Does not distinguish between defects caught through prevention vs. detection

**Practical note**: Total number of defects is unknown; can be estimated or replaced by defects found within a defined post-release period (e.g., 6 months).

### Phase Containment Effectiveness (PCE)

**Formula**:
```
PCE = Defects introduced and removed in the same phase / Total defects introduced in that phase
```

**Interpretation**:
- High PCE → fewer defects escape to later phases
- Directly measures the effectiveness of phase containment practices
- Should be tracked per phase (requirements, design, implementation, testing)

### Cost of Quality

- Illustrates the relation between:
  - Prevention costs
  - Detection costs
  - Removal/failure costs
- Demonstrates the economic benefit of early defect prevention
- See ISTQB-TM v3.0, Section 3.2.1 for details

## Cost of Late Detection

The cost of fixing a defect grows dramatically with the phase in which it is detected:

| Phase Found | Relative Cost |
|------------|--------------|
| Requirements | 1x |
| Design | 5-10x |
| Coding | 10-25x |
| System testing | 50-100x |
| Production | 100-1000x |

This is the economic justification for shift-left and defect prevention practices.

## Shift-Left Principle

"Find and fix defects as early as possible in the SDLC."

- TA involvement from initial phases enables shift-left
- Reviews in requirements phase are the earliest possible intervention
- Modeling for testing finds defects before coding begins

## References
- ISTQB CTAL-TA v4.0, Section 5.1
- ISTQB CTAL-TA v4.0, Sections 5.2, 5.3 (phase containment, recurrence prevention)
- ISTQB-TM v3.0, Section 3.2.1 (cost of quality)
