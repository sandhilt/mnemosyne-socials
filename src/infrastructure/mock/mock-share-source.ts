import type { ShareInput, ShareSource } from '#application/ports.ts'

export function createMockShareSource(shares: readonly ShareInput[]): ShareSource {
  return {
    async *read() {
      yield* shares
    },
  }
}
