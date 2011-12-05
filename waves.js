Waves = [
    function() {
        new Dopey({ x: 0, y: 115, z: -1000 });
    },

    function() {
        new Dopey({ x: -500, y: 115, z: -1000 });
        new Dopey({ x: 500, y: 115, z: -1000 });
    },

    function() {
        new Dopey({ x: 0, y: 115, z: -1000 });
        new Dopey({ x: 0, y: 115, z: 1000 });
    },

    function() {
        new Dopey({ x: 0, y: 115, z: -1000 });
        new Dopey({ x: 0, y: 115, z: 1000 });
        new Dopey({ x: 1000, y: 115, z: 0 });
        new Dopey({ x: -1000, y: 115, z: 0 });
    },

    function() {
        new Spinner({ x: 0, y: 115, z: -1000 });
    },

    function() {
        new Spinner({ x: -500, y: 115, z: -1000 });
        new Dopey({ x: 500, y: 115, z: -1000 });
    },

    function() {
        new Dopey({ x: 500, y: 115, z: -1000 });
        new Spinner({ x: 0, y: 115, z: -1000 });
        new Dopey({ x: -500, y: 115, z: -1000 });
    },

    function() {
        new Spinner({ x: -1000, y: 115, z: 0 });
        new Spinner({ x: 1000, y: 115, z: 0 });
    },

    function() {
        new BlackHole({ x: 0, y: 120, z: -1000 });
    },

    function() {
        new BlackHole({ x: 0, y: 120, z: 1000 });
        new Dopey({ x: -500, y: 115, z: 1000 });
        new Dopey({ x: 500, y: 115, z: 1000 });
    },

    function() {
        new BlackHole({ x: 0, y: 120, z: -1000 });
        new Dopey({ x: -500, y: 115, z: -1000 });
        new Spinner({ x: 500, y: 115, z: -1000 });
    },

    function() {
        new BlackHole({ x: 0, y: 120, z: -1000 });
        new Dopey({ x: -500, y: 115, z: -1000 });
        new Spinner({ x: 500, y: 115, z: -1000 });
        new Dopey({ x: -500, y: 115, z: 1000 });
    },

    function() {
        new BlackHole({ x: -500, y: 120, z: -1000 });
        new BlackHole({ x: 500, y: 120, z: -1000 });
        new BlackHole({ x: 0, y: 120, z: 1000 });
    },

    function() {
        new BlackHole({ x: -500, y: 120, z: -1000 });
        new Spinner({ x: -1000, y: 115, z: 0 });
        new Spinner({ x: 1000, y: 115, z: 0 });
    },

    function() {
        for (var i = 0; i < Math.PI*2; i += Math.PI / 4)
            new Dopey({ x: 1000*Math.cos(i), y: 115, z: 1000*Math.sin(i)});
    },

    function() {
        for (var i = 0; i < Math.PI*2; i += Math.PI / 4)
            new Dopey({ x: 1000*Math.cos(i), y: 115, z: 1000*Math.sin(i)});
        new Spinner({ x: -1000, y: 115, z: 0 });
    },

    function() {
        for (var i = 0; i < Math.PI*2; i += Math.PI / 4)
            new Dopey({ x: 1000*Math.cos(i), y: 115, z: 1000*Math.sin(i)});
        new BlackHole({ x: -1000, y: 115, z: 0 });
    },

    function() {
        for (var i = 0; i < Math.PI*2; i += Math.PI / 4)
            new Dopey({ x: 1000*Math.cos(i), y: 115, z: 1000*Math.sin(i)});
        new BlackHole({ x: -1000, y: 115, z: 0 });
        new Spinner({ x: 1000, y: 115, z: 0 });
    },
];
