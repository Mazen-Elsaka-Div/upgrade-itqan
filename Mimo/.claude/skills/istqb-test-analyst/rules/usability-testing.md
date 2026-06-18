---
title: Usability Testing
impact: HIGH
impactDescription: >
  Usability defects discovered after release are costly to fix and damage user adoption and
  satisfaction. The TA's contribution to usability testing—leveraging user group knowledge,
  accessibility standards, and evaluation techniques—ensures usable and accessible software.
tags:
  - usability-testing
  - accessibility
  - wcag
  - interaction-capability
  - user-experience
  - ch4
---

# Usability Testing

## Definition

Usability refers to a broad concept of user-related quality characteristics, covering:
- **Interaction capability** (ISO/IEC 25010:2023): Enabling users to complete tasks effectively, efficiently, and satisfactorily
- **Beneficialness** (ISO/IEC 25019:2023 quality-in-use model)

## Three Core Usability Aspects

| Aspect | Description |
|--------|-------------|
| **Interaction capability** | Users can complete tasks in specific contexts effectively, efficiently, and satisfactorily |
| **User experience (UX)** | Users' perceptions before, during, and after interacting with the test object |
| **Accessibility** | Users with disabilities, diverse cultural backgrounds, or language barriers can use the system effectively and efficiently |

## TA's Contribution to Usability Testing

The TA brings valuable knowledge to usability testing:
- Knowledge of the target user groups and their goals
- Understanding of the context of use
- Identification of potential difficulties using the system
- Recognition of negative user experience patterns

The TA can contribute from **early phases** of the SDLC.

## Principal Usability Evaluation Techniques

### 1. Usability Reviews

**What**: Performed by usability experts to identify usability problems and deviations from established criteria.

**Range**: Informal reviews to formal inspections.

**TA contribution**:
- Adapt review criteria to specific user group needs
- Align criteria with business objectives and priorities
- Tailor context of use (e.g., generic usability checklist adapted for the product)
- Identify user group-specific concerns

### 2. Usability Test Sessions

**What**: Future users or their representatives attempt to solve predefined tasks. Evaluates if tasks can be completed effectively, efficiently, and satisfactorily.

**TA contribution**:
- Design scenarios for usability test sessions based on:
  - Personas (fictional representations of user types)
  - User groups
  - Operational profiles (representative usage patterns)
- Ensure scenarios are realistic and representative of actual use cases

### 3. User Questionnaires or Surveys

**What**: Rating and feedback instruments that measure user satisfaction.

**Examples**:
- **SUMI**: Software Usability Measurement Inventory (1991)
- **WAMMI**: Website Analysis and Measurement Inventory (1999)

**TA contribution**:
- Help design questionnaires targeting specific user goals
- Evaluate responses in context of users' actual goals
- Address context of use in questionnaire design

## Accessibility Testing

### Definition
Accessibility testing verifies that the system can be used by people with:
- Physical or cognitive disabilities
- Diverse cultural backgrounds
- Language barriers

### WCAG Standard
**Web Content Accessibility Guidelines (WCAG, 2023)** defines three conformance levels:

| Level | Description |
|-------|-------------|
| A | Minimum accessibility (essential requirements) |
| AA | Enhanced accessibility (standard conformance target) |
| AAA | Highest accessibility (comprehensive requirements) |

### National Standards
- **UK**: Equality Act (2010)
- **US**: Americans with Disabilities Act (ADA, 2010)

### TA Tasks in Accessibility
- Identify the required compliance level (based on context of use and legal requirements)
- Analyze the specific needs of the intended target group
- Design tests that verify compliance with identified WCAG level
- Test with assistive technologies (screen readers, keyboard navigation)

## TA Involvement Timeline

| SDLC Phase | TA Usability Contribution |
|-----------|--------------------------|
| Requirements | Analyze target user groups and context of use |
| Design | Review UI designs for usability issues |
| Development | Conduct usability reviews on prototypes |
| System testing | Execute usability test sessions with target users |
| Acceptance | Collect user satisfaction feedback |

## Usability vs. Functional Testing

| Aspect | Functional Testing | Usability Testing |
|--------|-------------------|------------------|
| Question | Does it work? | Is it easy and pleasant to use? |
| Oracle | Specification | User satisfaction, task completion |
| Technique | Systematic black-box | Task-based sessions, observation |
| Evaluator | TA with specification | TA + target users |

## References
- ISTQB CTAL-TA v4.0, Section 4.2
- ISO/IEC 25010:2023 (interaction capability)
- ISO/IEC 25019:2023 (quality-in-use)
- ISO 9241-210:2019 (human-centred design)
- WCAG, 2023 (web accessibility guidelines)
- ISTQB-UT v1.0 (usability testing syllabus)
- UXQB-FL v4.01 (UX qualification)
