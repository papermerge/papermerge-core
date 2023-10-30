/**
  Returns = arr1 - arr2

  Example:

    arr1 = [a1, a2, a3, a4]
    arr2 = [a1, a2]
    result = [a3, a4]

    Elements in array are identified by return value
    of identity function.
*/
function subtract<T>(
  arr1: T[],
  arr2: T[],
  idf?: (val: T) => any
): T[] {

  if (!idf) {
    idf = (x: T): T => x;
  }

  const source_ids = arr2.map(i => idf!(i));
  let result = arr1.filter(
    n => source_ids.indexOf(idf!(n)) < 0
  );

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

type ReorderArgs<T, K> = {
  arr: T[];
  source_ids: Array<K>;
  target_id: K;
  position: 'before' | 'after';
  idf?: (val: T) => any;
}

/**
* Returns an array with reordered items.
*
* Items are reordered as follows: source_ids will be positioned
*  before or after target_id (depending on positioned arg).
*  Couple of examples.
*  Example 1:
*
*    arr = [ 1, 2, 3, 4 ]
*    source_ids = [2]
*    target_id = 4
*    position = 'after'
*
*  In other words, item 2 will be positioned after item 4.
*  Result will be:
*
*    result = [1, 3, 4, 2]
*
*  Example 2:
*
*    arr = [ 1, 2, 3, 4 ]
*    source_ids = [2]
*    target_id = 4
*    position = 'before'

  Result will be (element 2 will be positioned before element 4):

    result = [1, 3, 2, 4]

  Example 3:

    arr = [1, 2]
    source_ids = [2]
    target_id = 1
    position = 'before'

    Result will be:

    result = [2, 1]

  Example 4:

    arr = [1, 2]
    source_ids = [2]
    target_id = 1
    position = 'after'

    Result will be:

    result = [1, 2]

  i.e. same as input because source was already after target

  Example 5:

    arr = [1, 2, 3, 4, 5, 6]
    source_ids = [1, 3]
    target = 5

    result: [2, 4, 5, 1, 3, 6]
*/
function reorder<T=number, K=string>({
  arr,
  source_ids,
  target_id,
  position,
  idf
}: ReorderArgs<T, K>): T[] {

  if (!idf) {
    idf = (x: T): T => x;
  }

  const arr_ids = arr.map(i => idf!(i))

  if (!arr_ids.includes(target_id)) {
    console.warn(`Target ID ${target_id} was not found in arr: `, arr);
    return arr;
  }

  let result: T[] = [];
  let insert_now = false;
  const source: T[] = arr.filter(
    i => source_ids.includes(idf!(i))
  );

  if (source.length == 0) {
    throw new Error("Source list is empty. Cannot reorder.");
  }

  arr.forEach((item: T) => {
    if (insert_now) {
      result.push(...source);
      insert_now = false;
    }

    if (!source_ids.includes(idf!(item)) && idf!(item) !== target_id) {
      result.push(item);
    } else if (idf!(item) === target_id) {
      if (position == 'before') {
        result.push(...source);
        if (!source_ids.includes(idf!(item))) {
          result.push(item);
        }
      } else {
        insert_now = true; // will insert source on next iteration
        if (!source_ids.includes(idf!(item))) {
          result.push(item);
        }
      }
    }
  });

  // is the case when target is last element of the array
  // and we want to insert "after"
  if (result.length < arr.length) {
    result.push(...source);
  }

  return result;
}


export {
  uniq,
  uniq_concat,
  subtract,
  overlap,
  contains_every,
  reorder
}
