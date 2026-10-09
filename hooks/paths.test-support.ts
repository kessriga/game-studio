/**
 * Test fixtures compare paths the engine hands to mocked file calls. The
 * engine may resolve the test's `/game` root to a platform path first, so
 * fixtures compare after dropping backslashes and a drive prefix.
 */
export function fixturePath(path: string | undefined): string {
  return (path ?? "").replace(/\\/g, "/").replace(/^[A-Za-z]:/, "");
}
