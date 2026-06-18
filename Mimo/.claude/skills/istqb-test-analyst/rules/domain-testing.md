---
title: Domain Testing
impact: CRITICAL
impactDescription: >
  Missing ON/OFF/IN/OUT boundary points leads to undetected domain defects such as wrong
  operators or incorrect constants in boundary conditions. Domain testing is the most effective
  technique for numerical calculations and multi-variable boundary conditions.
tags:
  - domain-testing
  - boundary-values
  - equivalence-partitions
  - on-off-in-out
  - data-based
  - ch3
---

# Domain Testing

## Definition

Domain testing verifies whether the test item behaves as specified on the domain's equivalence partitions and at their borders. It generalizes Equivalence Partitioning (EP) and Boundary Value Analysis (BVA) to complex domains with multiple interacting variables.

## Core Concepts

### Equivalence Partitions with Multiple Variables

In domain testing, equivalence partitions are defined using expressions that:
- Combine atomic conditions by Boolean operators (AND, OR, NOT)
- Involve one or more interacting variables

**Example**: `height > 1.29m AND weight/height² ≥ 30`
- Two-dimensional domain
- Two borders: one open (`>`), one closed (`≥`)

### Border Types

| Border Type | Operator | Description |
|-------------|---------|-------------|
| Closed | ≤, ≥, = | The partition includes the border value |
| Open | <, >, ≠ | The partition excludes the border value |

## Coverage Points

For each border, four types of coverage points are defined:

| Point | Definition |
|-------|-----------|
| **ON** | Closed border: lies on the border. Open border: lies inside the partition, closest to the border |
| **OFF** | Closed border: lies outside the partition, closest to the border. Open border: lies on the border |
| **IN** | Belongs to the partition and is not an ON point |
| **OUT** | Lies outside the partition and is not an OFF point |

**Key note**: The same point can have different types for different borders.

## Coverage Criteria

### Simplified Domain Coverage (Jeng et al., 1994)

For each border:
| Operator | Required Points |
|----------|----------------|
| <, ≤, >, ≥ | One ON + one OFF |
| = | One ON + two OFF (on different sides) |
| ≠ | One OFF + two ON (on different sides) |

Each OFF point must be as close as possible to the corresponding ON point.

### Reliable Domain Coverage (Forgács et al., 2024)

For each border:
| Operator | Required Points |
|----------|----------------|
| <, ≤, >, ≥ | One ON + one OFF + one IN + one OUT |
| = | One ON + two OFF (on different sides) |
| ≠ | One OFF + two ON (on different sides) |

**Comparison**:
- Reliable coverage requires slightly more coverage items
- Reliable coverage detects considerably more domain defects
- Number of coverage items grows linearly with number of borders

## Optimization

For domains with many borders:
- Share a common IN point across all borders of a partition
- Use ON+OFF pair of one border as OFF+ON for the adjacent border
- Advanced optimization algorithms available (Forgács et al., 2024)

## Applying Domain Testing

### Step 1: Identify the Domain
- List all input variables affecting the behavior being tested
- Express the domain using relational expressions

### Step 2: Identify Borders
- Find all relational operators: <, ≤, >, ≥, =, ≠
- Classify each as open or closed

### Step 3: Select Coverage Criterion
- Simplified: for moderate risk levels
- Reliable: for high-risk areas (more coverage items, higher defect detection)

### Step 4: Determine Coverage Points
- Calculate ON, OFF, IN, OUT for each border per the chosen criterion

### Step 5: Create Test Cases
- Each unique point combination becomes a test case
- One test case can satisfy multiple coverage items (optimization)

## Example: Discount Calculation

Domain: order total > $50 AND order total ≤ $100 (10% discount zone)

| Border | Type | ON | OFF | IN | OUT |
|--------|------|----|-----|----|----|
| total > 50 (open) | Open | 51 | 50 | 75 | 25 |
| total ≤ 100 (closed) | Closed | 100 | 101 | 75 | 110 |

## When to Apply Domain Testing

- Numerical calculations with boundary conditions
- Multi-variable domains (more expressive than simple BVA)
- Input validation logic
- Insurance/financial calculation rules
- Engineering calculations

## Relationship to EP and BVA

- EP: single variable, simple partitions → domain testing generalizes this
- BVA: boundary points for single variable → domain testing extends to multi-variable
- Domain testing is applicable at any test level

## References
- ISTQB CTAL-TA v4.0, Section 3.1.1
- Jeng et al., 1994 (simplified domain coverage)
- Forgács et al., 2024 (reliable domain coverage)
- Beizer, 1990; Binder, 2000; Jorgensen, 2014 (domain testing textbooks)
