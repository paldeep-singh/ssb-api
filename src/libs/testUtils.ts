export const expectError = (
  maybeError: unknown,
  expectedErrorMessage: string
) => {
  if (maybeError instanceof Error) {
    return expect(maybeError.message).toContain(expectedErrorMessage);
  } else {
    throw new Error(`Expected error, got ${maybeError}`);
  }
};
