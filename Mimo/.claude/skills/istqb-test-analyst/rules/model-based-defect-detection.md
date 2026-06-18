---
title: Using Models to Detect Defects
impact: HIGH
impactDescription: >
  Informal specifications contain defects invisible to direct review. Creating a formal
  model of the specification forces precision that reveals incompleteness, ambiguities,
  and inconsistencies before development begins, at minimum correction cost.
tags:
  - model-based-detection
  - defect-prevention
  - specification-defects
  - decision-tables
  - state-diagrams
  - ch5
---

# Using Models to Detect Defects

## Overview

Modeling supports phase containment in three ways:
1. **Detecting defects in specifications** (new models reveal spec defects)
2. **Detecting defects in models** (analyzing existing models)
3. **Detecting defects in test objects** (model-based testing execution)

## 1. Detecting Defects in Specifications

### How It Works

When a TA creates a model from an informal specification:
1. Test conditions (requirements) are mapped to model elements
2. Formalization forces precision — ambiguities must be resolved
3. Visualization reveals structural defects invisible in prose
4. The TA finds defects that text-based reviews might miss

**Key insight**: The model transformation finds defects that reviews of the original text might not catch because:
- Prose hides inconsistencies through natural language
- Models require explicit representation of every case
- Graphical models expose missing branches, dead ends, and contradictions visually

### Data-Based Models

| Model | Defects Detected |
|-------|-----------------|
| Domain models | Overlapping partitions, gaps in domain coverage, empty partitions |
| Combinatorial testing models | Missing or incorrect parameter combinations, impossible constraints |

**Example**: Creating a domain model for a loan eligibility calculation reveals that two conditions produce overlapping partitions — some applicants fall into two categories simultaneously.

### Behavior-Based Models

| Model | Defects Detected |
|-------|-----------------|
| CRUD matrices | Incomplete entity lifecycles, missing operations, entities that cannot be deleted |
| State-based models (state diagrams) | Missing transitions, deadlocks, endless loops, ambiguous behavior, missing exception handling |
| Scenario models (activity diagrams) | Missing actions, incorrect order, missing exception paths, dead-end flows, missing synchronization |

**Example**: Creating a CRUD matrix reveals that "Order" entities have no Delete operation — is this intentional (business rule) or an oversight?

### Rule-Based Models

| Model | Defects Detected |
|-------|-----------------|
| Decision tables | Omissions in rules, inconsistencies, ambiguities, redundancies, error-prone scenarios, complex logic |
| Metamorphic relations | Violations of expected mathematical or logical properties |

**Example**: Creating a decision table for insurance premium calculation reveals that one combination of conditions has no corresponding action defined — a missing rule.

### General Defects Found Through Modeling

Across all model types:
- Inconsistencies in naming (same concept called different names)
- Data value inconsistencies (boundary values differ between sections)
- Missing, incomplete, ambiguous, or unnecessary information
- Conflicting specifications between sections/documents

## 2. Detecting Defects in Existing Models

If the test basis already contains models, the TA analyzes them for defects.

### State Transition Diagrams

| Defect Type | Description |
|-------------|-------------|
| Missing states | State required by the specification is absent from the diagram |
| Wrong states | State exists but has incorrect name or meaning |
| Improper transitions | Transition goes to wrong target state |
| Incorrect guard conditions | Wrong condition triggers transition |
| Incorrect actions | Wrong action performed during transition |
| Redundant states | State that can never be reached |
| Unreachable states | State with no incoming transitions |
| Nondeterministic behavior | Multiple valid transitions for same event in same state |

### Activity Diagrams

| Defect Type | Description |
|-------------|-------------|
| Missing actions | Required step is absent |
| Unreachable actions | Action that can never be executed |
| Dead-end actions | Action with no outgoing transition |
| Incorrect action order | Steps in wrong sequence |
| Wrong guard conditions | Incorrect branch conditions in decision nodes |
| Non-exclusive guards | Multiple guards can be true simultaneously |
| Incomplete guards | Not all cases covered at a decision node |
| Missing synchronization | Parallel flows not properly synchronized |
| Improper synchronization | Parallel flows synchronized at wrong point |

### Decision Tables

| Defect Type | Description |
|-------------|-------------|
| Overlapping rules | Same condition combination covered by multiple rules |
| Inconsistent rules | Same conditions → different actions in different rules |
| Infeasible rules | Rules that can never apply |
| Incompleteness | Missing combinations of conditions |
| Missing actions | No action defined for a given rule |

## 3. Model-Based Testing (MBT)

In MBT, an MBT tool:
- Accepts the model and test selection criteria from the TA
- Automatically designs and generates test cases
- Covers the model systematically

**Benefits for defect detection**:
- Comprehensive coverage through systematic model exploration
- Finds anomalies in the specification that manual test design might miss
- Graphical models foster stakeholder communication and shared understanding
- More details: ISTQB-MBT v1.1

## Modeling as Communication Tool

Models serve dual purposes:
- **Analytical**: Find specification defects
- **Communicative**: Create shared understanding among stakeholders
  - Business stakeholders can review and validate the model
  - Developers understand expected behavior from the model
  - Testers derive test cases from the model

## References
- ISTQB CTAL-TA v4.0, Section 5.2.1
- ISTQB-MBT v1.1 (model-based testing)
- Chapters 3.2.2, 3.2.3, 3.3.1 (for model structure references)
