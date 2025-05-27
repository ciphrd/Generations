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
  constructor(gl, world, fragment, getLiaisons) {
    let loc

    this.gl = gl
    this.world = world
    this.getLiaisons = getLiaisons
    this.liaisons = getLiaisons()
    this.needsUpdate = false

    this.buffers = {
      geos: new Float32Array(MAX_LIAISONS * 8),
      cols: new Float32Array(MAX_LIAISONS * 6),
    }

    this.glBuffers = {
      geos: glu.dynamicBuffer(gl, this.buffers.geos, () => {
        let bodyA, bodyB
        for (let i = 0; i < this.liaisons.length; i++) {
          bodyA = this.liaisons[i].bodyA
          bodyB = this.liaisons[i].bodyB
          this.buffers.geos[i * 8 + 0] = bodyA.pos.x
          this.buffers.geos[i * 8 + 1] = bodyA.pos.y
          this.buffers.geos[i * 8 + 2] = bodyA.radius
          this.buffers.geos[i * 8 + 3] = bodyA.id
          this.buffers.geos[i * 8 + 4] = bodyB.pos.x
          this.buffers.geos[i * 8 + 5] = bodyB.pos.y
          this.buffers.geos[i * 8 + 6] = bodyB.radius
          this.buffers.geos[i * 8 + 7] = bodyB.id
        }
        return this.buffers.geos
      }),
      cols: glu.dynamicBuffer(gl, this.buffers.cols, () => {
        let bodyA, bodyB
        for (let i = 0; i < this.liaisons.length; i++) {
          bodyA = this.liaisons[i].bodyA
          bodyB = this.liaisons[i].bodyB
          this.buffers.cols[i * 6 + 0] = bodyA.color.r / 255
          this.buffers.cols[i * 6 + 1] = bodyA.color.g / 255
          this.buffers.cols[i * 6 + 2] = bodyA.color.b / 255
          this.buffers.cols[i * 6 + 3] = bodyB.color.r / 255
          this.buffers.cols[i * 6 + 4] = bodyB.color.g / 255
          this.buffers.cols[i * 6 + 5] = bodyB.color.b / 255
        }
        return this.buffers.cols
      }),
    }

    console.log({ liaisonVS, fragment })

    this.program = glu.program(gl, liaisonVS, fragment, {
      attributes: ["a_position", "a_geometries", "a_colors"],
      uniforms: ["u_view"],
      variables: {
        CELL_SCALE: settings.rendering.cell.scale,
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
        u.matAttrib(
          prg.attributes.a_colors,
          this.glBuffers.cols.buffer,
          2,
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
    this.glBuffers.cols.update()
    this.needsUpdate = false
  }

  update() {
    this.needsUpdate = true
  }
}
