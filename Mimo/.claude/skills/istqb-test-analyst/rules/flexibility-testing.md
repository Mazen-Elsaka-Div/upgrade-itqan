---
title: Flexibility Testing (Adaptability and Installability)
impact: MEDIUM
impactDescription: >
  Flexibility defects discovered after deployment require expensive updates and redesigns.
  The TA's systematic use of combinatorial testing for environment configurations and
  thorough installability testing prevents environment-specific failures post-release.
tags:
  - flexibility-testing
  - adaptability
  - installability
  - combinatorial-testing
  - portability
  - ch4
---

# Flexibility Testing (Adaptability and Installability)

## Definition

**Flexibility testing** (also known as portability testing) verifies that the test object can be adapted to changes in its contexts of use or system environment.

ISO 25010 flexibility sub-characteristics:
- **Adaptability**: Can the software adapt to different environments?
- **Scalability**: Can the software scale with increased demands? (TTA scope)
- **Installability**: Can the software be correctly installed/uninstalled/updated?
- **Replaceability**: Can the software replace other software? (TTA scope)

This rule focuses on **adaptability** and **installability** (TA scope).

## Adaptability Testing

### Definition
Adaptability testing verifies that the test object can be **adapted for or transferred to** intended target hardware, software, or other operational or usage environments.

### What the TA Does

**Step 1: Identify target environments**
- Versions of mobile operating systems supported
- Browser versions supported
- Screen sizes and resolutions
- Hardware configurations (RAM, storage, processor)
- Network conditions (3G, 4G, 5G, Wi-Fi)

**Step 2: Design environment combination tests**
- Use **combinatorial testing** (see combinatorial-testing rule)
- Each environment parameter is a variable with multiple values
- Pairwise coverage for moderate risk; full N-wise for high risk
- Classification trees help organize environment parameters

**Step 3: Execute tests**
- **Smoke tests**: Quick verification on new environments
- **Comprehensive tests**: Full test suite for highest-risk configurations
- **Automated cross-platform testing**: Supported by TAEs; TA defines test conditions

### Adaptability Defect Examples
- Application displays incorrectly on smaller screens
- Feature not available on older OS version
- Behavior differs between browser engines
- Performance degradation on older hardware

### Good Practices for Adaptability Testing
- Define target environments **early** in the project
- Use combinatorial testing for environment configurations
- Execute smoke tests before full testing on each new environment
- Monitor environment-specific defects across releases

### Benefits
- Detects environment-specific issues early
- Prevents frequent major updates/redesigns after deployment
- Lowers maintenance costs
- Extends software lifespan

## Installability Testing

### Definition
Installability testing verifies that the test object can be **installed, uninstalled, updated, and reconfigured** correctly in specified environments.

Goes beyond checking if installation runs to completion.

### TA Test Objectives for Installability

| Objective | Description |
|-----------|-------------|
| Installation procedure verification | Verify correct execution under various environment configurations |
| Post-installation verification | Verify the test object works properly after installation or update |
| User experience of installation | Check ease of installation, uninstallation, update |
| Documentation review | Review installation documentation for completeness and accuracy |
| Permissions testing | Especially for mobile applications (ISTQB-MAT, v1.0) |

### Techniques for Installability

- **Combinatorial testing**: For various environment parameter configurations during installation
  - Same approach as adaptability testing
  - Covers combinations of: OS version, available disk space, user permissions, pre-existing software
- **Scenario-based testing**: Model the installation/uninstallation/update workflow

### Installability Test Cases

For each supported configuration:
1. **Fresh installation**: Install on clean environment → verify functionality
2. **Installation over existing version**: Upgrade → verify functionality and data migration
3. **Uninstallation**: Remove software → verify complete removal, no residual files
4. **Reconfiguration**: Change settings → verify correct application of changes
5. **Installation with missing permissions**: Verify appropriate error message
6. **Installation with insufficient disk space**: Verify graceful failure

## Flexibility vs. Functional Testing

| Aspect | Functional Testing | Flexibility Testing |
|--------|-------------------|-------------------|
| Question | Does it work? | Does it work in different environments? |
| Focus | Features and correctness | Portability and environment compatibility |
| Technique | Standard black-box | Combinatorial for environments |
| Environment | One controlled env | Multiple target environments |

## References
- ISTQB CTAL-TA v4.0, Section 4.3
- ISO/IEC 25010:2023 (flexibility sub-characteristics)
- ISTQB-PT v1.0 (performance/scalability testing)
- ISTQB-TTA v4.0 (replaceability)
- ISTQB-MAT v1.0 (mobile application testing)
