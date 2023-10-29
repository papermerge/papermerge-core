import { subtract } from 'utils/array'


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

export {}
