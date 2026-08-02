/**
 * Express types `req.query` values as `string | string[] | ParsedQs | ParsedQs[] | undefined`
 * because repeated query params (e.g. `?q=a&q=b`) are legal and produce an array at runtime.
 * Casting a query value straight to `string` with `as` overrides that union instead of
 * checking it, and survives a strict `tsc` build even though the value can be an array.
 *
 * Use this helper anywhere a query param is expected to be exactly one string. A duplicated
 * param (array) or a nested param (`?q[x]=y`, parsed as an object) is deliberately treated as
 * invalid rather than silently resolved to "the first one" - the caller sent something the
 * endpoint doesn't support, and picking a value on their behalf would hide that. Callers should
 * respond with a 400 when this returns `undefined` instead of passing the raw value on and
 * crashing downstream (e.g. `['a','b'].toLowerCase is not a function`).
 */
export function singleQueryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
