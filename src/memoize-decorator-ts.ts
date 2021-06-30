// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

// Thanks a lot to https://github.com/alexjoverm/typescript-library-starter

/**
 *
 */


interface DecoratorFunction<TTarget = any> {
  (
    target: TTarget,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void;
}

export interface MemoizeCache<T = any> {
  get(key: string): T;
  set(key: string, value: T): void;
  clear(): void;
}

export interface MemoizeCacheFactory<T> {
  (
    target?: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ): MemoizeCache<T>;
}

export interface MemoizeHash {
  // Add generic parametrization
  (args: any[]): string;
}

export interface MemoizeOptions<TResult = any, TFunctionId = any> {
  cacheFactory: MemoizeCacheFactory<MemoizeCacheItem<TResult>>
  hash: MemoizeHash;
  ttl: number;
  size: number;
  clearOnTimer: boolean;
  // TODO: Add function Id to sahre cache instances across functions
  // functionId: (descriptor) => string;
}

// TODO: Add generic params
export const InMemoryCacheFactory = () => new Map();
export const JSONhash = JSON.stringify;

export const defaultOptions: MemoizeOptions = {
  cacheFactory: InMemoryCacheFactory,
  hash: JSONhash,
  ttl: Infinity,
  size: Infinity,
  clearOnTimer: false,
}

const regisrty = new Map<Function, MemoizeCache<MemoizeCacheItem>>()

interface MemoizeCacheItem<TResult = any> {
  timestamp: number;
  result: TResult;
}

function memoize(func: Function, {cacheFactory, hash, ttl}: MemoizeOptions) {
  const cache = cacheFactory();
  regisrty.set(func, cache);
  return (...params: unknown[]) => {
    const paramsHash = hash(params);
    const cached = cache.get(paramsHash);
    if(cached && Date.now() - cached.timestamp < ttl) {
      return cached.result;
    }
    const result = func(...params);
    cache.set(paramsHash, {
      timestamp: Date.now(),
      result: result,
    });
    return result;
  };
}


export default function Memoize(): DecoratorFunction;
/**
 *
 * @param hash
 */
export default function Memoize(hash: MemoizeHash): DecoratorFunction;
// TODO: Maybe add generic params for this overload
/**
 *
 * @param options
 */
export default function Memoize(options: Partial<MemoizeOptions>): DecoratorFunction;
export default function Memoize(optionsOrHash?: Partial<MemoizeOptions> | MemoizeHash) {

  const inputOptions: Partial<MemoizeOptions> = (typeof optionsOrHash !== 'function'
    ? optionsOrHash
    : { hash: optionsOrHash }) || {};

  const options = {
    ...defaultOptions,
    ...inputOptions,
  };


  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    if (descriptor?.value) {
      // A case of a get accessor
      descriptor.value = memoize(
        descriptor.value as Function,
        options,
      ) as any;
    } else if (descriptor?.get) {
      // In case of a method
      descriptor.get = memoize(
        descriptor.get as Function,
        options,
        );
    } else {
      throw 'Only put a Memoize() decorator on a method or get accessor.';
    }
  }
}

export function clear(): void;
export function clear(target: any): void;
export function clear(target?: any) {
  if (!target) {
    regisrty.clear()
  } else {
    regisrty.get(target)?.clear();
  }
}


let i = 0;

class Some {
  @Memoize({
    ttl: 100
  })
  power(a: number, b: number) {
    i++;
    return a ** b;
  }
}

const some = new Some();

console.log(some.power(3,2), i);
console.log(some.power(3,2), i);
console.log(some.power(3,2), i);
console.log(some.power(4,3), i);
console.log(some.power(4,3), i);
setTimeout(() => console.log(some.power(1,3), i), 200);

