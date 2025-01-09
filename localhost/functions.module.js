function f_b_proxify(value) {
  if (value === null || typeof value !== 'object') return false;

  // Check for plain objects or arrays
  if (Object.prototype.toString.call(value) === '[object Object]') return true;
  if (Array.isArray(value)) return true;

  // Optionally, allow instances of specific user-defined classes
  // (e.g., if you want to proxy custom objects)
  if (value.constructor?.name.startsWith('O_')) return true;

  // Exclude all other types (native or third-party objects)
  return false;
}

function createNestedProxy(target, path = '', callback) {
    const handler = {
      get(obj, prop) {

        const value = obj[prop];
        


        // Bind DOM methods to their original context
        if (typeof value === 'function') {
          return value.bind(obj);
        }

          // Only proxy "plain data" objects
        if (f_b_proxify(value)) {
            return createNestedProxy(value, `${path}${Array.isArray(obj) ? `[${prop}]` : `.${prop}`}`, callback);
        }

  
        return value;
      },
      set(obj, prop, value) {
        const fullPath = `${path}${Array.isArray(obj) ? `[${prop}]` : `.${prop}`}`;
        const oldValue = obj[prop];
        const newValue = value;
  
        if (oldValue !== newValue) {
          callback(fullPath, oldValue, newValue);
        }
  
        // Apply the change
        obj[prop] = value;
        return true;
      },
    };
  
    return new Proxy(target, handler);
  }


  function setByPath(obj, path, value) {
    const pathParts = path.match(/([^[.\]]+)/g); // Split the path into parts (e.g., ['a', 'b', '3', 'c', 'd'])
  
    let current = obj;
  
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
  
      // If it's the last part, set the value
      if (i === pathParts.length - 1) {
        current[part] = value;
        return;
      }
  
      // Determine if the next level should be an array or object
      const nextPart = pathParts[i + 1];
      if (!current[part]) {
        current[part] = /^\d+$/.test(nextPart) ? [] : {}; // Create array if next part is a number, otherwise create object
      }
  
      current = current[part];
    }
  }
    
let f_input_change = function(o_e){ 
    let s_prop_sync = (o_e.target.getAttribute('s_prop_sync'));
    if(s_prop_sync){
        let v = o_e.target.value;
        if(o_e.target.type == 'number' || o_e.target.type == 'range'){
            v = parseFloat(v);
        }
        setByPath(o_state, s_prop_sync, v)
    }
}


  export {
    createNestedProxy,
    setByPath,
    f_input_change
  }