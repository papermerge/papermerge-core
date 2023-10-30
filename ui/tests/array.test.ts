import { subtract, reorder } from 'utils/array'


type Node = {
  id: string;
}


describe('utils/array/subtract', () => {

  test('subtract with node objects', () => {

    const arr1 = [
      {id: '1'} , {id: '2'}, {id: '3'}, {id: '4'}
    ];
    const arr2 = [
      {id: '1'}, {id: '2'}
    ]

    const expected_arr = [
      {id: '3'}, {id: '4'}
    ]

    expect(
      subtract<Node>(arr1, arr2, (x) => x.id)
    ).toStrictEqual(expected_arr);
  });

  test('subtract with primitive types', () => {

    const arr1 = [1 ,2, 3, 4];
    const arr2 = [1, 2];

    expect(
      subtract(arr1, arr2)
    ).toStrictEqual([3, 4]);
  });

  test('empty inputs', () => {
    expect(
      subtract([], [])
    ).toEqual([]);

    expect(
      subtract([1, 2, 3], [])
    ).toEqual([1, 2, 3]);
  });

  test('subtract more from less', () => {
    expect(
      subtract([1, 2], [3, 4, 5, 6])
    ).toEqual([1, 2]);
  });

  test('subtract something from nothing', () => {
    expect(
      subtract([], [3, 4, 5, 6])
    ).toEqual([]);
  });

});

describe('utils/array/reorder', () => {
  test('basic data 1', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2, 3, 4],
      source_ids: [2],
      target_id: 4,
      position: 'after'
    });
    const expect_result = [1, 3, 4, 2];

    expect(actual_result).toEqual(expect_result);
  });

  test('basic data 2', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2, 3, 4],
      source_ids: [2],
      target_id: 4,
      position: 'before'
    });
    const expect_result = [1, 3, 2, 4];

    expect(actual_result).toEqual(expect_result);
  });

  test('basic data 3', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2],
      source_ids: [2],
      target_id: 1,
      position: 'before'
    });

    expect(actual_result).toEqual([2, 1]);
  });

  test('basic data 4', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2],
      source_ids: [2],
      target_id: 1,
      position: 'after'
    });

    expect(actual_result).toEqual([1, 2]);
  });

  test('basic data 5', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2, 3, 4, 5, 6],
      source_ids: [1, 3],
      target_id: 5,
      position: 'after'
    });

    expect(actual_result).toEqual([2, 4, 5, 1, 3, 6]);
  });

  test('basic data 6', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2],
      source_ids: [1],
      target_id: 2,
      position: 'after'
    });

    expect(actual_result).toEqual([2, 1]);
  });

  test('basic data 7', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2],
      source_ids: [1],
      target_id: 2,
      position: 'before'
    });

    expect(actual_result).toEqual([1, 2]);
  });

  test('not existing target', () => {
    const actual_result = reorder<number, number>({
      arr: [1, 2, 3],
      source_ids: [1],
      target_id: 10,
      position: 'before'
    });

    expect(actual_result).toEqual([1, 2, 3]);
  });
})

export {}
