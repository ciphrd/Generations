export class Renderer {
  constructor(world, selection) {
    this.world = world
    this.selection = selection
    this.$container = null
  }

  providerRenderingContainer($container) {
    this.$container = $container
  }

  render() {}
}
