export class Entity {
  constructor() {
    this.flags = 0
  }

  addFlag(flag) {
    this.flags |= flag
  }

  removeFlag(flag) {
    this.flags -= this.flags & flag
  }

  hasFlag(flag) {
    return !!(this.flags & flag)
  }
}
