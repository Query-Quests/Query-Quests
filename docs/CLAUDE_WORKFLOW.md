# Claude Code Task/Agent Workflow Guide

This document explains how to effectively use Claude Code's task system and sub-agent spawning for complex development work on Query-Quest.

---

## Table of Contents

1. [Task System Basics](#1-task-system-basics)
2. [Sub-Agent Spawning](#2-sub-agent-spawning)
3. [Persistence Setup](#3-persistence-setup)
4. [Effective Prompting Patterns](#4-effective-prompting-patterns)
5. [Best Practices](#5-best-practices)
6. [Notion Integration](#6-notion-integration)

---

## 1. Task System Basics

The task system helps organize complex, multi-step work into trackable units.

### Core Tools

| Tool | Purpose |
|------|---------|
| `TaskCreate` | Create a new task with subject, description, and activeForm |
| `TaskUpdate` | Update task status, add dependencies, or modify details |
| `TaskList` | View all tasks and their current status |
| `TaskGet` | Retrieve full details of a specific task by ID |

### Task Statuses

Tasks flow through three states:

```
pending → in_progress → completed
```

- **pending**: Task is waiting to be started
- **in_progress**: Task is actively being worked on
- **completed**: Task has been finished

### Dependencies

Tasks can have dependencies using two properties:

- **`blockedBy`**: Array of task IDs that must complete before this task can start
- **`blocks`**: Array of task IDs that cannot start until this task completes

Example dependency chain:
```
Task 1: "Set up database schema"
Task 2: "Create API endpoints" (blockedBy: [Task 1])
Task 3: "Build UI components" (blockedBy: [Task 2])
```

### Creating a Task

When Claude creates a task, it includes:

```javascript
{
  subject: "Fix authentication bug",           // Imperative form
  description: "Debug the login flow...",      // Detailed requirements
  activeForm: "Fixing authentication bug"      // Present continuous for spinner
}
```

---

## 2. Sub-Agent Spawning

Claude Code can spawn specialized sub-agents to handle specific types of work in parallel.

### The Task Tool

The `Task` tool launches autonomous agents that:
- Have their own isolated context window
- Can use specific tools based on their type
- Return results back to the main conversation
- Can run in parallel for independent tasks

### Available Agent Types

| Agent Type | Use Case | Available Tools |
|------------|----------|-----------------|
| **Bash** | Git operations, command execution, terminal tasks | Bash only |
| **Explore** | Codebase exploration, file searching, understanding code | Read, Glob, Grep, etc. (no Edit/Write) |
| **Plan** | Designing implementation strategies, architecture decisions | Read, Glob, Grep, etc. (no Edit/Write) |
| **general-purpose** | Complex multi-step tasks, research, code search | All tools |

### Parallel Execution

Independent agents can run simultaneously:

```
User: "Run tests and check linting in parallel"

Claude spawns:
  ├── Agent 1 (Bash): Running test suite
  └── Agent 2 (Bash): Running linter
```

Both complete and return results independently.

### Background Agents

Agents can run in the background with `run_in_background: true`:
- Returns immediately with an `output_file` path
- Use `Read` tool or `tail` to check progress
- Good for long-running operations

### Resuming Agents

Agents can be resumed using their ID:
- The agent continues with full previous context
- Useful for follow-up work on the same task

---

## 3. Persistence Setup

By default, task lists don't persist between sessions. Here's how to enable persistence.

### Setting the Environment Variable

Add to your shell profile:

**For Zsh (macOS default):**
```bash
# Add to ~/.zshrc
export CLAUDE_CODE_TASK_LIST_ID="query-quest-tasks"
```

**For Bash:**
```bash
# Add to ~/.bashrc
export CLAUDE_CODE_TASK_LIST_ID="query-quest-tasks"
```

### Apply Changes

After editing your profile:

```bash
# For current session
source ~/.zshrc  # or ~/.bashrc

# Verify it's set
echo $CLAUDE_CODE_TASK_LIST_ID
```

### How It Works

With `CLAUDE_CODE_TASK_LIST_ID` set:
- Tasks persist across session restarts
- You can close Claude Code and return later
- Task progress is maintained
- Dependencies remain intact

### Per-Project Task Lists

Use different IDs for different projects:

```bash
# In project-specific .envrc (with direnv)
export CLAUDE_CODE_TASK_LIST_ID="query-quest-$(pwd | md5sum | cut -c1-8)"
```

---

## 4. Effective Prompting Patterns

### Triggering Task-Based Workflows

Claude automatically uses the task system for complex work. You can explicitly request it:

```
"Create a task list for implementing user authentication"
"Break this down into tasks and track progress"
"Use the task system to organize this refactor"
```

### Example Prompts by Scenario

#### Large Refactors

```
"Refactor the challenge submission system:
1. Move validation logic to a separate service
2. Update all API routes to use the new service
3. Add comprehensive error handling
4. Update tests

Create tasks for each step and track dependencies."
```

#### New Feature Implementation

```
"Implement a teacher dashboard feature:
- Create the dashboard page
- Add API endpoints for teacher stats
- Build the data visualization components
- Add role-based access control

Use tasks to track each component."
```

#### Bug Investigation

```
"Investigate why challenge submissions are failing for some users.
Use an Explore agent to:
1. Find all submission-related code
2. Check the API error handling
3. Review database queries
4. Report findings before fixing"
```

#### Multi-File Changes

```
"Update the leaderboard to show weekly rankings:
- Modify the database query
- Update the API endpoint
- Change the frontend component
- Update tests

Run independent tasks in parallel where possible."
```

### Requesting Parallel Execution

```
"Run these in parallel:
1. Check for TypeScript errors
2. Run the test suite
3. Verify the build compiles"
```

---

## 5. Best Practices

### When to Use Task System vs. Direct Execution

**Use Task System When:**
- Work involves 3+ distinct steps
- Multiple files need coordinated changes
- You want to track progress visually
- Work might span multiple sessions
- Dependencies exist between steps

**Use Direct Execution When:**
- Single file edits
- Quick fixes or typo corrections
- Simple queries or questions
- Tasks that don't need tracking

### Optimal Task Granularity

**Too Coarse:**
```
Task: "Build the entire admin panel"
```

**Too Fine:**
```
Task 1: "Create the div"
Task 2: "Add the className"
Task 3: "Import React"
```

**Just Right:**
```
Task 1: "Create AdminLayout component with sidebar navigation"
Task 2: "Build UserManagement page with CRUD operations"
Task 3: "Add role-based access control to admin routes"
```

### Reviewing Task Graphs

Before execution, verify:
- Dependencies make logical sense
- No circular dependencies exist
- Parallel tasks are truly independent
- Critical path is identified

### Using Ctrl+T

Press `Ctrl+T` during a session to:
- View all current tasks
- See task statuses at a glance
- Check which tasks are blocked
- Monitor overall progress

### Agent Selection Guidelines

| Scenario | Recommended Agent |
|----------|-------------------|
| "Find all files using X pattern" | Explore |
| "Run the test suite" | Bash |
| "Design the implementation approach" | Plan |
| "Implement feature X end-to-end" | general-purpose |

### Error Handling

When a task fails:
1. Task stays `in_progress` (not marked completed)
2. Claude creates a new task for the blocker
3. Original task remains for retry
4. Never mark incomplete work as done

---

## Quick Reference

### Task Lifecycle

```
┌─────────┐     ┌─────────────┐     ┌───────────┐
│ pending │ ──▶ │ in_progress │ ──▶ │ completed │
└─────────┘     └─────────────┘     └───────────┘
```

### Common Commands

| Action | How to Request |
|--------|----------------|
| Create task list | "Break this into tasks" |
| View tasks | Press Ctrl+T or "Show task list" |
| Run in parallel | "Run X and Y in parallel" |
| Use specific agent | "Use an Explore agent to find..." |
| Enable persistence | Set `CLAUDE_CODE_TASK_LIST_ID` |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_TASK_LIST_ID` | Persist tasks across sessions |

---

---

## 6. Notion Integration

Claude Code integrates bidirectionally with Notion for project management visibility.

### How It Works

Tasks created and updated through Claude Code automatically sync to the Notion Tasks database:

```
TaskCreate → Hook → Creates Notion task with project/sprint
TaskUpdate(in_progress) → Hook → Notion status: "In Progress"
TaskUpdate(completed) → Hook → Notion status: "Done"
```

### Project Detection

Projects are auto-detected from the git branch name. The **prefix is fetched dynamically from Notion** (not hardcoded):

| Branch Pattern | Project | Prefix (from Notion) |
|---------------|---------|---------------------|
| `glpd-*` | GIEQs Learning Platform | GLPD |
| `krt-*` | Kratos | KRT |
| `qrqs-*` | Query-Quest | QRQS |
| `main` | Query-Quest (default) | QRQS |

**Branch naming convention:** `{prefix}-{feature}-{description}`
- `glpd-auth-fix-login` → GLPD project (GIEQs Learning Platform)
- `krt-api-new-endpoint` → KRT project (Kratos)
- `qrqs-challenges-add-validation` → QRQS project (Query-Quest)

Prefixes are cached locally in `.claude/project-cache.json` after being fetched from Notion.

### Sprint Management

Sprints are 2-week cycles, auto-created when needed:

- **Format:** `{PREFIX}-Sprint-{year}-{sprintNum}`
- **Example:** `QRQS-Sprint-2026-2` (Sprint 2 of 2026 for Query-Quest)
- **Duration:** 2 weeks per sprint

Sprints are automatically linked to tasks based on the current date.

### Task Lifecycle Sync

| Claude Code Event | Notion Update |
|-------------------|---------------|
| `TaskCreate` | Creates task with "To Do" status |
| `TaskUpdate(in_progress)` | Status → "In Progress" |
| `TaskUpdate(completed)` | Status → "Done", sets Resolved date |
| Dependencies added | Updates "Blocked by" relation |

### Task Type Hierarchy

Tasks are organized in a hierarchy based on their structure:

| Type | Description | Created When |
|------|-------------|--------------|
| **Epic** | Large feature with multiple stories | Blocks 3+ other tasks |
| **User Story** | Medium feature with subtasks | Blocks 1-2 other tasks |
| **Task** | Individual work item | Leaf node (no blockers) |
| **Bug** | Fix for existing functionality | Subject contains fix/bug keywords |

**Automatic Type Detection:**
- Tasks that block 3+ other tasks → **Epic**
- Tasks that block 1-2 other tasks → **User Story**
- Tasks with `fix`, `bug`, `error`, `broken` keywords → **Bug**
- All other tasks → **Task**

**Parent-Child Linking:**
When a task has a `blockedBy` dependency, the first blocker can become its "Parent item" in Notion, creating a hierarchical structure visible in Notion's sub-items view.

### SubProject Detection

File paths map to sub-projects:

| Path Pattern | SubProject |
|--------------|------------|
| `src/app/admin` | Gieqs Learning App |
| `src/app/api` | GIEQs Learning API |
| `src/components` | Gieqs Learning App |
| `src/lib` | GIEQs Learning API |
| `src/prisma` | GIEQs Learning API |

### Configuration Files

| File | Purpose |
|------|---------|
| `.claude/hooks.json` | Hook triggers for sync |
| `.claude/settings.json` | Notion database IDs and mapping rules |
| `.claude/project-cache.json` | Cached project prefixes (auto-generated) |
| `.claude/scripts/sync-notion-task.js` | Core sync logic |
| `.claude/scripts/sprint-manager.js` | Sprint auto-creation |
| `.claude/scripts/project-detector.js` | Branch-to-project mapping |

### Viewing Synced Tasks

1. Open the Notion Tasks database
2. Filter by "Source = Claude Code" to see synced tasks
3. Watch tasks move through statuses as Claude works

### Manual Testing

Test the scripts from the project root:

```bash
# Check current project context
node .claude/scripts/project-detector.js --context

# Check current sprint info
node .claude/scripts/sprint-manager.js --info

# View sync logs
cat .claude/logs/notion-sync.log
```

---

## Related Documentation

- [Claude Code CLI Documentation](https://docs.anthropic.com/claude-code)
- Query-Quest project README
- Contributing guidelines
