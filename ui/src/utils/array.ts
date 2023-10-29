/* Identity function.
Given an object, it returns the "identity" of that object -
which can be 'id' field of the object, or the 'name' or
even the object.
Here are some examples of identity functions:

  1. (x) => x.id
  2. (n) => n.title
  3. (val) => val
*/
type IDFunc = (val: any) => any;


type SubtractArgs<T> = {
  arr1: T[];
  arr2: T[];
  idf?: IDFunc;
}

/**
  Returns = arr1 - arr2

  Example:

    arr1 = [a1, a2, a3, a4]
    arr2 = [a1, a2]
    result = [a3, a4]

    Elements in array are identified by return value
    of identity function.
*/
function subtract<T>({
  arr1,
  arr2,
  idf
}: SubtractArgs<T>): T[] {

  if (!idf) {
    idf = (x) => x;
  }

  const source_ids = arr2.map(i => idf!(i));
  let result = arr1.filter(n => source_ids.indexOf(idf!(n)) < 0);

  return result;
}


function uniq_concat<T extends {id: string}>(
  arr1: T[],
  arr2: T[]
): T[] {
  /**
   * Concatinates two arrays - duplicate elements are discarded.
   *
   * result = arr1 + arr2
   *
   * Example:
   *
   * arr1 = [a1, a2, a3]
   * arr2 = [a3, a4]
   * result = [a1, a2, a3, a4]
   */
  const source_ids = arr2.map(i => i.id);
  const no_dupl_arr1 = arr1.filter(n => source_ids.indexOf(n.id) < 0);

  return no_dupl_arr1.concat(arr2);
}


function overlap<T extends {id: string}>(
  arr1: T[],
  arr2: T[]
): boolean {
  /* Returns True only if two arrays overlap */

  const set1_ids = new Set(arr1.map(i => i.id));
  const set2_ids = new Set(arr2.map(i => i.id));
  const intersection = [...set1_ids].filter(
    (x) => set2_ids.has(x)
  );

  return intersection.length  > 0;
}

interface Args<T> {
  container: T[];
  items: T[];
}

function contains_every<T = string>({container, items}: Args<T>): boolean {
  // Returns true if every item is included in the container
  // Returns false if some items are not included in the container
  return items.every((i) => container.includes(i));
}


function uniq<T = string>(arr: T[]): T[] {
  return [...new Set(arr)];
}


export {uniq, uniq_concat, subtract, overlap, contains_every}
