---
name: feature-planner
description: Creates phase-based feature plans with quality gates and incremental delivery structure. Use when planning features, organizing work, breaking down tasks, creating roadmaps, or structuring development strategy. Keywords: plan, planning, phases, breakdown, strategy, roadmap, organize, structure, outline.
---

# Feature Planner

## Purpose
Generate structured, phase-based plans where:
- Each phase delivers complete, runnable functionality
- Quality gates enforce validation before proceeding
- User approves plan before any work begins
- Progress tracked via markdown checkboxes
- Each phase is 1-4 hours maximum

## Planning Workflow

### Step 1: Requirements Analysis
1. Read relevant files to understand codebase architecture
2. Identify dependencies and integration points
3. Assess complexity and risks
4. Determine appropriate scope (small/medium/large)

### Step 2: Phase Breakdown with TDD Integration
Break feature into 3-7 phases where each phase:
- **Test-First**: Write tests BEFORE implementation
- Delivers working, testable functionality
- Takes 1-4 hours maximum
- Follows Red-Green-Refactor cycle
- Has measurable test coverage requirements
- Can be rolled back independently
- Has clear success criteria

**Phase Structure**:
- Phase Name: Clear deliverable
- Goal: What working functionality this produces
- **Test Strategy**: What test types, coverage target, test scenarios
- Tasks (ordered by TDD workflow):
  1. **RED Tasks**: Write failing tests first
  2. **GREEN Tasks**: Implement minimal code to make tests pass
  3. **REFACTOR Tasks**: Improve code quality while tests stay green
- Quality Gate: TDD compliance + validation criteria
- Dependencies: What must exist before starting
- **Coverage Target**: Specific percentage or checklist for this phase

### Step 3: Plan Document Creation
Use plan-template.md to generate: `docs/plans/PLAN_<feature-name>.md`

Include:
- Overview and objectives
- Architecture decisions with rationale
- Complete phase breakdown with checkboxes
- Quality gate checklists
- Risk assessment table
- Rollback strategy per phase
- Progress tracking section
- Notes & learnings area

### Step 4: User Approval
**CRITICAL**: Use AskUserQuestion to get explicit approval before proceeding.

Ask:
- "Does this phase breakdown make sense for your project?"
- "Any concerns about the proposed approach?"
- "Should I proceed with creating the plan document?"

Only create plan document after user confirms approval.

### Step 5: Document Generation
1. Create `docs/plans/` directory if not exists
2. Generate plan document with all checkboxes unchecked
3. Add clear instructions in header about quality gates
4. Inform user of plan location and next steps

## Quality Gate Standards

Each phase MUST validate these items before proceeding to next phase:

**Build & Compilation**:
- [ ] Project builds/compiles without errors
- [ ] No syntax errors

**Test-Driven Development (TDD)**:
- [ ] Tests written BEFORE production code
- [ ] Red-Green-Refactor cycle followed
- [ ] Unit tests: ≥80% coverage for business logic
- [ ] Integration tests: Critical user flows validated
- [ ] Test suite runs in acceptable time (<5 minutes)

**Testing**:
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Test coverage maintained or improved

**Code Quality**:
- [ ] Linting passes with no errors
- [ ] Type checking passes (if applicable)
- [ ] Code formatting consistent

**Functionality**:
- [ ] Manual testing confirms feature works
- [ ] No regressions in existing functionality
- [ ] Edge cases tested

**Security & Performance**:
- [ ] No new security vulnerabilities
- [ ] No performance degradation
- [ ] Resource usage acceptable

**Documentation**:
- [ ] Code comments updated
- [ ] Documentation reflects changes

## Phase Sizing Guidelines

**Small Scope** (2-3 phases, 3-6 hours total):
- Single component or simple feature
- Minimal dependencies
- Clear requirements
- Example: Add dark mode toggle, create new form component

**Medium Scope** (4-5 phases, 8-15 hours total):
- Multiple components or moderate feature
- Some integration complexity
- Database changes or API work
- Example: User authentication system, search functionality

**Large Scope** (6-7 phases, 15-25 hours total):
- Complex feature spanning multiple areas
- Significant architectural impact
- Multiple integrations
- Example: AI-powered search with embeddings, real-time collaboration

## Risk Assessment

Identify and document:
- **Technical Risks**: API changes, performance issues, data migration
- **Dependency Risks**: External library updates, third-party service availability
- **Timeline Risks**: Complexity unknowns, blocking dependencies
- **Quality Risks**: Test coverage gaps, regression potential

For each risk, specify:
- Probability: Low/Medium/High
- Impact: Low/Medium/High
- Mitigation Strategy: Specific action steps

## Rollback Strategy

For each phase, document how to revert changes if issues arise.
Consider:
- What code changes need to be undone
- Database migrations to reverse (if applicable)
- Configuration changes to restore
- Dependencies to remove
