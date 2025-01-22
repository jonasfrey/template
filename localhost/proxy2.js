function f_o_proxified(obj, f_callback, path = []) {
    let callbackQueue = Promise.resolve();
  
    const wrappedCallback = (fullPath, v_old, v_new) => {
      callbackQueue = callbackQueue.then(() => f_callback(fullPath, v_old, v_new));
      return callbackQueue;
    };
  
    function createProxy(target, currentPath) {
      return new Proxy(target, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
          if (typeof value === 'object' && value !== null) {
            // Create proxy for nested objects/arrays, including the path to this property
            return createProxy(value, [...currentPath, prop]);
          }
          return value;
        },
        set(target, prop, value, receiver) {
          const oldValue = Reflect.get(target, prop, receiver);
          const result = Reflect.set(target, prop, value, receiver);
          wrappedCallback([...currentPath, prop], oldValue, value);
          return result;
        },
        deleteProperty(target, prop) {
          const oldValue = Reflect.get(target, prop);
          const result = Reflect.deleteProperty(target, prop);
          wrappedCallback([...currentPath, prop], oldValue, undefined);
          return result;
        }
      });
    }
  
    return createProxy(obj, path);
  }
  
  // Example usage:
  let f_callback = async function(a_s_path, v_old, v_new) {
    console.log(`Callback started for path: ${JSON.stringify(a_s_path)}`);
    console.log(`Old Value:`, v_old);
    console.log(`New Value:`, v_new);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate async operation
    console.log(`Callback finished for path: ${JSON.stringify(a_s_path)}`);
  };
  
  const obj = f_o_proxified(
    {
      o_child: {
        a_o: [1, 2, 3, 4, { s_name: 'oldName' }],
      },
    },
    f_callback
  );
  
  // Trigger operations:
  obj.o_child.a_o[4].s_name = 'hans'; // Logs path ['o_child', 'a_o', 4, 's_name']
  obj.o_child.a_o.push(5); // Logs path ['o_child', 'a_o', 5]
  delete obj.o_child.a_o[4].s_name; // Logs path ['o_child', 'a_o', 4, 's_name']
  