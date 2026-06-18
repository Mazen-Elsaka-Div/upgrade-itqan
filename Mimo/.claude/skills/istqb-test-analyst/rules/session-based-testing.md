---
title: Session-Based Testing and Test Charters
impact: HIGH
impactDescription: >
  Unstructured exploratory testing without charters leads to unfocused sessions, duplicate
  effort, and poor coverage tracking. Test charters provide mission and structure while
  preserving the flexibility that makes exploratory testing effective.
tags:
  - session-based-testing
  - test-charters
  - exploratory-testing
  - experience-based
  - ch3
---

# Session-Based Testing and Test Charters

## Definition

**Session-based testing (SBT)**: Exploratory testing organized into structured, time-boxed test sessions guided by test charters.

**Test charter**: Provides the mission of a test session, outlining its scope, objectives, limitations, timelines, and risks.

## Test Charter Purpose

A test charter:
- Provides **structure** to test sessions without over-constraining the tester
- Keeps the TA focused on specific areas while allowing flexibility to explore
- Does **not** specify the test suites to be executed (that would eliminate exploration)
- Serves as a roadmap, not a script

## Charter Mission Format

Popular lightweight mission format (Hendrickson, 2013):

> "Explore **[target]** With **[resources]** To discover **[information]**"

| Component | Description | Examples |
|-----------|-------------|---------|
| **[target]** | What is explored | Area, feature, risk, component, requirement |
| **[resources]** | What the TA uses | Test data, configurations, tools, restrictions, heuristics |
| **[information]** | What the TA aims to find | Quality characteristic evaluations, expected defect types, standards violations |

**Example**: "Explore checkout payment flow with expired credit card test data to discover error handling gaps and unexpected system states"

## Factors Influencing Charter Design

The TA considers:

| Factor Category | Examples |
|----------------|---------|
| Customer/requirements | Requirements from clients, business use cases, quality requirements, user journey maps |
| Product factors | Functional flows, principal goals, product features, software design, interfaces |
| Project management | Time constraints, project purpose, estimated effort, business value |

## Complete Charter Contents

A charter may include (Ghazi et al., 2017):

**Organizational information**:
- Duration of the test session
- Start date and time
- Tester's name

**Test objectives**:
- Motivation for the test
- Mission of the test charter

**Test scope**:
- Specific areas of interest within the SUT
- Test level and techniques to be used
- Test ideas and priorities
- Exit criteria
- What the charter covers and what it explicitly does NOT cover

**Entry criteria**:
- Preconditions that must be met to start

**Product-related information**:
- Definition, data, and workflow among components
- System architecture

**Limitations**:
- What the product must never do

**Test environment**:
- Description of environment needed

**Existing resources**:
- Data sources, product information, test tools that aid testing

**Historical information**:
- Previously found defects (compatibility, interoperability)
- Current open questions and anomalies
- Test-related failure patterns from the past

**Constraints and risks**:
- Regulations, rules, standards

## Charter Specificity vs. Flexibility

| Charter Style | Flexibility | Risk | Use When |
|--------------|-------------|------|----------|
| General objectives only | High flexibility | Higher false positives | Early exploration, unknown areas |
| Includes techniques to use | Moderate flexibility | Balanced | Standard exploratory sessions |
| Includes "what system cannot do" | Lower flexibility | Fewer false positives | Focused risk investigation |

## During the Session

The TA:
1. Follows the charter mission while remaining open to unexpected findings
2. Records a **session sheet** with:
   - Test logs: questions, observations, ideas for future testing
   - Test results (what was tested, what was found)
3. May identify new areas to explore beyond the original charter scope

## Session Sheet

The session sheet documents:
- Charter reference
- Session duration and tester
- Test notes: what was tested
- Bugs found: descriptions and severity
- Issues: questions and blocking items
- Ideas: future test suggestions

## Debriefing (PROOF Mnemonic)

After each session, debrief using **PROOF**:

| Letter | Category |
|--------|----------|
| **P** | Past — what was accomplished |
| **R** | Results — what was found |
| **O** | Obstacles — what blocked progress |
| **O** | Outlook — what should be done next |
| **F** | Feelings — tester's confidence and concerns |

## Integration with High-Level Test Cases

High-level test cases can guide test charter objectives:
- The charter outlines what to explore
- The TA elaborates on specific test actions during execution
- Findings are recorded in the session sheet

## References
- ISTQB CTAL-TA v4.0, Section 3.4.1
- ISTQB CTFL v4.0.1, Sections 4.4.2 and 4.5 (exploratory testing)
- Hendrickson, 2013 (charter mission format)
- Ghazi et al., 2017 (test charter contents)
