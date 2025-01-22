let a = [];

const onArrayChange = async () => {
    console.log("onArrayChange called");

    return new Promise((f_res, f_rej)=>{
        setTimeout(()=>{
            return f_res(true)
        },1000)
    })
};

const handler = {
    get(target, property) {
        console.log('get called PROXY')
        // Access the array properties (e.g., length, index, methods)
        return Reflect.get(target, property);
    },
    async set(target, property, value) {
        console.log('set called PROXY')
        // Intercept assignments to the array
        const result = Reflect.set(target, property, value);
        await onArrayChange(); // Call the function when the array changes
        return result;
    },
    async apply(target, thisArg, argumentsList) {
        console.log('push pop etc called PROXY')
        // Intercept calls to array methods like push, pop, etc.
        const result = Reflect.apply(target, thisArg, argumentsList);
        await onArrayChange(); // Call the function when the array changes
        return result;
    },
};

a = new Proxy(a, handler);

// Test it
// a.push(1); 
// a[0] = 42; 
a.pop();   
a.pop();   