import { arr } from "../../utils/array"
import { glu } from "../../utils/glu"
import liaisonVS from "./shaders/liaison.vert.glsl"

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

    this.points = world.bodies
    this.program = glu.program(gl, liaisonVS, fragment, {
      attributes: ["a_position", "a_endpoints"],
      uniforms: ["u_points"],
      variables: {
        NUM_POINTS: this.points.length,
      },
    })

    this.pointsBuffer = new Float32Array(this.points.length * 2)

    this.endpointsIndices = new Uint16Array(MAX_LIAISONS * 2)
    this.endpointsBuffer = glu.dynamicBuffer(gl, this.endpointsIndices, () => {
      for (let i = 0, spr; i < this.liaisons.length; i++) {
        spr = this.liaisons[i]
        this.endpointsIndices[i * 2 + 0] = this.pointsMap[spr.bodyA.id]
        this.endpointsIndices[i * 2 + 1] = this.pointsMap[spr.bodyB.id]
      }
      return this.endpointsIndices
    })

    this.allocate()

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    loc = this.program.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, glu.quadBuffer(gl))
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    loc = this.program.attributes.a_endpoints
    gl.bindBuffer(gl.ARRAY_BUFFER, this.endpointsBuffer.buffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribIPointer(loc, 2, gl.UNSIGNED_SHORT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)
  }

  render() {
    const { gl, program } = this

    if (this.needsUpdate) {
      this.allocate()
    }

    for (let i = 0, body; i < this.points.length; i++) {
      body = this.points[i]
      this.pointsBuffer[i * 2 + 0] = body.pos.x
      this.pointsBuffer[i * 2 + 1] = body.pos.y
    }

    // console.log(this.pointsBuffer)

    gl.useProgram(program.program)
    gl.bindVertexArray(this.vao)
    gl.uniform2fv(this.program.uniforms.u_points, this.pointsBuffer)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.liaisons.length)
  }

  allocate() {
    this.points = this.world.bodies
    this.pointsMap = Object.fromEntries(
      this.points.map((body, i) => [body.id, i])
    )
    this.liaisons = this.getLiaisons()
    this.endpointsBuffer.update()
    this.needsUpdate = false
  }

  update() {
    this.needsUpdate = true
  }
}
