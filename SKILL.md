---
name: parallel-tasks
description: Execute multiple tasks in parallel with timeout protection, error isolation, and real-time progress feedback. Use when user says "run these in parallel", "parallel execution", "concurrent tasks", or wants multiple independent tasks done simultaneously with proper error handling and timeout control.
---

# Parallel Tasks Skill

Execute multiple tasks **in parallel** with enterprise-grade reliability: timeout protection, error isolation, and real-time progress feedback.

## When to Use

Use this skill when:
- User says "run these in parallel" or "do these simultaneously"
- Multiple independent tasks need to be executed at once
- User wants faster results by running tasks concurrently
- Tasks are slow and user wants to avoid waiting sequentially

## Core Concept

**Serial vs Parallel**:

```
SERIAL (slow):
Task 1 → Task 2 → Task 3  (5min + 5min + 5min = 15min)

PARALLEL (fast):
Task 1 ─┬─> (5min total, not 15min)
Task 2 ─┼─>
Task 3 ─┘
```

## Usage

### Basic Parallel Execution

```
/parallel
- Task 1: Search for docs
- Task 2: Search for code
- Task 3: Search for examples
```

### Named Tasks with Custom Timeout

```
/parallel timeout=300
- [search-docs] Search for relevant documentation
- [search-code] Find similar implementations  
- [analyze] Analyze the results
```

### JSON Format for Complex Tasks

```
/parallel
{
  "tasks": [
    { "name": "research", "description": "Research topic X", "timeout": 600 },
    { "name": "implement", "description": "Implement feature Y", "timeout": 900 },
    { "name": "test", "description": "Write tests for Z", "timeout": 300 }
  ]
}
```

## Implementation

### Core Execution Pattern

```typescript
// 1. Parse tasks from input
const tasks = parseTaskInput(input)

// 2. Execute all tasks in parallel
const results = await Promise.allSettled(
  tasks.map(task => 
    sessions_spawn({
      task: task.description,
      label: task.name,
      runTimeoutSeconds: task.timeout || 300
    })
  )
)

// 3. Aggregate results
const summary = results.map((result, index) => ({
  task: tasks[index].name,
  status: result.status,
  value: result.status === 'fulfilled' ? result.value : null,
  error: result.status === 'rejected' ? result.reason : null
}))
```

### Timeout Protection

- **Default timeout**: 5 minutes (300 seconds)
- **Configurable**: Set per-task or globally
- **Behavior**: Task auto-terminates after timeout
- **Error**: Returns timeout error without blocking other tasks

### Error Isolation

Each task runs in **complete isolation**:

| Problem | Serial | Parallel (This Skill) |
|---------|--------|----------------------|
| One task fails | All others stop | Only failed task affected |
| One task hangs | Blocks entire flow | Others continue normally |
| One task times out | May cascade | Contained, others finish |

### Progress Feedback

Tasks emit progress as they run:

```
🔄 [research] Running... (2/3)
  └─ Subtask: Searching docs...
  
✅ [research] Complete (3s)
🔄 [implement] Running... (1/3)
  └─ Subtask: Writing code...
  
❌ [test] Failed: Timeout after 300s
🔄 [analyze] Running... (3/3)
```

## Task Input Formats

### 1. Line-by-line (Simple)

```
/parallel
Task 1 description here
Task 2 description here
Task 3 description here
```

### 2. Bullet List (Recommended)

```
/parallel
- Search for API documentation
- Find relevant code examples
- Check for existing implementations
```

### 3. Numbered List

```
/parallel
1. Research authentication patterns
2. Design database schema
3. Implement API endpoints
```

### 4. Named Tasks

```
/parallel
[research] Gather requirements and analyze use cases
[design] Create system architecture
[implement] Write production code
```

### 5. JSON (Advanced)

```json
{
  "tasks": [
    { "name": "task1", "description": "...", "timeout": 300 },
    { "name": "task2", "description": "...", "timeout": 600 }
  ],
  "options": {
    "stopOnError": false,
    "reportProgress": true
  }
}
```

## Output Format

### Success Case

```
✅ Parallel Execution Complete (5 tasks, 3 succeeded, 2 failed, 2m 30s)

┌─────────────────┬──────────┬────────────┐
│ Task            │ Status   │ Duration   │
├─────────────────┼──────────┼────────────┤
│ research        │ ✅ Done  │ 1m 23s    │
│ design          │ ✅ Done  │ 45s       │
│ implement       │ ✅ Done  │ 2m 10s    │
│ test            │ ❌ Failed│ 5m 00s    │
│ deploy          │ ❌ Error │ 12s       │
└─────────────────┴──────────┴────────────┘

📊 Summary:
- 3 tasks completed successfully
- 2 tasks failed (see details below)

❌ Task "test" failed:
   Timeout: exceeded 5 minute limit

❌ Task "deploy" failed:
   Error: Permission denied
```

### Partial Success

```
⚠️  Parallel Execution Complete (4 tasks, 2 succeeded, 2 pending)

🔄 Still running:
- [research] 80% complete
- [implement] Waiting for dependencies

✅ Completed:
- [design] Done in 45s
- [analyze] Done in 1m 12s
```

## Options

### Global Options

| Option | Default | Description |
|--------|---------|-------------|
| `timeout` | 300 | Default timeout per task (seconds) |
| `stopOnError` | false | Stop all tasks if one fails |
| `reportProgress` | true | Show real-time progress |

### Per-Task Options

| Option | Description |
|--------|-------------|
| `name` | Task identifier for reporting |
| `description` | What the task should do |
| `timeout` | Task-specific timeout (overrides global) |

## Error Handling

### Error Types

| Error | Cause | Behavior |
|-------|-------|----------|
| `TIMEOUT` | Exceeded timeout | Task terminated, other tasks continue |
| `ERROR` | Task threw exception | Error captured, other tasks continue |
| `CANCELLED` | User cancelled | All running tasks terminate |
| `NO_REPLY` | Task returned no output | Reported as warning |

### Best Practices

1. **Independent tasks first**: Tasks should not depend on each other
2. **Set reasonable timeouts**: Don't set 5min if task should take 30s
3. **Use named tasks**: Easier to debug when something fails
4. **Keep tasks focused**: One clear goal per task

## Examples

### Example 1: Research Multiple Topics

```
/parallel
- Research Claude Code best practices
- Find OpenClaw skill examples
- Search for agent design patterns
```

### Example 2: Multi-File Operations

```
/parallel
[read-config] Read all config files in ./config/
[read-src] Read all source files in ./src/
[read-tests] Read all test files in ./tests/
```

### Example 3: Parallel Implementation

```
/parallel timeout=600
- [backend] Implement user authentication API
- [frontend] Build login form component
- [database] Create users table migration
```

### Example 4: Web Scraping

```
/parallel
- Fetch product data from store1.com
- Fetch product data from store2.com  
- Fetch product data from store3.com
```

## Anti-Patterns

❌ **Don't use for dependent tasks**:
```
/parallel
- Create user account
- Send welcome email  ← depends on first task!
```
Use sequential execution instead.

❌ **Don't use for very fast tasks**:
```
/parallel
- Read file A
- Read file B
- Read file C
```
The overhead of spawning parallel sessions isn't worth it for sub-second tasks.

## Related Skills

- `subagents` - Background agent spawning
- `batch-operations` - Bulk file operations
- `workflow-orchestrator` - Complex multi-step workflows
