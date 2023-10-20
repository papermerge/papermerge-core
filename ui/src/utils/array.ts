
function subtract<T extends {id: string}>(
  arr1: T[],
  arr2: T[]
): T[] {
  /*
    Subtracts arr2 from arr1

    result = arr1 - arr2

    Example:

    arr1 = [a1, a2, a3, a4]
    arr2 = [a1, a2]
    result = [ a3, a4 ]

    Elements in array are identified by their ID.
  */
  const source_ids = arr2.map(i => i.id);
  let result = arr1.filter(n => source_ids.indexOf(n.id) < 0);

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

function contains_every<T>({container, items}: Args<T>): boolean {
  return items.every((i) => container.includes(i));
}

export {uniq_concat, subtract, overlap, contains_every}
