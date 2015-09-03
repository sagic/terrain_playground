var terrainViewer = (function (container) {

    var DISPLAY_SIZE = {
        width: 500,
        height: 500
    };

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(30, DISPLAY_SIZE.width / DISPLAY_SIZE.height, 1, 10000);
    camera.position.z = 200;
    camera.position.y = -4500;
    camera.rotation.x = 8;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(DISPLAY_SIZE.width, DISPLAY_SIZE.height);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;

    renderer.shadowCameraNear = 3;
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 50;

    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;
    renderer.shadowMapWidth = 1024;
    renderer.shadowMapHeight = 1024;

    container.appendChild(renderer.domElement);


    var quality = 128;

    var geometry = new THREE.PlaneGeometry(2000, 2000, quality - 1, quality - 1);
    //geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2.7));

    var material = new THREE.MeshLambertMaterial({color: 0xFFFFFF, wireframe: true});
    var plane = new THREE.Mesh(geometry, material);
    plane.dynamic = true;
    //plane.castShadow = true;
    //plane.receiveShadow = true;
    scene.add(plane);

    var pointLight = new THREE.PointLight(0xffffff, 10);
    pointLight.position.set(3000, 100, 303);
    //pointLight.castShadow = true;
    scene.add(pointLight);

    //var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    //directionalLight.position.set( 0, 100, 10 );
    //directionalLight.rotation.set( 145, 145, 10 );
    //directionalLight.castShadow = true;
    //directionalLight.shadowCameraVisible = true;
    //scene.add( directionalLight );

    //var spotLight = new THREE.SpotLight(0xffffff, 1);
    //spotLight.position.set(0, 0, 10);
    //scene.add(spotLight);

    var render = function () {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
        //plane.rotation.z += .001;
    };

    render();

    function getHeightDataFromCanvas(canvas) {
        //var size = img.width * img.height;
        var size = canvas.width * canvas.height;
        var data = new Uint8Array(size);
        var context = canvas.getContext('2d');

        var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
        var pix = imgd.data;
        var scale = .5;

        var j = 0;
        for (var i = 0; i < pix.length; i += 4) {
            var all = pix[i] + pix[i + 1] + pix[i + 2];
            data[j++] = all / (12 * scale);
        }

        return data;
    }

    return {
        setHeightMap: function (canvas) {
            var data = getHeightDataFromCanvas(canvas);

            var step = canvas.width / quality;
            step = parseInt(step);

            //for (var r=0; r<quality; r++) {
            //    for (var c=0; c<quality; c++) {
            //        var dataInd = parseInt(r * step * 500 + c * step);
            //        geometry.vertices[r*quality + c].z = data[dataInd];
            //        console.log(r*quality + c, dataInd, data[dataInd]);
            //    }
            //}

            //var n = quality;//+1;
            //
            //for (var i=0; i<n; i++) {
            //    for (var j=i*n; j<i*n+n; j++) {
            //        var ind = step*step*j;
            //        geometry.vertices[j].z = data[ind];
            //        console.log(j,ind, data[ind]);
            //    }
            //
            //}

            for (var i = 0, l = geometry.vertices.length; i < l; i++) {

                var x = i % quality;
                var y = Math.floor(i / quality);
                geometry.vertices[i].z = data[( x * step ) + ( y * step ) * canvas.width] * 2 - 128;

            }
            //console.log(geometry.vertices);

            //for (var i=16; i<32; i++) {
            //    geometry.vertices[i].z = i*5;
            //}

            geometry.verticesNeedUpdate = true;

            //debugger;
        },

        setCameraPosition: function (x, y, z) {
            if (x !== null && x !== undefined) {
                camera.position.setX(x);
            }
            if (y !== null && y !== undefined) {
                camera.position.setY(y);
            }
            if (z !== null && z !== undefined) {
                camera.position.setZ(z);
            }
        },

        setCameraRotation: function (x, y, z) {
            if (x !== null && x !== undefined) {
                camera.rotation.x = x * Math.PI / 180;
            }
            if (y !== null && y !== undefined) {
                camera.rotation.y = y * Math.PI / 180;
            }
            if (z !== null && z !== undefined) {
                camera.rotation.z = z * Math.PI / 180;
            }
        }
    };

})($('#display')[0]);


var canvasDraw = (function (el, updateCallback) {

    var ctx = el.getContext('2d');
    ctx.rect(0, 0, 500, 500);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.lineJoin = ctx.lineCap = 'round';

    var isDrawing;
    var lastPoint;
    var convertedImage;

    var $el = $(el);

    $el.mousedown(function (e) {
        isDrawing = true;
        var offset = $(this).offset();
        lastPoint = {
            x: e.pageX - offset.left,
            y: e.pageY - offset.top
        };
    });

    $el.mousemove(function (e) {
        if (!isDrawing) {
            return;
        }

        var offset = $(this).offset();
        var currentPoint = {
            x: e.pageX - offset.left,
            y: e.pageY - offset.top
        };

        var dist = distanceBetween(lastPoint, currentPoint);
        var angle = angleBetween(lastPoint, currentPoint);

        for (var i = 0; i < dist; i += 5) {

            var x = lastPoint.x + (Math.sin(angle) * i);
            var y = lastPoint.y + (Math.cos(angle) * i);

            var radgrad = ctx.createRadialGradient(x, y, 10, x, y, 20);

            radgrad.addColorStop(0, 'rgba(255,255,255,0.2)');
            radgrad.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.globalAlpha = 0.1;
            ctx.fillStyle = radgrad;
            ctx.fillRect(x - 20, y - 20, 40, 40);
        }

        lastPoint = currentPoint;
    });

    $el.mouseup(function (e) {
        isDrawing = false;
        updateCallback(el);
    });

    updateCallback(el);

    //el.onmousedown = function (e) {
    //    isDrawing = true;
    //    lastPoint = {
    //        x: e.clientX,
    //        y: e.clientY
    //    };
    //};
    //
    //el.onmousemove = function (e) {
    //    if (!isDrawing) {
    //        return;
    //    }
    //
    //    var currentPoint = {
    //        x: e.clientX,
    //        y: e.clientY
    //    };
    //
    //    var dist = distanceBetween(lastPoint, currentPoint);
    //    var angle = angleBetween(lastPoint, currentPoint);
    //
    //    for (var i = 0; i < dist; i += 5) {
    //
    //        x = lastPoint.x + (Math.sin(angle) * i);
    //        y = lastPoint.y + (Math.cos(angle) * i);
    //
    //        var radgrad = ctx.createRadialGradient(x, y, 10, x, y, 20);
    //
    //        radgrad.addColorStop(0, 'rgba(255,255,255,0.2)');
    //        radgrad.addColorStop(1, 'rgba(255,255,255,0)');
    //
    //        ctx.fillStyle = radgrad;
    //        ctx.fillRect(x - 20, y - 20, 40, 40);
    //    }
    //
    //    lastPoint = currentPoint;
    //};
    //
    //el.onmouseup = function () {
    //    isDrawing = false;
    //    updateCallback(el);
    //
    //
    //    //convertedImage = convertCanvasToImage(el);
    //    //var data = getHeightData(el);
    //    //console.log(data);
    //    //
    //    //setVertices(data);
    //    //
    //    ////for (var i = 0; i < plane.geometry.vertices.length; i++) {
    //    ////    plane.geometry.vertices[i].setZ(data[i * 25] * 100);
    //    ////}
    //    //
    //    //plane.verticesNeedUpdate = true;
    //};

    function distanceBetween(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    function angleBetween(point1, point2) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }

})($('#canvasDraw')[0], function (canvas) {
    //var image = new Image();
    //image.src = canvas.toDataURL("image/png");
    terrainViewer.setHeightMap(canvas);
});

$('input[type=range]').on('input', function () {
    $(this).trigger('change');
});

$('.camera-x').on('change', function (evt) {
    terrainViewer.setCameraPosition($(this).val());
});

$('.camera-y').on('change', function (evt) {
    terrainViewer.setCameraPosition(null, $(this).val(), null);
});

$('.camera-z').on('change', function (evt) {
    terrainViewer.setCameraPosition(null, null, $(this).val());
});

$('.camera-rx').on('change', function (evt) {
    terrainViewer.setCameraRotation($(this).val(), null, null);
});

$('.camera-ry').on('change', function (evt) {
    terrainViewer.setCameraRotation(null, $(this).val(), null);
});

$('.camera-rz').on('change', function (evt) {
    terrainViewer.setCameraRotation(null, null, $(this).val());
});
