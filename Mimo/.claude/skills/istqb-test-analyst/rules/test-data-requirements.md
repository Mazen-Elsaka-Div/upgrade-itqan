---
title: Test Data Requirements
impact: HIGH
impactDescription: >
  Missing, incorrect, or non-compliant test data causes test execution failures, missed defects,
  GDPR violations, and unreliable test results. Early identification of test data requirements
  ensures data is available, compliant, and fit for purpose when testing begins.
tags:
  - test-data
  - gdpr
  - confidentiality
  - coverage
  - test-design
  - ch1
---

# Test Data Requirements

## Purpose

During test design, the TA identifies and requests test data needed for test execution. Test data is not just input values — it includes all data needed to set up preconditions, define expected results, and configure the system state.

## Key Aspects of Test Data Requirements

### 1. Similarity with Production Data

**Production data**:
- Reflects real-world patterns and distributions
- May lack controlled variability
- May contain sensitive personal information

**Synthetic data**:
- Allows controlled variability
- Should reflect production data patterns, distributions, and outliers
- May overlook defects that only occur with real-world data
- Must reflect realistic business and technical scenarios for systems without production data

**Personas**: Provide realistic, user-centered profiles that guide creation of data reflecting diverse user scenarios and behaviors.

### 2. Confidentiality and GDPR Compliance

| Data Type | Treatment |
|-----------|-----------|
| Sensitive personal data | Must be protected |
| Pseudonymized data | Personal information replaced with artificial identifiers |
| Anonymized data | Identifiable information removed |

**Regulatory requirements**:
- **GDPR** (EU): General Data Protection Regulation (Commission, 2016)
- **HIPAA** (US): Health Insurance Portability and Accountability Act

The TA must observe applicable data protection regulations when using or creating test data.

### 3. Purpose

Test data determines:
- **Preconditions**: System state before test execution (e.g., system time, user permissions)
- **Expected results**: What the system should produce for given inputs
- **Configuration**: Relations between products, departments, categories

Purpose-specific considerations:
- Data for negative tests (invalid inputs, boundary violations)
- Data for security tests (injection attempts, privilege escalation)
- Data for performance tests (large volumes)

### 4. Coverage Criteria Alignment

Test data must align with the chosen test technique's coverage criteria:
- **Domain testing**: ON, OFF, IN, OUT points
- **Equivalence partitioning**: Representatives from each partition (valid and invalid)
- **Combinatorial testing**: Specific parameter-value combinations
- **State transition testing**: Data that triggers each transition

Always include both valid and invalid test data.

### 5. Data Format

For API testing and automated execution:
- Structured formats: CSV, JSON, XML, database records
- Enables systematic data management and parameterization
- Separates test logic from test data (improves maintainability)

### 6. Traceability

- Link test data to test cases and test conditions
- Enables maintenance when test cases change
- Avoids duplicate data sets
- Hard-coded test data in low-level test cases should be **avoided**

### 7. Maintainability

- Separate test logic from test data (e.g., data-driven test cases)
- Avoid embedding specific values directly in test procedures
- Changes to data should not require rewriting test steps

### 8. Dependencies

- Some test data requires a series of steps to create (e.g., create user, then assign role, then purchase product)
- Document data creation sequences
- Consider test data for cleanup (postconditions)

### 9. Availability

**Service virtualization**: When real data or dependent services are unavailable, simulate them to:
- Interact with external systems
- Test integration scenarios without live dependencies
- Control data behavior in testing

### 10. Time Sensitivity and Data Aging

- Test cases involving time-sensitive data (e.g., token expiry, license validity)
- Outdated data may cause unexpected behavior
- Plan for data refresh strategies
- Document which data has time sensitivity

## Test Data Summary Table

| Aspect | Key Question | Action |
|--------|-------------|--------|
| Similarity | Does it reflect production patterns? | Use synthetic data that mirrors production |
| Confidentiality | Is personal data involved? | Pseudonymize or anonymize |
| Purpose | What system state is needed? | Define preconditions explicitly |
| Coverage | Does it support the chosen technique? | Map data to coverage items |
| Format | Is structured format needed? | Use CSV/JSON/XML/DB for automation |
| Traceability | Is it linked to test cases? | Maintain test data register |
| Dependencies | Are there creation sequences? | Document data setup scripts |
| Time sensitivity | Does data expire or age? | Plan refresh schedule |

## References
- ISTQB CTAL-TA v4.0, Section 1.3.5
- ISO/IEC/IEEE 29119-3:2021, Section 8.5 (test data requirements)
- GDPR (EU Commission, 2016)
- HIPAA (Health et al., 2024)
