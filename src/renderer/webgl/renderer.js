import { glu } from "../../utils/glu"
import { vec2 } from "../../utils/vec"
import { Renderer } from "../renderer"
import quadVS from "./shaders/quad.vert.glsl"
import testFS from "./shaders/test.frag.glsl"
import liaisonVS from "./shaders/liaison.vert.glsl"
import liaisonFS from "./shaders/liaison.frag.glsl"

const W = 800
const H = 800
const tW = W * devicePixelRatio
const tH = H * devicePixelRatio

/**
 * todo.
 *
 * ( ) initial webgl setup
 * ( ) render cells & springs
 *   ( ) optimized pipeline for instancing
 *   ( ) instanced rendering of cells
 *   ( ) instanced rendering of springs
 * ( ) render other bodies
 * ( ) optimized updates (new springs, bodies, etc...)
 * ( ) shading of cells/springs
 * ( ) add details to environment
 *   ( ) agent-based simulation for dust-noise pattern, influenced by the
 *       the motion of bodies in the space
 *   ( ) various patterns to add texture, controllable via parameters
 */

export class WebGLRenderer extends Renderer {
  constructor(world, selection) {
    super(world, selection)

    this.cvs = document.createElement("canvas")
    this.cvs.width = tW
    this.cvs.height = tH
    this.cvs.style.width = W + "px"
    this.cvs.style.height = H + "px"

    this.gl = this.cvs.getContext("webgl2")
    this.texel = vec2(1 / this.cvs.width, 1 / this.cvs.height)

    this.prepare()
  }

  providerRenderingContainer($container) {
    super.providerRenderingContainer($container)
    $container.appendChild(this.cvs)
  }

  render() {
    const { gl, world } = this
    const { organisms, liaisons } = world
    const nb = organisms.length

    gl.viewport(0, 0, tW, tH)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    for (let i = 0; i < nb; i++) {
      this.organisms[i * 2 + 0] = organisms[i].pos.x
      this.organisms[i * 2 + 1] = organisms[i].pos.y
    }

    gl.useProgram(this.programs.quadTest.program)
    gl.bindVertexArray(this.vao)
    gl.uniform2fv(this.programs.quadTest.uniforms.u_points, this.organisms)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    gl.useProgram(this.programs.liaisons.program)
    gl.bindVertexArray(this.liaisonVao)
    gl.uniform2fv(this.programs.liaisons.uniforms.u_points, this.organisms)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)
  }

  prepare() {
    let loc
    const { gl, world } = this
    const { organisms, liaisons } = world

    const nb = organisms.length
    this.organisms = new Float32Array(nb * 2)

    const nbLiaisons = liaisons.length
    const liaisonIndices = new Uint16Array(nbLiaisons * 2)
    for (let i = 0; i < nbLiaisons; i++) {
      liaisonIndices[i * 2 + 0] = organisms.indexOf(liaisons[i].bodyA)
      liaisonIndices[i * 2 + 1] = organisms.indexOf(liaisons[i].bodyB)
    }

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])

    this.programs = {
      quadTest: glu.program(
        gl,
        quadVS,
        testFS,
        {
          NUM_POINTS: nb,
        },
        {
          attributes: ["a_position"],
          uniforms: ["u_points"],
        }
      ),
      liaisons: glu.program(
        gl,
        liaisonVS,
        liaisonFS,
        {
          NUM_POINTS: nb,
        },
        {
          attributes: ["a_position", "a_endpoints"],
          uniforms: ["u_points"],
        }
      ),
    }

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)

    loc = this.programs.quadTest.attributes.a_position
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const liaisonBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, liaisonBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, liaisonIndices, gl.STATIC_DRAW)

    console.log("----------------- LIAISONS")
    console.log("vertex")
    console.log(liaisonVS)
    console.log("fragment")
    console.log(liaisonFS)

    console.log("pos:")
    console.log(
      gl.getAttribLocation(this.programs.liaisons.program, "a_position"),
      gl.getAttribLocation(this.programs.liaisons.program, "a_endpoints")
    )

    loc = this.programs.liaisons.attributes.a_endpoints
    this.liaisonVao = gl.createVertexArray()
    gl.bindVertexArray(this.liaisonVao)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribIPointer(loc, 2, gl.UNSIGNED_SHORT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)
    loc = this.programs.liaisons.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  }
}
