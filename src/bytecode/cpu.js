import { Actions } from "../physics/actions"
import { aggregate } from "../utils/aggregate"

class Stack {
  constructor() {
    this.values = Array(10).fill(0)
  }
  pop() {
    const value = this.values[0]
    for (let i = 0; i < 9; i++) this.values[i] = this.values[i + 1]
    return value
  }
  push(value) {
    if (isNaN(value)) throw null
    if (abs(value) === Infinity) value = 0
    for (let i = 9; i >= 1; i--) this.values[i] = this.values[i - 1]
    this.values[0] = value
  }
  dup() {
    this.push(this.values[0])
  }
  swap() {
    let tmp = this.values[0]
    this.values[0] = this.values[1]
    this.values[1] = tmp
  }
  rot() {
    let tmp = this.values[0]
    this.values[0] = this.values[9]
    this.values[9] = tmp
  }
  get(idx = 0) {
    return this.values[idx]
  }
  reset() {
    this.values.fill(0)
  }
}

export class Operation {
  constructor(name, energy) {
    this.name = name
    this.energy = Actions[name]?.normalize(energy) || energy
  }
}

export function mergeOperations(ops, directCpu = false) {
  // let op
  // const map = {}
  // for (let i = ops.length - 1; i >= 0; i--) {
  //   op = ops[i]
  //   if (map[op.name]) continue
  //   map[op.name] = op
  // }
  // return Object.values(map)

  //! this strategy uses the merge method of the action; not sure if required
  //! TBD
  const grouped = aggregate(ops, (op) => op.name)
  const names = Object.keys(grouped)
  const merged = []
  let actionDef, merge
  for (let i = 0; i < names.length; i++) {
    actionDef = Actions[names[i]]
    merge = directCpu ? actionDef.mergeCpu || actionDef.merge : actionDef.merge
    // todo: optimize, this must be a lot computationnaly
    merged.push(...merge(grouped[names[i]]))
  }
  return merged
}

const MAX_CYCLES = 128

export class CPU {
  constructor(instructions, bytecode) {
    this.bytecode = bytecode
    this.ip = 0
    this.instructions = bytecode.parser(new Uint8Array(instructions))
    this.stack = new Stack()
    this.lastOperations = []
    this.operations = []
    this.lastExecuted = 0
    this.executed = 0
  }

  prepare() {
    this.ip = 0
    this.lastExecuted = this.executed
    this.executed = 0
    this.lastOperations = this.operations
    this.operations = []
  }

  run(context, ...initialStack) {
    if (initialStack.length > 0) {
      for (
        let i = 0, n = min(initialStack.length, this.stack.values.length);
        i < n;
        i++
      ) {
        this.stack.values[i] = initialStack[i]
      }
      // for (
      //   let i = 0, di = 0;
      //   i <= this.stack.values.length;
      //   i++, di = i % initialStack.length
      // ) {
      //   this.stack.push(initialStack[di])
      // }
    }

    let i = 0
    while (true) {
      if (++i > 128) break
      if (!this.next(context)) break
    }
    this.executed = i

    this.operations = mergeOperations(this.operations, true)
    return this.operations
  }

  next(context) {
    const { pointer, operations } = this.bytecode.exec(
      this.instructions,
      this.ip,
      this.stack,
      context
    )
    this.operations.push(...operations)
    this.ip = pointer + 1
    return this.ip < this.instructions.length
  }
}
