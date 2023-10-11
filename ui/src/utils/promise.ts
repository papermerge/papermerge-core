type STATE = 'pending' | 'rejected'| 'fulfilled';

/**
 * This function allow you to modify a JS Promise by adding some status properties.
 * Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
 * But modified according to the specs of promises : https://promisesaplus.com/
 */
//@ts-ignore
function StatefulPromise(promise) {
  // Don't modify any promise that has been already modified.
  if (promise.state) return promise;

  // Set initial state
  let state: STATE = 'pending';

  // Observe the promise, saving the fulfillment in a closure scope.
  var result = promise.then(
    // @ts-ignore
      function(v) {
          state = 'fulfilled';
          return v;
      },
      // @ts-ignore
      function(e) {
          state = 'rejected';
          throw e;
      }
  );

  result.state = function() { return state; };

  return result;
}
