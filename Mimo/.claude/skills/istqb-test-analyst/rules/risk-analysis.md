---
title: Risk Analysis – Test Analyst Contribution
impact: CRITICAL
impactDescription: >
  Without proper risk analysis, testing effort is misallocated, high-risk areas go undertested,
  and low-risk areas are over-tested. The TA's unique system knowledge makes them a critical
  contributor to product risk analysis, ensuring risk-based testing is implemented correctly.
tags:
  - risk-analysis
  - risk-identification
  - risk-assessment
  - product-risk
  - iso-25010
  - ch2
---

# Risk Analysis – Test Analyst Contribution

## Overview

Risk-based testing prioritizes test effort based on risk levels. Risk analysis consists of:
1. **Risk identification**: What could go wrong?
2. **Risk assessment**: How likely is it? What is the impact?

The TA contributes unique knowledge of the system, experience of what typically goes wrong, and understanding of how testing can mitigate risks.

## Risk Identification

The TA contributes to risk identification through:

| Activity | TA Contribution |
|----------|----------------|
| Retrospectives | Share past defect and failure experiences |
| Risk workshops | Provide system knowledge and failure mode insights |
| Brainstorming sessions | Generate risk scenarios based on domain expertise |
| Checklists | Create and use risk checklists based on past projects |
| Stakeholder interviews | Interview stakeholders to understand their risk perspectives |

The TA's intuitive knowledge of what usually goes wrong makes them a valuable stakeholder for product risk analysis.

## Risk Assessment

During risk assessment, the TA (with other stakeholders) estimates the **risk level**:

```
Risk Level = Likelihood × Impact
```

### Likelihood Factors

- Frequency of use of the affected feature
- Complexity of the affected functionality
- History of defects in similar areas
- Quality of the test basis
- Developer experience with the technology

### Impact Factors

- **Criticality of affected features**: How important is the feature to users?
- **Business objectives**: Does the feature support critical business processes?
- **Financial damage**: Monetary losses if the feature fails
- **Environmental damage**: Safety/environmental consequences
- **Reputational damage**: Brand impact of failures
- **Legal or safety needs**: Regulatory requirements, safety standards

## Risk Categorization by Quality Characteristic

The TA categorizes product risks using the ISO/IEC 25010 product quality model:

| Quality Characteristic | Example Risk |
|----------------------|-------------|
| Functional suitability | Missing feature, incorrect calculation |
| Interaction capability (usability) | Unintuitive interface, accessibility issue |
| Flexibility (adaptability) | Fails on supported browser version |
| Compatibility (interoperability) | Data exchange failure with partner system |
| Reliability | System crash under normal load |
| Security | Unauthorized data access |
| Performance efficiency | Response time exceeds requirement |
| Maintainability | Regression introduced by routine change |

## Non-Uniform Risk Distribution

Risk levels are not uniformly distributed across the test object. The TA should:
1. Break down the test object into test items (components, interfaces, features)
2. Assess a given risk for each test item separately
3. Identify which items have higher risk concentrations

## Proposing Mitigation Test Activities

For each identified product risk, the TA proposes suitable test activities:

| Risk Level | Suggested Approach |
|-----------|-------------------|
| HIGH | Formal test techniques, rigorous coverage, independent testing |
| MEDIUM | Selected test techniques, standard coverage levels |
| LOW | Experience-based techniques, lightweight testing |

Factors influencing proposed activities:
- Risk level
- Associated test item type
- Quality characteristic affected
- Available test levels and types

**Shift left principle**: Indicate which test activities can mitigate the risk **earliest** to minimize total testing effort.

## Risk Monitoring

Risk levels are not static — they change over time:
- In iterative lifecycle: risk monitoring performed once per iteration
- In other lifecycles: set by person responsible for product risk management (often test manager)
- TA updates the risk register based on changes
- TA adjusts risk mitigation actions as risks change

## Outputs of Risk Analysis

| Output | Description |
|--------|-------------|
| Risk register | Identified risks with likelihood, impact, and risk level |
| Risk categorization | Risks mapped to ISO 25010 quality characteristics |
| Mitigation proposals | Recommended test activities per risk |
| Test item breakdown | Test object decomposed for individual risk assessment |

## References
- ISTQB CTAL-TA v4.0, Section 2.1
- ISTQB CTFL v4.0.1, Section 5.2 (risk-based testing)
- ISTQB-TM v3.0 (risk-based testing in depth)
- ISO/IEC 25010:2023 (product quality model)
