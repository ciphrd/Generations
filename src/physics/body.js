import { vec2 } from "../utils/vec"
import { angleForLerp, clamp, lerp, mod } from "../utils/math"
import { Token } from "../network/token"
import { rnd } from "../utils/rnd"
import { CPU, mergeOperations } from "../bytecode/cpu"
import { ActivationBytecode } from "../bytecode/activation"
import { Actions } from "./actions"
import { Entity } from "./entity"
import { settings } from "../settings"

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
    color = settings.cells.default.color.clone()
  ) {
    super()
    this.world = world
    this.id = c++
    this.energy = 1
    this.radius = radius
    this.color = color
    this.pos = pos
    this.vel = vec2()
    this.acc = vec2()
    this.forwards = vec2().fromAngle(rnd.range(0, TAU))
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

  prepare() {
    let tmp = this.signals
    this.signals = this.receivedSignals
    this.receivedSignals = tmp.fill(0)
  }

  receiveSignal(chemical, quantity, source) {
    // if (selection.is(this)) {
    //   console.log("receive", { chemical, quantity, source })
    // }

    //! multiply signals
    // if (this.receivedSignals[chemical] === null) {
    //   this.receivedSignals[chemical] = quantity
    // } else {
    //   if (quantity !== 0) {
    //     this.receivedSignals[chemical] *= quantity
    //   }
    // }

    //! add signals
    // this.receivedSignals[chemical] = clamp(
    //   this.receivedSignals[chemical] + quantity,
    //   -1,
    //   1
    // )

    //! keep signal with highest intensity
    if (abs(quantity) > abs(this.receivedSignals[chemical])) {
      this.receivedSignals[chemical] = clamp(quantity, -1, 1)
    }
  }

  sendSignal(chemical, quantity) {
    // if (chemical === 0) {
    //   console.log(`body:${this.id}`, "send", { quantity })
    // }

    const N = this.springs.length
    if (N === 0) return
    for (const spring of this.springs) {
      //! Note: this was used when signals were added to each other
      //! It's not so relevant if the max() is kept instead
      // spring.sendSignal(this, chemical, quantity / (log(pow(N, 0.5)) + 1))

      spring.sendSignal(this, chemical, quantity)
    }
  }

  processSignals(t, dt) {
    this.operations.length = 0

    // if (selection.is(this)) {
    //   console.log([...this.signals])
    // }

    let quantity
    for (let i = 0; i < 4; i++) {
      quantity = this.signals[i]
      this.cpus[i].prepare()
      this.operations.push(
        ...this.cpus[i].run(
          { body: this, chemicalStrength: quantity },
          quantity
        )
      )
    }

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
        this.actions[op.name].activate(t, dt, op.chemicalStrength, op.values)
        this.energy -= 0.00001
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
      this.forwards.set(1, 0)
    } else {
      let other, dE
      _v2b.set(0, 0)
      for (let i = 0, spring; i < this.springs.length; i++) {
        spring = this.springs[i]
        other = spring.bodyA === this ? spring.bodyB : spring.bodyA
        _v2a.copy(other.pos).sub(this.pos)
        _v2b.add(_v2a)

        dE = this.energy - other.energy
        if (dE > 0) {
          dE *= 0.1
          this.energy -= dE
          other.energy += dE
        }

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
  }
}

export function body(world, pos, rad, friction, col) {
  return new Body(world, pos, rad, friction, col)
}
