---
title: Scenario-Based Testing
impact: HIGH
impactDescription: >
  End-to-end scenarios capture realistic user journeys and reveal defects in workflows
  that unit and component tests miss. Missing coverage of main/extension/exception scenarios
  leaves significant user-visible defects undetected in system and acceptance testing.
tags:
  - scenario-based-testing
  - use-cases
  - activity-diagrams
  - user-journeys
  - behavior-based
  - ch3
---

# Scenario-Based Testing

## Definition

Scenario-based testing evaluates the test item's behavior in **realistic scenarios** — sequences of actions constituting workflows through the test item. It is primarily used for end-to-end functional testing from the user's perspective.

## Scenario Models

### Activity Diagrams
- Graphical representation of workflow within a system
- Useful for modeling business processes and control flow
- Extends flowchart notation with concurrency support

**Key elements**:
| Element | Description |
|---------|-------------|
| Start/end nodes | Begin and end of workflow |
| Actions | Individual steps in the workflow |
| Transitions | Connections between actions |
| Decision nodes | Conditional branching (guard conditions) |
| Merge nodes | Converging branches |
| Fork nodes | Parallel execution start |
| Join nodes | Parallel execution end (synchronization) |
| Swim lanes | Represent different actors/systems |

### Use Cases
- Textual or graphical description of interactions between user and system (or systems)
- Organized around achieving a specific user goal

**Three scenario types**:

| Type | Description |
|------|-------------|
| **Main scenario** ("happy path") | Typical, expected sequence achieving the goal; one per use case |
| **Extension (alternative scenario)** | Different path that eventually achieves the same goal |
| **Exception** | Sequence that cannot achieve the goal (error, abnormal input) |

## Scenario Coverage

**Coverage measurement**: Number of executed scenarios / Total identified scenarios

### When No Loops Exist
- Each scenario tested with a separate test case
- Full scenario coverage possible with one test per scenario

### When Loops Exist
- Number of paths can be infinite
- Apply **simple loop coverage**:

| Loop Coverage Item | Description |
|-------------------|-------------|
| Zero iterations | Loop is skipped entirely |
| One iteration | Loop executes exactly once |
| Typical iterations | Loop executes a representative number of times |
| Maximum iterations | Loop executes the maximum allowed number of times (if applicable) |

### Additional Coverage per Scenario
- A scenario may need multiple test cases when:
  - EP or BVA coverage needed for variables occurring in the scenario
  - Multiple data combinations must be tested for the same workflow

## Applying Scenario-Based Testing

### Step 1: Identify Scenarios
- Analyze requirements, user stories, use cases, activity diagrams
- Use user research, personas, user journey maps
- Identify main scenarios first, then extensions and exceptions
- Prioritize scenarios by risk level

### Step 2: Apply Coverage Criteria
- Select which scenarios to cover (all, risk-based, or priority-based)
- For scenarios with loops: apply simple loop coverage

### Step 3: Design Test Cases
- One test case per scenario (when no loops)
- Multiple test cases per scenario for loop variants or data combinations

### Step 4: Combine with Other Techniques
- Apply EP/BVA to variables within scenarios
- Apply domain testing for numerical conditions in scenarios
- Apply decision coverage (white-box) to cover all decisions in the business process

## Test Level Applicability

**Primary**: System testing and acceptance testing (end-to-end user perspective)

**Also applicable**:
- Component integration testing (interaction protocols)
- Component testing (stateful object-oriented classes)
- Non-functional testing (operational profiles for reliability, flexibility)

## Scenario vs. Other Technique Combinations

| Combination | When to Use |
|------------|------------|
| Scenario + BVA | Variables with boundary conditions in the scenario |
| Scenario + Domain testing | Numeric conditions within scenario steps |
| Scenario + Decision coverage | Rigorous coverage of business process decisions |
| Scenario + Round-trip | Cyclical business process activities |

## Source Techniques for Scenario Identification

- User stories and acceptance criteria
- Personas and user groups
- User journey maps
- Operational profiles
- Business process models (BPMN)

## Defect Types Detected

- Missing features (functional completeness)
- Incorrect behavior in end-to-end workflows
- Communication defects between components
- Exception handling failures
- Missing synchronization in concurrent workflows

## References
- ISTQB CTAL-TA v4.0, Section 3.2.3
- ISO/IEC/IEEE 29119-4:2021 (test techniques)
- OMG BPMN, 2013 (business process notation)
- OMG UML, 2017 (UML state machines)
- Koomen et al., 2006 (coverage criteria for scenarios)
