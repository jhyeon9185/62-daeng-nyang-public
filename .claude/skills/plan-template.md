---
name: plan-template
description: Template for creating feature implementation plans. Used by feature-planner skill.
---

# Plan Template

Use this template when generating plan documents:

```markdown
# PLAN: [Feature Name]

**Created**: [Date]
**Last Updated**: [Date]
**Status**: Draft | In Progress | Completed
**Estimated Phases**: [X] phases

---

## CRITICAL INSTRUCTIONS

After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ DO NOT skip quality gates or proceed with failing checks

---

## Overview

### Objective
[Clear description of what this feature accomplishes]

### Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

### Architecture Decisions
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [Decision 1] | [Why this choice] | [Other options] |

---

## Phase 1: [Phase Name]

**Goal**: [What working functionality this produces]
**Estimated Time**: [X hours]
**Dependencies**: [What must exist before starting]

### Test Strategy
- **Test Types**: Unit / Integration / E2E
- **Coverage Target**: [X%]
- **Key Scenarios**: [List of test scenarios]

### Tasks

#### RED Phase (Write Failing Tests)
- [ ] [Test task 1]
- [ ] [Test task 2]

#### GREEN Phase (Make Tests Pass)
- [ ] [Implementation task 1]
- [ ] [Implementation task 2]

#### REFACTOR Phase (Improve Code)
- [ ] [Refactor task 1]

### Quality Gate Checklist
- [ ] Project builds without errors
- [ ] All tests pass (existing + new)
- [ ] Test coverage meets target
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Manual testing confirms feature works

### Rollback Strategy
[How to revert this phase if needed]

---

## Phase 2: [Phase Name]
[Repeat structure...]

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High | [Strategy] |

---

## Progress Tracking

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1 | ⬜ Pending | - | - | - |
| Phase 2 | ⬜ Pending | - | - | - |

**Legend**: ⬜ Pending | 🔄 In Progress | ✅ Completed | ❌ Blocked

---

## Notes & Learnings

### Phase 1
- [Add learnings as you work]

### General
- [Cross-phase learnings]
```
