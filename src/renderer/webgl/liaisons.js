import { Params } from "../../parametric-space"
import { settings } from "../../settings"
import { arr } from "../../utils/array"
import { glu } from "../../utils/glu"
import liaisonVS from "./shaders/liaison.vert.glsl"
import { viewUniform } from "./view"

const MAX_LIAISONS = 256

export class LiaisonsRenderer {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, world, fragment, getLiaisons, { fixedWidth = false } = {}) {
    let loc

    this.gl = gl
    this.world = world
    this.getLiaisons = getLiaisons
    this.liaisons = getLiaisons()
    this.needsUpdate = false

    this.buffers = {
      geos: new Float32Array(MAX_LIAISONS * 8),
      col: new Float32Array(MAX_LIAISONS * 3),
    }

    this.glBuffers = {
      geos: glu.dynamicBuffer(gl, this.buffers.geos, () => {
        let bodyA, bodyB
        for (let i = 0; i < this.liaisons.length; i++) {
          bodyA = this.liaisons[i].bodyA
          bodyB = this.liaisons[i].bodyB
          this.buffers.geos[i * 8 + 0] = bodyA.pos.x
          this.buffers.geos[i * 8 + 1] = bodyA.pos.y
          this.buffers.geos[i * 8 + 2] = fixedWidth || bodyA.radius
          this.buffers.geos[i * 8 + 3] = bodyA.id
          this.buffers.geos[i * 8 + 4] = bodyB.pos.x
          this.buffers.geos[i * 8 + 5] = bodyB.pos.y
          this.buffers.geos[i * 8 + 6] = fixedWidth || bodyB.radius
          this.buffers.geos[i * 8 + 7] = bodyB.id
        }
        return this.buffers.geos
      }),
      col: glu.dynamicBuffer(gl, this.buffers.col, () => {
        let liaison
        for (let i = 0; i < this.liaisons.length; i++) {
          liaison = this.liaisons[i]
          this.buffers.col[i * 3 + 0] = liaison.color.r / 255
          this.buffers.col[i * 3 + 1] = liaison.color.g / 255
          this.buffers.col[i * 3 + 2] = liaison.color.b / 255
        }
        return this.buffers.col
      }),
    }

    this.program = glu.program(gl, liaisonVS, fragment, {
      attributes: ["a_position", "a_geometries", "a_color"],
      uniforms: ["u_view"],
      variables: {
        CELL_SCALE: Params.cellsScale.toFixed(4),
      },
      vao: (prg) => (u) => {
        u.attrib(prg.attributes.a_position, glu.quad(gl), 2, gl.FLOAT)
        u.matAttrib(
          prg.attributes.a_geometries,
          this.glBuffers.geos.buffer,
          2,
          4,
          gl.FLOAT,
          true
        )
        u.attrib(
          prg.attributes.a_color,
          this.glBuffers.col.buffer,
          3,
          gl.FLOAT,
          true
        )
      },
    })

    this.allocate()
  }

  render() {
    const { gl, program } = this

    if (this.needsUpdate) this.allocate()
    this.glBuffers.geos.update()

    program.use()
    viewUniform(gl, program)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.liaisons.length)
  }

  allocate() {
    this.liaisons = this.getLiaisons()
    this.glBuffers.col.update()
    this.needsUpdate = false
  }

  update() {
    this.needsUpdate = true
  }
}
