const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

document
    .getElementById("viewer")
    .appendChild(renderer.domElement);


// ---------------------------------------
// VIDEO
// ---------------------------------------

const video = document.createElement("video");

video.src = "assets/test360.mp4";

video.loop = true;
video.muted = true;
video.playsInline = true;
video.crossOrigin = "anonymous";

video.play();


// Convert video → Three.js texture

const texture = new THREE.VideoTexture(video);

texture.colorSpace = THREE.SRGBColorSpace;


// ---------------------------------------
// CREATE 360° SPHERE
// ---------------------------------------

const geometry = new THREE.SphereGeometry(
    100,
    64,
    40
);

// Flip sphere inside-out

geometry.scale(-1, 1, 1);

const material = new THREE.MeshBasicMaterial({
    map: texture
});

const sphere = new THREE.Mesh(
    geometry,
    material
);

scene.add(sphere);


// ---------------------------------------
// CAMERA LOOK
// ---------------------------------------

let longitude = 0;
let latitude = 0;

let dragging = false;

let previousX = 0;
let previousY = 0;


renderer.domElement.addEventListener(
    "pointerdown",
    (event) => {

        dragging = true;

        previousX = event.clientX;
        previousY = event.clientY;

    }
);


renderer.domElement.addEventListener(
    "pointermove",
    (event) => {

        if (!dragging) return;

        const deltaX =
            event.clientX - previousX;

        const deltaY =
            event.clientY - previousY;

        longitude -= deltaX * 0.15;

        latitude += deltaY * 0.15;

        latitude = Math.max(
            -85,
            Math.min(85, latitude)
        );

        previousX = event.clientX;
        previousY = event.clientY;

    }
);


renderer.domElement.addEventListener(
    "pointerup",
    () => {

        dragging = false;

    }
);


// ---------------------------------------
// CAMERA ROTATION
// ---------------------------------------

function updateCamera() {

    const phi =
        THREE.MathUtils.degToRad(
            90 - latitude
        );

    const theta =
        THREE.MathUtils.degToRad(
            longitude
        );

    const target = new THREE.Vector3();

    target.x =
        Math.sin(phi) *
        Math.cos(theta);

    target.y =
        Math.cos(phi);

    target.z =
        Math.sin(phi) *
        Math.sin(theta);

    camera.lookAt(target);


    // Update fake compass

    let heading =
        ((longitude % 360) + 360) % 360;

    document.getElementById(
        "heading"
    ).textContent =
        "HEADING: " +
        Math.round(heading)
            .toString()
            .padStart(3, "0") +
        "°";
}


// ---------------------------------------
// RENDER LOOP
// ---------------------------------------

function animate() {

    requestAnimationFrame(animate);

    updateCamera();

    renderer.render(
        scene,
        camera
    );
}

animate();


// ---------------------------------------
// WINDOW RESIZE
// ---------------------------------------

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);