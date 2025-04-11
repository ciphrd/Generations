import { Actions } from "../physics/actions"

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
  constructor(name, values) {
    this.name = name
    this.values = values.map((val) => Actions[name]?.normalize(val) || val)
  }
}

const MAX_CYCLES = 128

export class CPU {
  constructor(instructions, bytecode) {
    this.bytecode = bytecode
    this.ip = 0
    this.instructions = bytecode.parser(new Uint8Array(instructions))
    this.stack = new Stack()
    this.operations = []
  }

  run(context, ...initialStack) {
    this.ip = 0
    this.operations.length = 0
    this.stack.reset()

    for (
      let i = 0, di = 0;
      i <= this.stack.values.length;
      i++, di = i % initialStack.length
    ) {
      this.stack.push(initialStack[di])
    }

    // console.log(...this.stack.values)

    let i = 0
    while (true) {
      // console.log("------------------------")
      if (++i > 128) {
        // console.log("MAX ITERATIONS !!")
        break
      }
      if (!this.next(context)) break

      // console.log(...this.stack.values)
      // console.log(...this.operations)
    }
    // console.log(...this.stack.values)
    // console.log(...this.operations)
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
