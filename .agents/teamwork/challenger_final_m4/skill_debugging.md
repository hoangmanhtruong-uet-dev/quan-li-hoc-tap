# Methodology: Systematic Debugging
Source: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\systematic-debugging\SKILL.md

Core Principle: ALWAYS find root cause before attempting fixes. Symptom fixes are failure.
The Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.
Four Phases:
1. Root Cause Investigation: Read error messages carefully, reproduce consistently, check recent changes, gather evidence at boundaries, trace data flow backward.
2. Pattern Analysis: Find working examples, compare against references, identify differences, understand dependencies.
3. Hypothesis and Testing: Form single hypothesis, test minimally, verify before continuing.
4. Implementation: Create failing test case, implement single fix, verify fix, question architecture if 3+ fixes fail.
