import { O_person } from "./classes.module.js";

let o_DOMParser = null; 
if("Deno" in globalThis){
    o_DOMParser = (await import("https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts")).DOMParser;
}   
let f_o_html_element__from_s_tag = function(s_tag){
    
    let o_doc;
    if("Deno" in globalThis){
        o_doc = new o_DOMParser().parseFromString(
            '<div></div>',
            'text/html'
        );
    }else{
        o_doc = document;
    }
    if([
        'svg',
        'circle',
        'rect',
        'path',
        'polygon',
        'polyline',
        'ellipse',
        'text',
        'g',
        'defs',
        'use',
        'line',
        'linearGradient',
        'radialGradient'
    ].includes(s_tag)){
        return document.createElementNS("http://www.w3.org/2000/svg",  s_tag);
    }
    // if(['math', 'mrow', 'mfrac', 'msqrt', 'msub', 'msup', 'munder', 'mover', 'mi', 'mo', 'mn', 'mtext'].includes(s_tag)){
    //     return document.createElementNS("http://www.w3.org/1998/Math/MathML",  s_tag);
    // }
    return o_doc.createElement(s_tag);

}


let f_o_html = async function(
    o_js
){
    // debugger
    let s_tag = 'div';
    if(o_js.s_tag){
        s_tag = o_js.s_tag
    }

    let o_html = f_o_html_element__from_s_tag(s_tag);
    for(let s_prop in o_js){
        let v = o_js[s_prop];

        let s_type_v = typeof v;
        if(s_type_v == "function"){
            let f_event_handler = function(){
                v.call(this, ...arguments, o_js);
            }

            o_html[s_prop] = f_event_handler
            if(!o_html.o_meta){
                o_html.o_meta = {}
            }
            o_html.o_meta[s_prop] = v
           
        }
        if(typeof v != 'function'){
            // some attributes such as 'datalist' do only have a getter
            try {
                o_html[s_prop] = v;
            } catch (error) {
                console.warn(error)
            }
            try {
                o_html.setAttribute(s_prop, v);
            } catch (error) {
                console.warn(error)
            }
        }
    }
    if(o_js?.f_s_innerText){
        o_html.innerText = o_js?.f_s_innerText()
    }
    if(o_js?.f_s_innerHTML){
        o_html.innerText = o_js?.f_s_innerHTML()
    }
    if(o_js?.f_a_o){
        let a_o = await o_js?.f_a_o();
        for(let o_js2 of a_o){
            let o_html2 = await f_o_html(o_js2);
            o_html.appendChild(o_html2)
        }
    }
    return o_html;
}


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
  const callback = async (target, path, value) => {
    console.log(`Callback started for path: ${JSON.stringify(path)}, value:`, value);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate async operation
    console.log(`Callback finished for path: ${JSON.stringify(path)}`);
  };
  
  
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


    let f_a_o_html_object_from_path = function (path) {
        if (!Array.isArray(path) || path.length === 0) {
          throw new Error('Path must be a non-empty array');
        }
      
        let currentPath = [...path]; // Clone the path array to avoid mutating the input
      
        // This array will store all matching elements
        let foundElements = [];
      
        // Traverse the path from the deepest level upward
        while (currentPath.length > 0) {
          let property = currentPath.pop(); // Get the last property in the path
      
          // If it's an array index, find the parent property
          if (!isNaN(property)) {
            let parentProperty = currentPath.pop(); // Get the parent array's name
            if (parentProperty) {
              // Query all elements matching the parent property
              let parentElements = document.querySelectorAll(`[s_prop_sync="${parentProperty}"]`);
              parentElements.forEach(parentElement => {
                // Check if the parent element has the specified index as a child
                if (parentElement.children[property]) {
                  foundElements.push(parentElement.children[property]);
                }
              });
      
              if (foundElements.length > 0) {
                return foundElements; // Return all matching objects
              }
            }
          } else {
            // Handle plain property
            let elements = document.querySelectorAll(`[s_prop_sync="${property}"]`);
            if (elements.length > 0) {
              foundElements.push(...elements);
              return foundElements; // Return all matching objects
            }
          }
        }
      
        // If no objects were found, return an empty array
        return foundElements;
      };

let a_o_shader = []
let o_person = null;

let a_o_person = [
    new O_person(
        'hans', 
        10, 
        true, 
        ['hansi', 'haenschen', 'haensel'],
        ()=>{
            return this.s_name + this.a_s_short_name.join(' ')
        }
    ),
    new O_person(
        'greta', 
        10, 
        false, 
        ['gretchen', 'gretel']
    )
]
let f_callback = async function(a_s_path, v_old, v_new){

        console.log('proxy callback called')
    
        let a_o_el = f_a_o_html_object_from_path(a_s_path);
        console.log({
            a_s_path,
            a_o_el
        })
        // debugger
        //document.querySelectorAll(`[s_prop_sync="${a_s_path.join('.')}"]`);
        // console.log(a_o_el)
        
        // if(a_o_el.length == 0){
        //     // if the path would be for example a_o_person.0 or a_o_person.0.s_name, 
        //     // an item of the array has been modified
        //     let a_s_path_tmp = a_s_path;
        //     while(a_s_path_tmp.length > 0 && a_o_el.length > 0){
        //         let s = a_s_path_tmp.shift();
        //         a_o_el = document.querySelectorAll(`[s_prop_sync="${s}"]`);
        //         for(let o_el of a_o_el){
        //             let a_o_child = o_el.childNodes[]
        //         }
        //     }
        // }
        // console.log(path)
        // debugger
        for(let o_el of a_o_el){
            if(o_el.value){
                o_el.value = newValue
            }
            if(o_el?.o_meta?.f_s_innerText){
                let s = o_el.o_meta.f_s_innerText();
                o_el.innerText = s;
            }
            if(o_el?.o_meta?.f_a_o){
                // console.log(o.o_meta)
                // debugger

                o_el.innerHTML = ''
                // console.log(`starting: ${new Date().getTime()}`)
                // console.log(o_el.o_meta.b_done)

                let a_o_el2 = await o_el?.o_meta?.f_a_o();
                // while (o_el.firstChild) {
                //     o_el.removeChild(o_el.firstChild);
                // }
                o_el.innerHTML = ''

                // debugger
                // console.log(a_o_el2)
                for(let n_idx in a_o_el2){
                    let o_js2 = a_o_el2[n_idx];
                    let o_html2 = await f_o_html(o_js2);
                    o_el.appendChild(o_html2)
                    // console.log('appending child')
                    // console.log(o_html2)
                }
                // console.log(`done: ${new Date().getTime()}`)


            }
        }
    
}
let o_state = f_o_proxified(
    {
        o_person: a_o_person[0],
        a_o_person, 
        n_test: 1, 
        n_1: 0.2, 
        n_2: 0.5,
        s_test: "test", 
        b_test: true, 
        f_test:()=>{return 'test function executed succesfully'},
        a_o: [{n:1},{n:2}], 
    },
    f_callback,
    []
)

window.o_state = o_state

let f_sleep_ms = async function(n_ms){
    return new Promise((f_res, f_rej)=>{
        setTimeout(()=>{
            return f_res(true)
        },n_ms)
    })
}
let o = await f_o_html(
    {
        class: "test",
        f_a_o: ()=>{
            return [
                {
                    innerText: "section 1"
                },
                {
                    style: "background:red",
                    f_a_o: async ()=>{
                        await f_sleep_ms(1000);

                        return o_state.a_o_person.map(o=>{
                            return {
                                f_a_o:()=>[
                                    {
                                        f_s_innerText: ()=>`name is:${o.s_name} random number: ${Math.random()}`
                                    },
                                    {
                                        f_s_innerText:()=>`age is: ${o.n_age}`
                                    },
                                    {
                                        s_tag: 'hr'
                                    }
                                ]
                            }
                        })
                    }, 
                    s_prop_sync: "a_o_person"
                },
                {
                    innerText: "section 2   "
                },
                {
                    f_a_o: ()=>{
                        return o_state.a_o_person.map(o=>{
                            return {
                                style: `background: rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`,
                                f_a_o:()=>[
                                    {
                                        f_s_innerText: ()=>`name is:${o.s_name} random number: ${Math.random()}`
                                    },
                                    {
                                        f_s_innerText:()=>`age is: ${o.n_age}`
                                    },
                                    {
                                        s_tag: 'hr'
                                    }
                                ]
                            }
                        })
                    }, 
                    s_prop_sync: "a_o_person"
                } 
            ]
        }
    }

)
console.log(o);
document.body.appendChild(o)

o_state.a_o_person.push(
    new O_person('ludolf', 20)
)
o_state.a_o_person.push(
    new O_person(
        'ueli', 
        10, 
        false, 
        ['ul']
    )
)
o_state.a_o_person[0].s_name = `${o_state.a_o_person[0].s_name}_new`
o_state.a_o_person[1].s_name = `${o_state.a_o_person[1].s_name}_new`
o_state.a_o_person[2] = {s_name: 'lol'}
// let o_tmp = o_state.a_o_person[1];
// o_tmp.s_name = 'kkl'
// o_state.a_o_person.pop()
console.log(o_state.a_o_person)
console.log(o_state.a_o_person)
console.log(o_state.a_o_person)

window.setTimeout(()=>{
    console.log('pop1')
    o_state.a_o_person.pop()
    console.log('pop2')
    o_state.a_o_person.pop()
    console.log('pop3')
    o_state.a_o_person.pop()
    
    console.log(o_state.a_o_person)
    // window.setTimeout(()=>{
    //     o_state.a_o_person.pop()
    //     // o_state.a_o_person.pop()
    
    // },1)
},3333)

// console.log(o.o_meta)
// o.innerHTML = ''
// let a_o = await o.o_meta.f_a_o();
// for(let o_js2 of a_o){
//     let o_html2 = await f_o_html(o_js2);
//     o.appendChild(o_html2)
// }
