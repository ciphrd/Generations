import { glu } from "../../utils/glu"
import { vec2 } from "../../utils/vec"
import { Renderer } from "../renderer"
import simplex from "./shaders/lib/simplex.glsl"
import fullVS from "./shaders/full.vert.glsl"
import quadVS from "./shaders/quad.vert.glsl"
import testFS from "./shaders/test.frag.glsl"
import liaisonVS from "./shaders/liaison.vert.glsl"
import liaisonFS from "./shaders/liaison.frag.glsl"
import liaisonTempFS from "./shaders/liaison-temp.frag.glsl"
import bacteriasFS from "./shaders/bacterias.frag.glsl"
import foodFS from "./shaders/food.frag.glsl"
import compFS from "./shaders/composition.frag.glsl"
import { PointsRenderer } from "./points"
import { LiaisonsRenderer } from "./liaisons"
import { Spring, SpringFlags } from "../../physics/constraints/spring"

const W = 800
const H = 800
const tW = W * devicePixelRatio
const tH = H * devicePixelRatio

/**
 * todo.
 *
 * (x) initial webgl setup
 * ( ) render cells & springs
 *   ( ) optimized pipeline for instancing
 *   ( ) instanced rendering of cells
 *   ( ) instanced rendering of springs
 * ( ) Have a single buffer with all the body positions
 *   ( ) Pass the buffer as a uniform, use sections of this buffer to render
 *       different bodies with different shaders ?
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

    this.gl.getExtension("EXT_color_buffer_float")
    this.gl.getExtension("EXT_float_blend")
    this.gl.getExtension("OES_texture_float_linear")

    glu.libs({
      simplex,
    })

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

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
    gl.viewport(0, 0, tW, tH)
    gl.clearColor(0, 0, 0, 0)
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

    this.bacterias.render()
    this.food.render()
    this.bindLiaisons.render()

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, tW, tH)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.disable(gl.BLEND)

    gl.useProgram(this.programs.comp.program)
    gl.bindVertexArray(this.compVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.target)
    gl.uniform1i(this.programs.comp.uniforms.u_texture, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
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

    this.programs = {
      quadTest: glu.program(gl, quadVS, testFS, {
        attributes: ["a_position"],
        uniforms: ["u_points"],
        variables: {
          NUM_POINTS: nb,
        },
      }),
      liaisons: glu.program(gl, liaisonVS, liaisonFS, {
        attributes: ["a_position", "a_endpoints"],
        uniforms: ["u_points"],
        variables: {
          NUM_POINTS: nb,
        },
      }),
      comp: glu.program(gl, fullVS, compFS, {
        attributes: ["a_position"],
        uniforms: ["u_texture"],
      }),
    }

    const quadBuffer = glu.quadBuffer(gl)

    loc = this.programs.quadTest.attributes.a_position
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const liaisonBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, liaisonBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, liaisonIndices, gl.STATIC_DRAW)

    loc = this.programs.liaisons.attributes.a_endpoints
    this.liaisonVao = gl.createVertexArray()
    gl.bindVertexArray(this.liaisonVao)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribIPointer(loc, 2, gl.UNSIGNED_SHORT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)
    loc = this.programs.liaisons.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.bacterias = new PointsRenderer(gl, bacteriasFS, () => world.bacterias)
    this.food = new PointsRenderer(gl, foodFS, () => world.food)
    this.bindLiaisons = new LiaisonsRenderer(gl, world, liaisonTempFS, () =>
      world.constraints.pre.filter(
        (cons) => cons instanceof Spring && cons.hasFlag(SpringFlags.BIND)
      )
    )

    this.target = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.target)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      tW,
      tH,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.target,
      0
    )

    this.compVao = gl.createVertexArray()
    gl.bindVertexArray(this.compVao)
    loc = this.programs.comp.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    world.emitter.on("bodies:updated", () => {
      this.bacterias.update()
      this.food.update()
      this.bindLiaisons.update()
    })
    world.emitter.on("constraints:updated", () => {
      this.bindLiaisons.update()
    })
  }
}
