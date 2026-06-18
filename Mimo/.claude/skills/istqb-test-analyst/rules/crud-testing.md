---
title: CRUD Testing
impact: HIGH
impactDescription: >
  Without CRUD testing, data integrity violations, access control defects, and data lifecycle
  inconsistencies go undetected. CRUD testing systematically covers all data entity operations
  and their interactions, ensuring data is created, read, updated, and deleted correctly.
tags:
  - crud-testing
  - data-entities
  - lifecycle
  - data-integrity
  - behavior-based
  - ch3
---

# CRUD Testing

## Definition

CRUD testing verifies the **lifecycle of data entities** processed by the test item. CRUD stands for:
- **C**reate
- **R**ead
- **U**pdate
- **D**elete

These are the four basic operations that functions can perform on entities.

## The CRUD Matrix

The CRUD matrix provides an overview of the lifecycle of data entities:
- **Columns**: Represent data entities (e.g., User, Order, Product, Payment)
- **Rows**: Represent functions/operations
- **Cells**: Show which CRUD operations each function performs on each entity

### Building the CRUD Matrix

1. Identify all data entities in scope
2. Identify all functions/operations
3. For each function, determine which operations (C, R, U, D) it performs on which entities
4. Fill the matrix with initials: C, R, U, D (or combinations: CR, CRUD)

**Important**: Pay special attention to **Read (R)** — it is often implicitly linked to C, U, and D operations.

### Example CRUD Matrix

| Function | User | Order | Product | Payment |
|----------|------|-------|---------|---------|
| Register User | C | - | - | - |
| Create Order | R | C | R | - |
| Update Order | R | U | R | - |
| Process Payment | R | U | - | C |
| Cancel Order | R | U | - | R |
| Delete Account | D | R | - | R |

## Two Parts of CRUD Testing

### 1. Completeness Testing (Static)

**Purpose**: Verify that all four operations (C, R, U, D) occur for every entity.

**Process**:
- Examine the CRUD matrix for each entity column
- Each column should have at least one C, one R, one U, and one D
- **Absence of an operation is an anomaly** that requires investigation
  - Missing D: Can the entity ever be deleted? Is this intentional?
  - Missing U: Is the entity immutable? Is this a design oversight?
  - Missing R: Can the entity be created and never viewed?

This is **static testing** — performed by reviewing the matrix, no test execution required.

### 2. Consistency Testing (Dynamic)

**Purpose**: Verify that functions interact correctly when handling an entity.

**Process**:
1. Design test cases that cover all operations in the CRUD matrix
2. Test cases are designed **per entity** by combining functions to cover the entity's entire lifecycle
3. Positive tests: normal lifecycle sequences
4. Negative tests: invalid operation sequences

**Required negative tests include**:
- Reading an entity that has not yet been created
- Updating an entity that has been deleted
- Creating an entity that already exists (duplicate)
- Deleting an entity that does not exist

## CRUD Coverage

**Basic coverage**: Number of operations executed / Total operations in CRUD matrix

**Rigorous coverage**: Considers specific combinations of operations as coverage items.

Example rigorous coverage items:
- After each U (update), all possible Rs (reads) should be covered
- After D (delete), verify R returns not-found
- After C (create), verify R returns the created entity

## Test Case Design for CRUD

For each entity, design test cases to cover the full lifecycle:
1. Create → Read (verify creation)
2. Create → Read → Update → Read (verify update)
3. Create → Read → Update → Delete → Read (verify deletion)
4. Negative: Read before Create (expect error)
5. Negative: Update after Delete (expect error)

## CRUD Defect Types

| Defect Type | Description |
|------------|-------------|
| Data integrity violation | Entity created with missing required fields |
| Access control defect | User can update/delete entities they do not own |
| Data inconsistency | Update succeeded but Read returns old data |
| Lifecycle violation | Entity can be read after deletion |
| Missing operation | No way to delete entities (orphaned data) |

## Test Level Applicability

CRUD testing is **primarily used at the system level**. It focuses on:
- Behavior of the test item in treating entities
- Data integrity across system boundaries
- Access control and authorization

## References
- ISTQB CTAL-TA v4.0, Section 3.2.1
- Koomen et al., 2006 (TMap Next — CRUD testing origin)
