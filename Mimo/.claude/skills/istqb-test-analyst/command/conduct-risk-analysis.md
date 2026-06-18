---
title: Conduct Risk Analysis
description: >
  Step-by-step workflow for identifying product risks, assessing likelihood and impact,
  categorizing by quality characteristic, prioritizing risks, and documenting a risk register
  with proposed test activities for each identified risk.
usage: >
  Use at the beginning of a project, release, or sprint. Also use when requirements
  change significantly to update the risk register. The TA participates in workshops
  and contributes unique system knowledge to the analysis.
tags:
  - risk-analysis
  - risk-identification
  - risk-assessment
  - risk-register
  - product-risk
---

# Command: Conduct Risk Analysis

## When to Use

Execute this command when:
- Starting a new project or release
- Significant requirements changes affect the test scope
- Beginning sprint planning with new user stories
- Preparing for a risk analysis workshop

## Step 1: Risk Identification – Brainstorm and Gather

Use multiple sources and approaches to maximize risk identification:

### Brainstorming
- Gather TA, developers, business analysts, product owners
- Generate risks freely without filtering
- Consider: what could fail? what has failed before? what is new or complex?

### Interviews with Stakeholders
- Ask each stakeholder: "What are the most significant risks from your perspective?"
- Business stakeholders: financial, regulatory, reputational risks
- Technical stakeholders: integration, performance, data quality risks
- End users: usability, data loss, accessibility risks

### Checklists
- Use risk checklists from previous projects
- Generic quality characteristic checklists (ISO 25010)
- Domain-specific risk checklists (financial, healthcare, etc.)

### Retrospectives
- What defects escaped to production in previous releases?
- What areas had the most test failures?
- What changed recently that could introduce regression?

### Test Basis Analysis
- Are requirements complete? Incomplete requirements → risk of missing features
- Are interfaces well-specified? Underdefined interfaces → integration risk
- Are business rules documented? Missing rules → business logic risk

## Steps 2-4: Assess Likelihood, Impact, and Risk Level

**Likelihood factors**: complexity, new technology, poor test basis quality, team turnover, schedule pressure, defect history. Scale: HIGH / MEDIUM / LOW.

**Impact factors**: frequency of use, business criticality, financial/reputational/legal/safety consequences. Scale: HIGH / MEDIUM / LOW.

**Risk Level** = Likelihood × Impact (HIGH×HIGH=CRITICAL; HIGH×MEDIUM=HIGH; MEDIUM×MEDIUM=MEDIUM; LOW×any=LOW). Use agreed team risk matrix.

## Step 5: Categorize by Quality Characteristic

Map each risk to the ISO 25010 quality characteristic it affects:

| Quality Characteristic | Risk Examples |
|----------------------|--------------|
| Functional suitability | Missing feature, incorrect calculation, inappropriate behavior |
| Interaction capability (usability) | Confusing UI, inaccessible feature |
| Flexibility (adaptability/installability) | Fails on supported OS, installation errors |
| Compatibility (interoperability) | Data exchange failure with partner system |
| Reliability | System crashes, data corruption |
| Security | Unauthorized access, data breach |
| Performance efficiency | Response time violations |
| Maintainability | Regressions caused by routine changes |

## Step 6: Decompose Test Object by Risk

Not all risks are uniformly distributed:
1. Break down the test object into test items (components, features, interfaces)
2. Assess each identified risk for each relevant test item separately
3. A risk may have HIGH level for one component but LOW for another

## Step 7: Propose Test Activities per Risk

For each risk (especially HIGH and CRITICAL):
- Which test level addresses it earliest (shift-left)?
- Which test technique detects the associated defect type?
- What coverage level is required?
- Static testing (reviews, modeling) vs. dynamic testing?

**Use** `select-test-technique.md` to determine the technique.

## Step 8: Document the Risk Register

For each risk, record:

| Field | Content |
|-------|---------|
| Risk ID | Unique identifier (RISK-001) |
| Description | Clear statement of the risk |
| Quality characteristic | ISO 25010 category |
| Likelihood | HIGH / MEDIUM / LOW |
| Impact | HIGH / MEDIUM / LOW |
| Risk level | CRITICAL / HIGH / MEDIUM / LOW |
| Test item(s) | Affected components/features |
| Proposed test activities | Test level, type, technique, coverage |
| Status | Open / Mitigated / Accepted |

## Steps 9-10: Communicate, Review, and Monitor

Present register to stakeholders; adjust based on feedback; get approval. Define monitoring frequency (per iteration in Agile), TA ownership, and escalation path for newly discovered HIGH risks.

## Related Rules
- [risk-analysis](../rules/risk-analysis.md)
- [risk-control](../rules/risk-control.md)
- [technique-selection](../rules/technique-selection.md)