/**
 * Whether the code runs in a production build.
 *
 * Bundlers replace the literal `process.env.NODE_ENV` at build time. Where `process`
 * does not exist (a browser dev server) the lookup throws, and that is treated as
 * development so mistakes surface loudly while building an application.
 */
export function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
}
