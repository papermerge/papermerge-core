import { subtract } from 'utils/array'

type Node = {
  id: string;
}


test('substract with node objects', () => {

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
    subtract<Node>({arr1, arr2, idf: (x) => x.id})
  ).toStrictEqual(expected_arr);
});

test('substract with primitive types', () => {

  const arr1 = [1 ,2, 3, 4];
  const arr2 = [1, 2];

  expect(
    subtract({arr1, arr2})
  ).toStrictEqual([3, 4]);
});


export {}
