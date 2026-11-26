export type ShareRejection = 'invalid-url' | 'same-person'

export class InvalidShareError extends Error {
  readonly #reason: ShareRejection

  constructor(reason: ShareRejection) {
    super(reason)
    this.name = 'InvalidShareError'
    this.#reason = reason
  }

  get reason(): ShareRejection { return this.#reason }
}
