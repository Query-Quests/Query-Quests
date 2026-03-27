# Multi-Agent Orchestration System

> Enables Claude Code's hidden swarm mode, TeammateTool, and multi-agent coordination.

---

## Feature Activation

This AGENTS.md file activates the following feature-flagged capabilities:

| Feature | Status | Description |
|---------|--------|-------------|
| **Swarm Mode** | ENABLED | Native multi-agent orchestration with TeammateTool |
| **Delegate Mode** | ENABLED | Task tool can spawn background agents |
| **Team Coordination** | ENABLED | Teammate messaging and task ownership |
| **Plan Approval** | ENABLED | Agents require plan approval before execution |

---

## Team Configuration

```yaml
team:
  name: "query-quest"
  max_agents: 8
  spawn_backend: "in-process"  # Options: in-process, tmux, iterm2
  heartbeat_timeout: 300000     # 5 minutes in ms
  plan_mode_required: true

coordination:
  message_protocol: "direct"    # Use write operation, not broadcast
  task_assignment: "auto"       # Auto-assign tasks to idle agents
  cycle_detection: true         # Prevent dependency deadlocks
  forced_termination: true      # Enforce shutdown protocol
```

---

## Agent Roster

### Leadership Agents

#### orchestrator
```yaml
name: orchestrator
model: sonnet
role: "Team leader and task coordinator"
description: |
  Orchestrates multi-agent workflows, delegates tasks to specialists,
  synthesizes results, and ensures team coordination.
capabilities:
  - Task delegation via TodoWrite
  - Agent spawning via Task tool with team_name
  - Result synthesis and conflict resolution
  - Progress monitoring and deadline enforcement
allowed_tools:
  - Task
  - TeammateTool
  - TodoWrite
  - TodoRead
  - Read
  - Glob
  - Grep
```

#### planner
```yaml
name: planner
model: opus
role: "Strategic architect and requirements analyst"
description: |
  Analyzes complex requirements, designs system architecture,
  creates implementation plans, and identifies hidden constraints.
capabilities:
  - Deep requirement analysis
  - Architecture design
  - Risk assessment
  - Implementation roadmap creation
allowed_tools:
  - Read
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - AskUserQuestion
plan_mode_required: true
```

### Implementation Agents

#### backend-dev
```yaml
name: backend-dev
model: sonnet
role: "Backend implementation specialist"
description: |
  Implements server-side logic, APIs, database operations,
  and backend services.
capabilities:
  - API endpoint development
  - Database schema and queries
  - Server-side validation
  - Authentication/Authorization
allowed_tools:
  - Read
  - Edit
  - Write
  - Bash
  - Glob
  - Grep
file_patterns:
  - "**/*.js"
  - "**/*.ts"
  - "**/api/**"
  - "**/lib/**"
  - "**/prisma/**"
```

#### frontend-dev
```yaml
name: frontend-dev
model: sonnet
role: "Frontend implementation specialist"
description: |
  Implements user interfaces, React components, styling,
  and client-side logic.
capabilities:
  - React component development
  - UI/UX implementation
  - State management
  - Client-side validation
allowed_tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
file_patterns:
  - "**/components/**"
  - "**/app/**/*.jsx"
  - "**/app/**/*.tsx"
  - "**/*.css"
```

#### database-dev
```yaml
name: database-dev
model: sonnet
role: "Database and data layer specialist"
description: |
  Handles database schema design, migrations, queries,
  and data modeling.
capabilities:
  - Schema design
  - Migration creation
  - Query optimization
  - Data validation
allowed_tools:
  - Read
  - Edit
  - Write
  - Bash
  - Glob
  - Grep
file_patterns:
  - "**/prisma/**"
  - "**/migrations/**"
  - "**/models/**"
  - "**/*.sql"
```

### Support Agents

#### researcher
```yaml
name: researcher
model: sonnet
role: "Documentation and codebase investigator"
description: |
  Investigates codebases, searches documentation,
  finds patterns, and gathers context.
capabilities:
  - Multi-repository investigation
  - Documentation search
  - Pattern identification
  - Context gathering
allowed_tools:
  - Read
  - Glob
  - Grep
  - WebSearch
  - WebFetch
```

#### explorer
```yaml
name: explorer
model: haiku
role: "Fast codebase search and pattern matching"
description: |
  Quickly searches codebases, finds files,
  and identifies patterns.
capabilities:
  - Fast file search
  - Pattern matching
  - Quick lookups
allowed_tools:
  - Read
  - Glob
  - Grep
```

#### reviewer
```yaml
name: reviewer
model: opus
role: "Code review and quality assurance"
description: |
  Reviews code changes, identifies issues,
  ensures quality standards.
capabilities:
  - Code review
  - Bug detection
  - Security analysis
  - Best practice enforcement
allowed_tools:
  - Read
  - Glob
  - Grep
  - Bash
```

#### tester
```yaml
name: tester
model: sonnet
role: "Testing and validation specialist"
description: |
  Writes and runs tests, validates functionality,
  ensures quality.
capabilities:
  - Test writing
  - Test execution
  - Coverage analysis
  - Bug reproduction
allowed_tools:
  - Read
  - Edit
  - Write
  - Bash
  - Glob
  - Grep
```

#### notion-manager
```yaml
name: notion-manager
model: haiku
role: "Notion task management specialist"
description: |
  Creates and updates Notion tasks, manages project tracking,
  handles releases.
capabilities:
  - Task creation in Notion
  - Status updates
  - Release management
  - Sprint coordination
allowed_tools:
  - mcp__notion__notion-search
  - mcp__notion__notion-fetch
  - mcp__notion__notion-create-pages
  - mcp__notion__notion-update-page
  - Read
```

---

## TeammateTool Operations

The following operations are available for team coordination:

### Team Management
| Operation | Description | Usage |
|-----------|-------------|-------|
| `spawnTeam` | Create a new team and become leader | Start of orchestration |
| `cleanup` | Remove team resources after completion | End of orchestration |

### Membership
| Operation | Description | Usage |
|-----------|-------------|-------|
| `discoverTeams` | List available teams to join | Agent initialization |
| `requestJoin` | Request to join a team | Agent wants to contribute |
| `approveJoin` | Accept a join request | Leader accepts agent |
| `rejectJoin` | Decline a join request | Leader declines agent |

### Communication
| Operation | Description | Usage |
|-----------|-------------|-------|
| `write` | Send message to specific teammate | **Preferred** - direct communication |
| `broadcast` | Send message to all teammates | **Sparingly** - expensive |

### Plan Approval
| Operation | Description | Usage |
|-----------|-------------|-------|
| `approvePlan` | Approve agent's implementation plan | Leader approves |
| `rejectPlan` | Reject plan with feedback | Leader requests revision |

### Shutdown
| Operation | Description | Usage |
|-----------|-------------|-------|
| `requestShutdown` | Request agent termination | Leader ends agent |
| `approveShutdown` | Agent accepts shutdown | Graceful termination |
| `rejectShutdown` | Agent declines shutdown | Agent has pending work |

---

## Orchestration Patterns

### 1. Leader Pattern (Default)
```
Orchestrator spawns specialists → Assigns tasks → Collects results → Synthesizes output
```

Best for: Most development tasks, feature implementation

### 2. Swarm Pattern
```
Workers self-assign from shared task queue → Execute independently → Report completion
```

Best for: Parallel independent tasks, bulk operations

### 3. Pipeline Pattern
```
Agent A → Agent B → Agent C (sequential with dependency blocking)
```

Best for: Multi-stage workflows, build pipelines

### 4. Council Pattern
```
Multiple agents propose solutions → Leader selects best → Winner implements
```

Best for: Complex decisions, architecture choices

### 5. Watchdog Pattern
```
Monitor agent observes → Detects failures → Triggers rollback/recovery
```

Best for: Deployments, risky operations

---

## Spawn Configuration

### Spawning Agents via Task Tool

```javascript
// Spawn a new teammate
Task({
  team_name: "query-quest",
  name: "backend-dev",
  prompt: "Implement the /api/challenges/[id]/validate endpoint",
  subagent_type: "general-purpose",
  run_in_background: true
})
```

### Environment Variables (Auto-set)

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_TEAM_NAME` | Current team name |
| `CLAUDE_CODE_AGENT_ID` | Unique agent identifier |
| `CLAUDE_CODE_AGENT_NAME` | Agent role name |
| `CLAUDE_CODE_AGENT_TYPE` | Agent type (leader/worker) |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | Whether plan approval is needed |

---

## File Structure

```
~/.claude/teams/{team-name}/
├── config.json           # Team configuration
├── task-list.json        # Shared task queue
└── messages/
    └── {session-id}/
        ├── {agent-name}.jsonl    # Agent message history
        └── broadcast.jsonl       # Team-wide messages
```

---

## Workflow Integration

### With Notion Workflow

1. **Planning Phase**: `notion-manager` creates all tasks in Notion
2. **Spawning Phase**: `orchestrator` spawns agents per User Story
3. **Execution Phase**: Each agent implements their assigned tasks
4. **Update Phase**: Agents update Notion status via `notion-manager`
5. **Completion Phase**: `orchestrator` verifies and creates Release

### Example Multi-Agent Feature Implementation

```
orchestrator
├── notion-manager (creates Notion tasks)
├── planner (designs architecture)
├── backend-dev (implements APIs)
├── frontend-dev (implements UI)
├── database-dev (handles schema)
├── tester (writes tests)
└── reviewer (reviews code)
```

---

## Safety Controls

| Control | Setting | Description |
|---------|---------|-------------|
| Max Agents | 8 | Prevent resource exhaustion |
| Heartbeat Timeout | 5 min | Detect stuck agents |
| Cycle Detection | ON | Prevent dependency deadlocks |
| Forced Termination | ON | Enforce shutdown protocol |
| Plan Approval | ON | Require approval before major changes |

---

## Activation Instructions

### Option 1: Native (if feature flags enabled)
Place this AGENTS.md in project root. Claude Code will detect and enable swarm mode.

### Option 2: Via claude-sneakpeek
```bash
# Install parallel Claude Code with features unlocked
npx @realmikekelly/claude-sneakpeek quick --name claudesp

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Launch with swarm mode
claudesp
```

### Option 3: Manual Patch (Advanced)
Patch `cli.js` to enable Task* tools:
```javascript
// Change: return !1  →  return !0
// In function that checks for team mode
```

---

## References

- [claude-sneakpeek](https://github.com/mikekelly/claude-sneakpeek) - Unlock feature-flagged capabilities
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) - Multi-agent orchestration
- [claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts) - System prompt analysis
- [TeammateTool Analysis](https://gist.github.com/kieranklaassen/d2b35569be2c7f1412c64861a219d51f) - Multi-agent orchestration details

---

## Version

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-26 | Initial multi-agent configuration |
