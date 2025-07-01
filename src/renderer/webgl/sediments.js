import { glu } from "../../utils/glu"
import fullVS from "./shaders/full.vert.glsl"
import pointsVS from "./shaders/sediments/points.vert.glsl"
import pointsFS from "./shaders/sediments/points.frag.glsl"
import updateFS from "./shaders/sediments/update.frag.glsl"
import initSubstrateFS from "./shaders/sediments/init-substrate.frag.glsl"
import substrateFS from "./shaders/sediments/substrate.frag.glsl"
import { GaussianPass, initGaussianProgram } from "./gaussian"
import { EdgePass } from "./edge"
import { SharpenPass } from "./sharpen"
import { ViewPass } from "./view"
import { Params } from "../../parametric-space"
import { Globals } from "../../globals"
import { isMobileDevice } from "../../utils/device"

/**
 * The Sediments are tiny particles with very small interactions with the
 * environment, who create visual diversity. It's an agent-based simulation
 * where agents sampel their surroundings and try to avoid each other using
 * a substrate layer.
 *
 * The Sediments simulation runs on the whole environment, and cropped to the
 * viewbox. This ensures zooming / panning doesn't impact their behaviour.
 */
export class Sediments {
  /**
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, getInputs) {
    this.gl = gl
    this.getInputs = getInputs
    const { res, cellField, otherField, membraneOuter } = getInputs()
    this.res = res
    const res2 = (this.res2 = res.clone().div(2))
    this.texel = res.clone().inv()
    this.cellField = cellField
    this.otherField = otherField
    this.membraneOuter = membraneOuter

    const nbRoot = Params.sedimentNbAgents
    this.nbRoot = nbRoot
    this.nb = nbRoot ** 2

    // generate a grid of points, point coordinates are uv coordinates on the
    // simulation texture
    const uvs = new Float32Array(this.nb * 2)
    let i
    for (let x = 0; x < nbRoot; x++) {
      for (let y = 0; y < nbRoot; y++) {
        i = x + y * nbRoot
        uvs[i * 2 + 0] = (1 / nbRoot) * (x + 0.5)
        uvs[i * 2 + 1] = (1 / nbRoot) * (y + 0.5)
      }
    }
    const uvsBuffer = glu.buffer(gl, uvs)

    const sediments = new Float32Array(this.nb * 4)
    for (let x = 0; x < nbRoot; x++) {
      for (let y = 0; y < nbRoot; y++) {
        i = x + y * nbRoot
        sediments[i * 4 + 0] = (1 / nbRoot) * (x + 0.5)
        sediments[i * 4 + 1] = (1 / nbRoot) * (y + 0.5)
        sediments[i * 4 + 2] = i
      }
    }

    this.pingpong = glu.pingpong(gl, nbRoot, nbRoot, gl.RGBA32F, {
      data: sediments,
    })

    this.programs = {
      initSubstrate: glu.program(gl, fullVS, initSubstrateFS, {
        attributes: ["a_position"],
        uniforms: [],
        vao: (prog) => (u) => {
          u.attrib(prog.attributes.a_position, glu.quad(gl), 2)
        },
      }),
      draw: glu.program(gl, pointsVS, pointsFS, {
        attributes: ["a_position", "a_uv"],
        uniforms: ["u_agents"],
        vao: (prog) => (u) => {
          u.attrib(prog.attributes.a_uv, uvsBuffer, 2)
        },
      }),
      update: glu.program(gl, fullVS, updateFS, {
        attributes: ["a_position"],
        uniforms: [
          "u_agents",
          "u_time",
          "u_substrate",
          "u_texel",
          "u_distance_field",
        ],
        variables: {
          RND_MOVE_STRENGTH: Params.substrateAgentsRndMove.toFixed(8),
          MOVE_SPEED: Params.substrateAgentsMoveSpeed.toFixed(8),
        },
        vao: (prog) => (u) => {
          u.attrib(prog.attributes.a_position, glu.quad(gl), 2)
        },
      }),
      substrate: glu.program(gl, fullVS, substrateFS, {
        attributes: ["a_position"],
        uniforms: [
          "u_substrate",
          "u_agents",
          "u_membrane_outer",
          "u_cells",
          "u_other_cells",
          "u_time",
          "u_texel",
        ],
        variables: {
          RD_DIFF_RATE_B: Params.rdDiffRateB.toFixed(4),
          CELLS_SEPARATION: Params.cellsBgSeparation.toFixed(4),
          RD_EGGS: Params.rdEggsEffect.toFixed(4),
        },
        vao: (prog) => (u) => {
          u.attrib(prog.attributes.a_position, glu.quad(gl), 2)
        },
      }),
      gaussian: initGaussianProgram(gl, Params.rdGaussianFilterSize),
    }

    this.fullSedsRt = glu.renderTarget(gl, res.x, res.y, gl.R32F)
    this.substratePP = glu.pingpong(gl, res.x, res.y, gl.RGBA32F)

    this.viewPass = new ViewPass(gl, () => ({ res, tex: null }))

    this.edgePass1 = new EdgePass(gl, res, null)
    this.edgePass2 = new EdgePass(gl, res, this.edgePass1.output)
    this.gaussianPass = new GaussianPass(
      gl,
      () => ({ res, tex: this.edgePass2.output }),
      11
    )
    this.sharpenPass = new SharpenPass(gl, res, this.gaussianPass.output)

    this.programs.initSubstrate.use()
    glu.bindFB(gl, res.x, res.y, this.substratePP.back().fb)
    glu.draw.quad(gl)

    this.outputs = {
      pre: this.substratePP.back().tex,
      post: this.sharpenPass.output,
    }
  }

  onResize() {
    const inputs = this.getInputs()
    this.membraneOuter = inputs.membraneOuter
    this.viewPass.onResize()
  }

  render(time) {
    const { gl, res, programs, pingpong, substratePP, nbRoot, texel } = this

    pingpong.swap()
    glu.bindFB(gl, nbRoot, nbRoot, pingpong.back().fb)
    programs.update.use()
    glu.uniformTex(gl, programs.update.uniforms.u_agents, pingpong.front().tex)
    glu.uniformTex(
      gl,
      programs.update.uniforms.u_substrate,
      substratePP.back().tex,
      1
    )
    glu.uniformTex(
      gl,
      programs.update.uniforms.u_distance_field,
      this.cellField,
      2
    )
    gl.uniform1f(programs.update.uniforms.u_time, time * 0.001)
    gl.uniform2f(programs.update.uniforms.u_texel, texel.x, texel.y)
    glu.draw.quad(gl)

    glu.bindFB(gl, res.x, res.y, this.fullSedsRt.fb)
    if (Globals.supports.floatBlend) glu.blend(gl, gl.ONE, gl.ONE)
    programs.draw.use()
    glu.uniformTex(gl, programs.draw.uniforms.u_agents, pingpong.back().tex)
    gl.drawArrays(gl.POINTS, 0, this.nb)
    glu.blend(gl, null)

    const rdSteps = isMobileDevice() || $fx.context === "fast-capture" ? 1 : 8
    for (let i = 0; i < rdSteps; i++) {
      substratePP.swap()
      glu.bindFB(gl, res.x, res.y, substratePP.back().fb)
      programs.substrate.use()
      glu.uniformTex(
        gl,
        programs.substrate.uniforms.u_substrate,
        substratePP.front().tex,
        0
      )
      glu.uniformTex(
        gl,
        programs.substrate.uniforms.u_agents,
        this.fullSedsRt.tex,
        1
      )
      glu.uniformTex(
        gl,
        programs.substrate.uniforms.u_membrane_outer,
        this.membraneOuter,
        2
      )
      glu.uniformTex(gl, programs.substrate.uniforms.u_cells, this.cellField, 3)
      glu.uniformTex(
        gl,
        programs.substrate.uniforms.u_other_cells,
        this.otherField,
        4
      )
      gl.uniform1f(programs.substrate.uniforms.u_time, time * 0.001)
      gl.uniform2f(programs.substrate.uniforms.u_texel, texel.x, texel.y)
      glu.draw.quad(gl)

      // blur substrate horizontally
      substratePP.swap()
      glu.bindFB(gl, res.x, res.y, substratePP.back().fb)
      programs.gaussian.use()
      glu.uniformTex(
        gl,
        programs.gaussian.uniforms.u_texture,
        substratePP.front().tex
      )
      gl.uniform2f(programs.gaussian.uniforms.u_dir, this.texel.x, 0)
      glu.draw.quad(gl)

      // blur substrate vertically
      substratePP.swap()
      glu.bindFB(gl, res.x, res.y, substratePP.back().fb)
      glu.uniformTex(
        gl,
        programs.gaussian.uniforms.u_texture,
        substratePP.front().tex
      )
      gl.uniform2f(programs.gaussian.uniforms.u_dir, 0, this.texel.y)
      glu.draw.quad(gl)
    }

    //
    // Render on view, post-processing for cool-looking effect
    //
    this.viewPass.render(substratePP.back().tex)

    //
    // Post-processing effects for a cool look
    //
    this.edgePass1.render(this.viewPass.output)
    this.edgePass2.render()
    this.gaussianPass.render()
    this.sharpenPass.render()

    this.outputs.pre = substratePP.back().tex
  }
}
