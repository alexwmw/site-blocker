type PlainObject = Record<string, unknown>;
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends PlainObject ? DeepPartial<T[K]> : T[K];
};

const isPlainObject = (v: unknown): v is PlainObject => typeof v === 'object' && v !== null && !Array.isArray(v);

export function deepMerge<T extends PlainObject>(target: T, source: DeepPartial<T>): T {
  const output: PlainObject = { ...target };
  const sourceObj = source as PlainObject;

  for (const key of Object.keys(sourceObj)) {
    const src = sourceObj[key];
    const dst = output[key];

    output[key] = isPlainObject(dst) && isPlainObject(src) ? deepMerge(dst, src) : src;
  }

  return output as T;
}
