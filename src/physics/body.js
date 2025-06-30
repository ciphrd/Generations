import { vec2 } from "../utils/vec"
import { clamp, lerp, mod } from "../utils/math"
import { CPU, mergeOperations } from "../bytecode/cpu"
import { ActivationBytecode } from "../bytecode/activation"
import { Actions } from "./actions"
import { Entity } from "./entity"
import { arr } from "../utils/array"
import { Params } from "../parametric-space"

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
  BINDABLE: 2 ** 6,
  BACTERIA: 2 ** 7,
}

const MAX_VELOCITY = 0.2
const MAX_VELOCITY_SQ = MAX_VELOCITY ** 2

export class Body extends Entity {
  constructor(
    world,
    pos,
    radius,
    friction = 0,
    color = Params.cellsDefaultColor.clone()
  ) {
    super()
    this.world = world
    this.id = c++
    this.radius = radius
    this.color = color
    this.pos = pos
    this.vel = vec2()
    this.acc = vec2()
    this.forwards = vec2().fromAngle(this.id)
    this.data = {
      clusterGroup: -1,
      organism: -1,
    }
    this.initial = {
      friction,
      radius,
    }
    this.springs = []
    this.modifiers = []
    this.friction = friction
    this.receivedSignal = 0
    this.signal = 0
    this.emittedSignal = 0
    this.operations = []
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
    this.cpu = new CPU(dna[1], ActivationBytecode)
  }

  prepare() {
    this.signal = this.receivedSignal
    this.receivedSignal = 0
  }

  receiveSignal(energy, source) {
    if (abs(energy) > abs(this.receivedSignal)) {
      this.receivedSignal = clamp(energy, -1, 1)
    }
  }

  sendSignal(energy) {
    if (this.springs.length === 0) return
    for (const spring of this.springs) {
      spring.sendSignal(this, energy)
    }
  }

  processSignals(t, dt) {
    this.cpu.prepare()
    this.operations = this.cpu.run(
      { body: this, chemicalStrength: this.signal },
      this.signal
    )

    this.operations = mergeOperations(this.operations)
    this.processOperations(this.operations, t, dt)
  }

  processOperations(ops, t, dt) {
    for (const op of ops) {
      if (
        op.name === "forward" ||
        op.name === "backward" ||
        op.name === "actuate" ||
        op.name === "fire" ||
        op.name === "grab" ||
        op.name === "bind" ||
        op.name === "eat"
      ) {
        this.actions[op.name].activate(t, dt, op.energy)
      }
    }

    // opti: for fast access of emitted signals data
    const fireOps = ops.filter((op) => op.name === "fire")
    this.emittedSignal = fireOps.length > 0 ? fireOps.at(-1).energy : 0
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

    if (this.springs.length === 0) {
      this.forwards.set(1, 0)
    } else {
      let other
      _v2b.set(0, 0)
      for (let i = 0, spring; i < this.springs.length; i++) {
        spring = this.springs[i]
        other = spring.bodyA === this ? spring.bodyB : spring.bodyA
        _v2a.copy(other.pos).sub(this.pos)
        _v2b.add(_v2a)

        if (i === 0) {
          this.forwards.copy(_v2a).normalize()
        }
      }
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
      this.pos.x = 0.9999 - mod(this.pos.x, 1)
      this.vel.x *= -1
    }

    if (this.pos.y < 0) {
      this.pos.y = 1 - mod(this.pos.y, 1)
      this.vel.y *= -1
    } else if (this.pos.y >= 1) {
      this.pos.y = 0.9999 - mod(this.pos.y, 1)
      this.vel.y *= -1
    }

    this.pos.apply((x) => clamp(x, 0, 0.999))
  }
}
