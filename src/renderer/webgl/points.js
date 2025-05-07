import { glu } from "../../utils/glu"
import pointsVS from "./shaders/points.vert.glsl"

export class PointsRenderer {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, fragment, getPoints) {
    let loc

    this.gl = gl
    this.getPoints = getPoints
    this.points = getPoints()
    this.program = glu.program(gl, pointsVS, fragment, {
      attributes: ["a_position", "a_properties", "a_geometry"],
    })

    const properties = new Float32Array(this.points.length * 4)
    this.propertiesBuffer = glu.dynamicBuffer(gl, properties, () => {
      for (let i = 0, body; i < this.points.length; i++) {
        body = this.points[i]
        properties[i * 4 + 0] = body.id
        properties[i * 4 + 1] = 0
        properties[i * 4 + 2] = 0
        properties[i * 4 + 3] = 0
      }
      return properties
    })
    this.propertiesBuffer.update()

    const geometry = new Float32Array(this.points.length * 4)
    this.geometryBuffer = glu.dynamicBuffer(gl, geometry, () => {
      for (let i = 0, body; i < this.points.length; i++) {
        body = this.points[i]
        geometry[i * 4 + 0] = body.pos.x
        geometry[i * 4 + 1] = body.pos.y
        geometry[i * 4 + 2] = body.radius
        geometry[i * 4 + 3] = body.initial.radius
      }
      return geometry
    })

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    loc = this.program.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, glu.quadBuffer(gl))
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    loc = this.program.attributes.a_properties
    gl.bindBuffer(gl.ARRAY_BUFFER, this.propertiesBuffer.buffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)

    loc = this.program.attributes.a_geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer.buffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)
  }

  render() {
    const { gl, program } = this

    this.geometryBuffer.update()

    gl.useProgram(program.program)
    gl.bindVertexArray(this.vao)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.points.length)
  }

  update() {
    this.points = this.getPoints()
    this.propertiesBuffer.update()
  }
}
