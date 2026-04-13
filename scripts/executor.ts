#!/usr/bin/env node
/**
 * Parallel Tasks Executor
 * 
 * Executes multiple tasks in parallel with:
 * - Configurable timeout per task
 * - Error isolation (one failure doesn't block others)
 * - Real-time progress feedback
 * - Aggregated results summary
 */

interface Task {
  name: string
  description: string
  timeout?: number
}

interface TaskResult {
  name: string
  status: 'fulfilled' | 'rejected' | 'timeout' | 'cancelled'
  duration?: number
  value?: string
  error?: string
}

interface ParallelOptions {
  timeout: number
  stopOnError: boolean
  reportProgress: boolean
}

/**
 * Parse task input from various formats
 */
function parseTaskInput(input: string): Task[] {
  const lines = input.split('\n').filter(line => line.trim())
  const tasks: Task[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue
    
    // Named task: [name] description
    const namedMatch = trimmed.match(/^\[([^\]]+)\]\s*(.+)$/)
    if (namedMatch) {
      tasks.push({
        name: namedMatch[1],
        description: namedMatch[2]
      })
      continue
    }
    
    // Bullet list or numbered: - task or 1. task
    const listMatch = trimmed.match(/^[-*\d.]\s*(.+)$/)
    if (listMatch) {
      tasks.push({
        name: `task-${tasks.length + 1}`,
        description: listMatch[1]
      })
      continue
    }
    
    // Plain text: treat as description
    if (trimmed.length > 0) {
      tasks.push({
        name: `task-${tasks.length + 1}`,
        description: trimmed
      })
    }
  }
  
  return tasks
}

/**
 * Simulate task execution (replace with actual sessions_spawn in production)
 */
async function executeTask(task: Task, timeout: number): Promise<TaskResult> {
  const startTime = Date.now()
  
  try {
    // In production, this would call sessions_spawn
    // For now, simulate execution
    const result = await Promise.race([
      simulateTaskExecution(task),
      createTimeoutPromise(timeout)
    ])
    
    return {
      name: task.name,
      status: 'fulfilled',
      duration: Date.now() - startTime,
      value: result
    }
  } catch (error) {
    return {
      name: task.name,
      status: error instanceof Error && error.message === 'TIMEOUT' ? 'timeout' : 'rejected',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Simulate task execution (placeholder)
 */
async function simulateTaskExecution(task: Task): Promise<string> {
  // Simulate work - replace with actual task execution
  await new Promise(resolve => setTimeout(resolve, 1000))
  return `Completed: ${task.description}`
}

/**
 * Create a promise that rejects after timeout
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
  })
}

/**
 * Execute multiple tasks in parallel
 */
async function executeParallel(
  tasks: Task[],
  options: Partial<ParallelOptions> = {}
): Promise<TaskResult[]> {
  const opts: ParallelOptions = {
    timeout: options.timeout || 300000, // 5 minutes default
    stopOnError: options.stopOnError || false,
    reportProgress: options.reportProgress !== false
  }
  
  console.log(`\n🚀 Starting ${tasks.length} tasks in parallel...\n`)
  
  const results = await Promise.all(
    tasks.map(task => {
      if (opts.reportProgress) {
        console.log(`🔄 [${task.name}] Starting...`)
      }
      return executeTask(task, (task.timeout || opts.timeout) * 1000)
    })
  )
  
  return results
}

/**
 * Format results as a summary table
 */
function formatResults(results: TaskResult[]): string {
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status !== 'fulfilled').length
  
  let output = `\n`
  output += `✅ Parallel Execution Complete\n`
  output += `   ${results.length} tasks: ${succeeded} succeeded, ${failed} failed\n\n`
  
  output += `┌─────────────────┬──────────┬────────────┐\n`
  output += `│ Task            │ Status   │ Duration   │\n`
  output += `├─────────────────┼──────────┼────────────┤\n`
  
  for (const result of results) {
    const statusIcon = result.status === 'fulfilled' ? '✅' : 
                       result.status === 'timeout' ? '⏱️' : '❌'
    const duration = result.duration ? `${(result.duration / 1000).toFixed(0)}s` : '-'
    const status = result.status === 'fulfilled' ? 'Done' : 
                   result.status === 'timeout' ? 'Timeout' : 'Failed'
    
    const name = result.name.padEnd(13).slice(0, 13)
    const statusStr = `${statusIcon} ${status}`.padEnd(10)
    
    output += `│ ${name} │ ${statusStr} │ ${duration.padStart(8)} │\n`
  }
  
  output += `└─────────────────┴──────────┴────────────┘\n`
  
  // Add error details
  const errors = results.filter(r => r.status !== 'fulfilled')
  if (errors.length > 0) {
    output += `\n❌ Failed Tasks:\n`
    for (const error of errors) {
      output += `   • ${error.name}: ${error.error || 'Unknown error'}\n`
    }
  }
  
  return output
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
📋 Parallel Tasks Executor

Usage:
  node executor.ts "Task 1" "Task 2" "Task 3"
  node executor.ts --timeout 300 "Task 1" "Task 2"
  
Options:
  --timeout <seconds>  Set timeout per task (default: 300)
  --progress           Show real-time progress
`)
    process.exit(0)
  }
  
  const tasks: Task[] = []
  let timeout = 300
  
  for (const arg of args) {
    if (arg === '--timeout' || arg === '-t') continue
    if (arg.match(/^\d+$/)) {
      timeout = parseInt(arg)
      continue
    }
    tasks.push({
      name: `task-${tasks.length + 1}`,
      description: arg
    })
  }
  
  const results = await executeParallel(tasks, { timeout })
  console.log(formatResults(results))
}

main().catch(console.error)
