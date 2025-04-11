import { vec2 } from "../utils/vec"
import { angleForLerp, clamp, lerp, mod } from "../utils/math"
import { Token } from "../network/token"
import { rnd } from "../utils/rnd"
import { CPU } from "../bytecode/cpu"
import { ActivationBytecode } from "../bytecode/activation"
import { Actions } from "./actions"

let c = 0
const _v2a = vec2(),
  _v2b = vec2()

export const BodyFlags = {
  DEBUG: 2 ** 0,
  REPELLING: 2 ** 1,
  REPELLED: 2 ** 2,
  FOOD: 2 ** 3,
  FOOD_SEEKER: 2 ** 4,
  ORGANISM: 2 ** 5,
}

const MAX_VELOCITY = 0.2
const MAX_VELOCITY_SQ = MAX_VELOCITY ** 2

export class Body {
  constructor(world, pos, radius, friction = 0, color = "#00ff00") {
    this.world = world
    this.id = c++
    this.energy = 1
    this.radius = radius
    this.color = color
    this.pos = pos
    this.vel = vec2()
    this.acc = vec2()
    this.forwards = vec2().fromAngle(rnd.range(0, TAU))
    this.flags = 0
    this.data = {
      clusterGroup: -1,
    }
    this.initial = {
      friction,
    }
    this.springs = []
    this.modifiers = []
    this.friction = friction
    this.receivedSignals = Array(4).fill(0)
    this.signals = Array(4).fill(0)
    this.operations = []
    this.netCycle = 0
    this.sensors = []
    this.actions = Object.fromEntries(
      Object.entries(Actions).map(([name, props]) => [
        name,
        new props.module(this),
      ])
    )
    this.actionsArr = Object.values(this.actions)
  }

  setDNA(dna) {
    this.dna = dna
    this.cpus = []
    for (let i = 0; i < 4; i++) {
      this.cpus[i] = new CPU(dna[i + 1], ActivationBytecode)
    }
    this.cpu = new CPU(dna[1], ActivationBytecode)
  }

  // todo
  // tokens move more slowly (once every N frame or N ms)
  // ie tokens are processed after a delay

  prepare() {
    let tmp = this.signals
    this.signals = this.receivedSignals
    this.receivedSignals = tmp.fill(0)
  }

  receiveSignal(chemical, quantity) {
    if (quantity < 0.0001) return
    this.receivedSignals[chemical] = min(
      this.receivedSignals[chemical] + quantity,
      1
    )
  }

  sendSignal(chemical, quantity) {
    if (this.springs.length === 0) return

    this.netCycle = (this.netCycle + 1) % this.springs.length
    const spring = this.springs[this.netCycle]
    const other = spring.bodyA === this ? spring.bodyB : spring.bodyA
    other.receiveSignal(chemical, quantity)
  }

  processSignals(t, dt) {
    this.operations.length = 0

    // Todos
    // - implement token merging
    // - maybe we don't send token class anymore and just a tuple
    //   [chemical, quantity] for memory efficiency (which is passed as fn
    //   parameter, simply)

    // if (this.id === 1) {
    //   console.log("----------------")
    //   console.log([...this.signals])
    // }

    let quantity
    for (let i = 0; i < 4; i++) {
      quantity = this.signals[i]
      if (quantity === 0) continue

      if (this.cpu) {
        this.operations.push(...this.cpu.run({ body: this }, quantity))
        // if (window.selection.selected === this) {
        //   console.log(this.cpu.instructions)
        //   console.log(...this.cpu.stack.values)
        // }
      }
      //! NOTE
      // Here we can use a different model, where instead of sending each
      // chemical to a different node, all chemicals are sent to the same one.

      // quantity *= 0.95
      // if (quantity > 0.01) this.sendSignal(i, quantity)
    }

    this.operations = this.mergeOperations(this.operations)
    // if (window.selection.selected === this) {
    //   console.log(...this.operations)
    // }
    this.processOperations(this.operations, t, dt, quantity)
  }

  mergeOperations(ops) {
    let op
    const map = {}
    for (let i = ops.length - 1; i >= 0; i--) {
      op = ops[i]
      if (map[op.name]) continue
      map[op.name] = op
    }
    return Object.values(map)

    //! this strategy uses the merge method of the action; not sure if required
    //! TBD
    // const grouped = {}
    // for (const op of ops) {
    //   if (!grouped[op.name]) grouped[op.name] = []
    //   grouped[op.name].push(op)
    // }
    // const names = Object.keys(grouped)
    // const merged = Array(names.length)
    // for (let i = 0; i < names.length; i++) {
    //   merged[i] = Actions[names[i]].merge(grouped[names[i]])
    // }
    // return merged
  }

  processOperations(ops, t, dt, chemicalQuantity) {
    for (const op of ops) {
      if (
        // op.name === "forward" ||
        // op.name === "backward" ||
        op.name === "actuate" ||
        op.name === "fire" ||
        op.name === "grab" ||
        op.name === "eat"
      ) {
        this.actions[op.name].activate(t, dt, chemicalQuantity, op.values)
        this.energy -= 0.002
      }
    }
  }

  update(t, dt) {
    this.sensors.forEach((sensor) => sensor.update(t, dt))
    this.actionsArr.forEach((action) => action.apply(t, dt))

    this.vel.add(this.acc.mul(dt))
    this.vel.mul(1 - this.friction)

    let lenSq = this.vel.lenSq()
    if (lenSq > MAX_VELOCITY_SQ) {
      this.vel.mul(MAX_VELOCITY / sqrt(lenSq))
    }
    if (this.modifiers.length > 0) {
      this.modifiers.forEach((mod) => mod(this))
      this.modifiers.length = 0
    }
    this.acc.res()
    this.pos.add(this.vel.x * dt, this.vel.y * dt)
    this.clamp()

    if (this.springs.length === 0) {
      this.forwards.copy(this.vel).normalize()
    } else {
      let other, dE
      _v2b.set(0, 0)
      for (const spring of this.springs) {
        other = spring.bodyA === this ? spring.bodyB : spring.bodyA
        _v2a.copy(other.pos).sub(this.pos)
        _v2b.add(_v2a)

        dE = this.energy - other.energy
        if (dE > 0) {
          dE *= 0.1
          this.energy -= dE
          other.energy += dE
        }
      }
      _v2b.div(-this.springs.length).normalize()
      const At = _v2b.angle()
      const As = this.forwards.angle()
      this.forwards.fromAngle(lerp(As, angleForLerp(As, At), 0.05))
    }

    this.friction = lerp(this.friction, this.initial.friction, 0.1)

    if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
      debugger
    }
  }

  clamp() {
    if (this.pos.x < 0) {
      this.pos.x = 1 - mod(this.pos.x, 1)
      this.vel.x *= -1
    } else if (this.pos.x >= 1) {
      this.pos.x = 1 - mod(this.pos.x, 1)
      this.vel.x *= -1
    }

    if (this.pos.y < 0) {
      this.pos.y = 1 - mod(this.pos.y, 1)
      this.vel.y *= -1
    } else if (this.pos.y >= 1) {
      this.pos.y = 1 - mod(this.pos.y, 1)
      this.vel.y *= -1
    }
  }

  addFlag(flag) {
    this.flags |= flag
  }

  removeFlag(flag) {
    this.flags -= this.flags & flag
  }

  hasFlag(flag) {
    return !!(this.flags & flag)
  }
}

export function body(world, pos, rad, col) {
  return new Body(world, pos, rad, col)
}
