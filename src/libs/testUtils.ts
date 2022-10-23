export const expectError = (
  maybeError: unknown,
  expectedErrorMessage: string
): void => {
  if (maybeError instanceof Error) {
    return expect(maybeError.message).toContain(expectedErrorMessage)
  } else {
    throw new Error(`Expected error, got ${maybeError}`)
  }
}
