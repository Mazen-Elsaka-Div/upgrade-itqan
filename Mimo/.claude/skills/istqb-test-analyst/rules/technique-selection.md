---
title: Selecting Test Techniques to Mitigate Product Risks
impact: CRITICAL
impactDescription: >
  Selecting the wrong test technique for a given risk type means the technique cannot detect
  the target defects. K4-level analysis is required: analyze the risk, match the technique to
  the defect type, consider constraints, and combine techniques for comprehensive coverage.
tags:
  - technique-selection
  - risk-based-testing
  - k4-analysis
  - test-objectives
  - ch3
---

# Selecting Test Techniques to Mitigate Product Risks

## Core Principle

Each test technique focuses on detecting **specific types of defects**. Effective technique selection requires:
1. Understanding the risk and the defect type it represents
2. Matching the defect type to techniques that detect it
3. Considering all contextual factors
4. Combining techniques for comprehensive coverage

## Technique-to-Defect Type Mapping

| Category | Techniques | Defects Detected |
|----------|-----------|-----------------|
| **Data-based** | Domain testing, Combinatorial, Random | Data handling, domain implementation, UI input, calculations, parameter combinations |
| **Behavior-based** | CRUD, State Transition, Scenario-based | Missing features, communication defects, processing defects, lifecycle issues |
| **Rule-based** | Decision Table, Metamorphic | Logic defects, control flow errors, business rule violations |
| **Experience-based** | Session-based, Checklist, Crowd | Hard-to-specify defects, usability, exploratory findings |

## Selection Factors

### 1. Test Objectives
- What aspects of the test object must be evaluated?
- Guides choice: domain-based for numerical calculations vs. decision table for credit risk management

### 2. Product Risks
- What types of defects are most likely and impactful?
- Map each risk to the techniques that detect its associated defect type
- See the mapping table above

### 3. Risk Level → Coverage Criterion
| Risk Level | Coverage Approach |
|-----------|------------------|
| Very high | All combinations (combinatorial coverage instead of pairwise) |
| High | Rigorous: 1-switch, reliable domain coverage, full decision table |
| Medium | Standard: pairwise, simplified domain coverage, minimized decision table |
| Low | Experience-based (when defining coverage is difficult) |

### 4. Test Basis Characteristics
- If test basis uses models → use model-based techniques
- If no oracle available → use metamorphic testing or experience-based techniques
- If specification is scenario-based → use scenario-based testing

### 5. Knowledge of Recurring Defect Types
- If similar defects appeared in previous iterations → use techniques targeting those defects
- Consider checklist-based testing for known defect patterns
- If same defects as previous projects → consider same successful techniques

### 6. Tester's Knowledge and Experience
- Do not use unfamiliar techniques for critical test assignments
- Domain knowledge impacts suitability of exploratory techniques
- Little/no domain knowledge → exploratory testing may be ineffective

### 7. Software Development Lifecycle
| SDLC Type | Preferred Approach |
|-----------|------------------|
| Sequential | More formal techniques (rigorous and structured) |
| Iterative | Lightweight techniques, experience-based, automatable design |

### 8. Customer and Contract Requirements
- Contracts may require specific test levels or types
- Client-provided scenarios suggest scenario-based testing
- Compliance requirements may mandate specific techniques (e.g., ISO 26262)

### 9. Regulatory Requirements
- ISO 26262: requires EP, BVA, error guessing depending on ASIL
- Other standards may mandate specific techniques

### 10. Project Constraints
- Time and budget affect use of time-consuming techniques
- Resource availability impacts test environment needs

## Technique Combinations

Combining techniques increases efficiency and effectiveness:

| Combination | Rationale |
|------------|-----------|
| BVA + State Transition | BVA for guard condition values in transitions |
| Domain Testing + Scenario-Based | Domain testing for numerical conditions within scenario steps |
| Scenario-Based + Decision Coverage | Rigorous coverage of business process decisions |
| Scenario-Based + Round-Trip | Cover cyclical business process activities |
| Combinatorial + Smoke Tests | Configuration combinations with quick validation |
| Checklist + Session-Based | Structured exploration of known risk areas |

## Decision Framework

```
Step 1: Identify risk type
   → Data handling → Data-based techniques
   → Behavioral/workflow → Behavior-based techniques
   → Business rules/logic → Rule-based techniques
   → Unknown/exploratory → Experience-based techniques

Step 2: Assess risk level → select coverage criterion
   → High risk → rigorous coverage
   → Low risk → lightweight coverage or experience-based

Step 3: Check contextual factors
   → Test basis type, tester knowledge, SDLC, constraints

Step 4: Select primary technique

Step 5: Consider secondary technique for complementary coverage

Step 6: Define combination strategy
```

## Experience-Based Testing When to Use

Use experience-based testing (session-based, checklist, crowd) when:
- Defining coverage is difficult (no specification, exploratory areas)
- Risk level is low (formal technique overhead not justified)
- Project schedule is tight (faster than systematic technique application)
- As complement to systematic techniques (always adds value)

## References
- ISTQB CTAL-TA v4.0, Section 3.5.1
- ISO 26262:2018 (automotive functional safety — test technique requirements)
- Koomen et al., 2006 (process cycle testing: scenario + decision coverage)
