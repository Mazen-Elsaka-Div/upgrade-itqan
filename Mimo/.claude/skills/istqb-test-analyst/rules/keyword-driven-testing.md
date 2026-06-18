---
title: Keyword-Driven Testing
impact: MEDIUM
impactDescription: >
  Poorly specified keywords lead to redundant keywords, maintenance overhead, and test scripts
  that couple business intent to technical implementation. Well-designed keywords enable
  maintainable, reusable, and tool-agnostic test automation.
tags:
  - keyword-driven-testing
  - test-automation
  - test-scripts
  - keywords
  - ch1
---

# Keyword-Driven Testing

## Purpose

Keyword-driven testing allows the TA to write test scripts using business-level keywords that abstract technical implementation details. The TA specifies keywords; the TTA, TAE, or developer implements them.

## Keyword Categories

### Action Keywords
- Interact with the test object, test environment, or other systems
- Examples:
  - Test object interactions: executing functions, submitting data, navigating
  - Environment interactions: setting up configurations, activating simulators
  - System interactions: triggering interfaces

### Verification Keywords
- Represent assertions to evaluate actual vs. expected results
- Examples:
  - "Verify Access Granted"
  - "Verify Error Message Displayed"
  - "Verify Order Total"

## Abstraction Layers

Keywords reside on at least two abstraction layers:

| Layer | Description | Example |
|-------|-------------|---------|
| **Domain layer** | Business-related actions reflecting application domain terminology | "Authenticate Member", "Place Order", "Apply Discount" |
| **Test interface layer** | Communicates with test objects via technical interfaces; lowest abstraction layer | "Click Button[ID=login]", "Enter Text[field=username]" |

Additional intermediate layers may support maintainability of keywords. Composite keywords often reside on higher abstraction levels; atomic keywords tend to reside on the test interface layer.

## Keyword Structure

**Atomic keywords**: Cannot be decomposed further; usually at the interface layer.

**Composite keywords**: Made up of other keywords; usually at higher abstraction levels.

Note: A keyword's structure and abstraction layer are **independent attributes** — a composite keyword can reside at any layer.

## Rules for Good Keywords

Keywords MUST:
- Contain a **verb** (+ noun): "Authenticate", "Verify Access", "Submit Form"
- Use the **imperative form** of the verb: "Create User" not "Creating User"
- Be **unique in their meaning**: No two keywords with the same intent
- Be **adequately documented**: Parameters, purpose, preconditions
- **Reflect the vocabulary** of the application domain
- Be **reusable** across multiple test cases

## TA Tasks in Keyword-Driven Testing

1. **Specify keywords and their parameters** (from test basis analysis)
2. **Specify keyword test cases** (test scripts using keywords)
3. **Specify additional steps**: preconditions, verification actions, cleanup
4. **Maintain keyword test cases** to reflect changes to the test object
5. **Execute keyword test scripts** (manually or automated)
6. **Analyze failed keyword test cases** to determine the cause

## Keyword Identification Process

1. Analyze the test basis for interactions between test object and environment
2. Identify users, systems, and devices interacting with the test object
3. Define an action keyword per identified interaction
4. Define a verification keyword per expected result
5. Check that each keyword resides on the appropriate abstraction layer

**Example from user story**: "As a member, I want to authenticate myself, such that I get access to the facilities"
- Acceptance criteria: "Valid member cards can be used for authentication"
- Action keyword: `Authenticate Member` (parameter: `member card`)
- Verification keyword: `Verify Access`

## Keyword Test Case Formats

Keyword test cases may be written as:
- **Lists**: Sequential steps with keyword and parameter per line
- **Tables**: Keyword in one column, parameters in other columns
- **Gherkin-style**: Given/When/Then with keywords mapped to steps

## Avoiding Keyword Redundancy

Keywords are prone to being redundantly specified. To avoid redundancy:
- Check for existing keywords before creating new ones
- Use unique, precise names
- Document keywords in a shared repository
- Review keyword list with the team regularly

## Benefits of Keyword-Driven Testing

- Separates test design (TA) from test implementation (TTA/TAE)
- Makes test scripts readable by business stakeholders
- Enables manual testing benefit (later transition to automation)
- Reduces duplication through reusable keywords
- Supports maintainability: change keyword implementation without changing test scripts

## References
- ISTQB CTAL-TA v4.0, Section 1.3.6
- ISTQB-TTA v4.0 (Technical Test Analyst)
- ISTQB-TAE v2.0 (Test Automation Engineer)
- ISO/IEC/IEEE 29119-5:2016 (keyword-driven testing standard)
- Rwemalika et al., 2019 (keyword redundancy)
