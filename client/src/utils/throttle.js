const throttle = (fn, delay) => {

    let lastTime = 0;

    return (...args) => {

        const now = Date.now();

        if (now - lastTime < delay) return;

        fn(...args);

        lastTime = now;

    };

};

export default throttle;