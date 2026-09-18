// ========================================
// 360 CAMERA VR
//
// Desktop -> Mouse
// Phone   -> Gyroscope
// PhoneVR -> Split Screen + Gyroscope
// ========================================

import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { VRButton } from
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js";


// ========================================
// SCENE
// ========================================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);


// ========================================
// RENDERER
// ========================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        2
    )
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.xr.enabled = true;

document
    .getElementById("viewer")
    .appendChild(renderer.domElement);


// ========================================
// WEBXR BUTTON
// ========================================

const webXRButton =
    VRButton.createButton(renderer);

document.body.appendChild(
    webXRButton
);

// We mainly use our own Phone VR mode.
webXRButton.style.display = "none";


// ========================================
// VIDEO
// ========================================

const video =
    document.createElement("video");

video.src =
    "assets/test360.mp4";

video.loop = true;
video.muted = true;
video.playsInline = true;

video.crossOrigin =
    "anonymous";


// ========================================
// VIDEO TEXTURE
// ========================================

const texture =
    new THREE.VideoTexture(video);

texture.colorSpace =
    THREE.SRGBColorSpace;


// ========================================
// 360 SPHERE
// ========================================

const geometry =
    new THREE.SphereGeometry(
        100,
        64,
        40
    );

// View sphere from inside
geometry.scale(
    -1,
    1,
    1
);

const material =
    new THREE.MeshBasicMaterial({
        map: texture
    });

const sphere =
    new THREE.Mesh(
        geometry,
        material
    );

scene.add(sphere);


// ========================================
// STATE
// ========================================

// Mouse
let longitude = 0;
let latitude = 0;

let dragging = false;

let previousX = 0;
let previousY = 0;


// Gyroscope
let gyroEnabled = false;


// Phone VR
let phoneVrEnabled = false;


// Device orientation
let alpha = 0;
let beta = 0;
let gamma = 0;


// ========================================
// DEVICE ROTATION
// ========================================

const deviceEuler =
    new THREE.Euler();

const deviceQuaternion =
    new THREE.Quaternion();

const screenQuaternion =
    new THREE.Quaternion();

const zee =
    new THREE.Vector3(
        0,
        0,
        1
    );

const q1 =
    new THREE.Quaternion(
        -Math.sqrt(0.5),
        0,
        0,
        Math.sqrt(0.5)
    );


// ========================================
// UI
// ========================================

const homeScreen =
    document.getElementById(
        "homeScreen"
    );

const viewerScreen =
    document.getElementById(
        "viewerScreen"
    );

const startViewerButton =
    document.getElementById(
        "startViewerButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const gyroButton =
    document.getElementById(
        "gyroButton"
    );

const phoneVrButton =
    document.getElementById(
        "phoneVrButton"
    );

const gyroStatus =
    document.getElementById(
        "gyro-status"
    );

const headingElement =
    document.getElementById(
        "heading"
    );


// ========================================
// HOME -> VIEWER
// ========================================

startViewerButton.addEventListener(
    "click",
    async () => {

        homeScreen.classList.add(
            "hidden"
        );

        viewerScreen.classList.remove(
            "hidden"
        );

        resizeRenderer();

        try {

            await video.play();

        }

        catch (error) {

            console.log(
                "Video could not start:",
                error
            );

        }

    }
);


// ========================================
// VIEWER -> HOME
// ========================================

backButton.addEventListener(
    "click",
    async () => {

        if (phoneVrEnabled) {

            await exitPhoneVR();

        }

        gyroEnabled = false;

        gyroStatus.textContent =
            "GYRO: OFF";

        gyroButton.textContent =
            "📱 GYRO";

        viewerScreen.classList.add(
            "hidden"
        );

        homeScreen.classList.remove(
            "hidden"
        );

    }
);


// ========================================
// MOUSE CONTROLS
// ========================================

renderer.domElement.addEventListener(
    "pointerdown",
    (event) => {

        if (
            gyroEnabled ||
            renderer.xr.isPresenting
        ) {
            return;
        }

        dragging = true;

        previousX =
            event.clientX;

        previousY =
            event.clientY;

    }
);


renderer.domElement.addEventListener(
    "pointermove",
    (event) => {

        if (!dragging)
            return;

        if (
            gyroEnabled ||
            renderer.xr.isPresenting
        ) {
            return;
        }

        const deltaX =
            event.clientX -
            previousX;

        const deltaY =
            event.clientY -
            previousY;

        longitude -=
            deltaX * 0.15;

        latitude +=
            deltaY * 0.15;

        latitude =
            Math.max(
                -85,
                Math.min(
                    85,
                    latitude
                )
            );

        previousX =
            event.clientX;

        previousY =
            event.clientY;

    }
);


renderer.domElement.addEventListener(
    "pointerup",
    () => {

        dragging = false;

    }
);


renderer.domElement.addEventListener(
    "pointerleave",
    () => {

        dragging = false;

    }
);


// ========================================
// MOUSE CAMERA
// ========================================

function updateMouseCamera() {

    const phi =
        THREE.MathUtils.degToRad(
            90 - latitude
        );

    const theta =
        THREE.MathUtils.degToRad(
            longitude
        );

    const target =
        new THREE.Vector3();

    target.x =
        Math.sin(phi) *
        Math.cos(theta);

    target.y =
        Math.cos(phi);

    target.z =
        Math.sin(phi) *
        Math.sin(theta);

    camera.lookAt(target);

    updateHeading(longitude);

}


// ========================================
// DEVICE ORIENTATION
// ========================================

function handleOrientation(event) {

    if (!gyroEnabled)
        return;

    alpha =
        event.alpha ?? 0;

    beta =
        event.beta ?? 0;

    gamma =
        event.gamma ?? 0;

}

window.addEventListener(
    "deviceorientation",
    handleOrientation,
    true
);


// ========================================
// GYROSCOPE CAMERA
// ========================================

function updateGyroCamera() {

    const alphaRad =
        THREE.MathUtils.degToRad(
            alpha
        );

    const betaRad =
        THREE.MathUtils.degToRad(
            beta
        );

    const gammaRad =
        THREE.MathUtils.degToRad(
            gamma
        );

    let screenAngle = 0;

    if (window.screen.orientation) {

        screenAngle =
            window.screen.orientation.angle;

    }

    else {

        screenAngle =
            window.orientation || 0;

    }

    const orientRad =
        THREE.MathUtils.degToRad(
            screenAngle
        );

    deviceEuler.set(
        betaRad,
        alphaRad,
        -gammaRad,
        "YXZ"
    );

    deviceQuaternion
        .setFromEuler(
            deviceEuler
        );

    deviceQuaternion.multiply(
        q1
    );

    screenQuaternion
        .setFromAxisAngle(
            zee,
            -orientRad
        );

    deviceQuaternion.multiply(
        screenQuaternion
    );

    camera.quaternion.copy(
        deviceQuaternion
    );

    updateHeading(alpha);

}


// ========================================
// HEADING
// ========================================

function updateHeading(value) {

    const heading =
        ((value % 360) + 360)
        % 360;

    headingElement.textContent =
        "HEADING: " +
        Math.round(heading)
            .toString()
            .padStart(
                3,
                "0"
            )
        + "°";

}


// ========================================
// MOTION PERMISSION
// ========================================

async function requestMotionPermission() {

    if (
        typeof DeviceOrientationEvent !==
        "undefined"

        &&

        typeof DeviceOrientationEvent
            .requestPermission ===
        "function"
    ) {

        try {

            const permission =
                await DeviceOrientationEvent
                    .requestPermission();

            if (
                permission !==
                "granted"
            ) {

                alert(
                    "Motion sensor permission denied."
                );

                return false;

            }

        }

        catch (error) {

            console.error(error);

            return false;

        }

    }

    return true;

}


// ========================================
// GYRO BUTTON
// ========================================

gyroButton.addEventListener(
    "click",
    async () => {

        if (!gyroEnabled) {

            const allowed =
                await requestMotionPermission();

            if (!allowed)
                return;

        }

        gyroEnabled =
            !gyroEnabled;

        if (gyroEnabled) {

            gyroButton.textContent =
                "📱 GYRO ON";

            gyroStatus.textContent =
                "GYRO: ON";

        }

        else {

            gyroButton.textContent =
                "📱 GYRO";

            gyroStatus.textContent =
                "GYRO: OFF";

        }

    }
);


// ========================================
// ENTER PHONE VR
// ========================================

async function enterPhoneVR() {

    const allowed =
        await requestMotionPermission();

    if (!allowed)
        return;

    phoneVrEnabled = true;

    // VR automatically enables gyro
    gyroEnabled = true;

    gyroButton.textContent =
        "📱 GYRO ON";

    gyroStatus.textContent =
        "GYRO: ON";

    phoneVrButton.textContent =
        "EXIT VR";

    document.body.classList.add(
        "phone-vr"
    );

    try {

        await video.play();

    }

    catch (error) {

        console.log(
            "Video play failed:",
            error
        );

    }


    // Fullscreen
    try {

        if (
            !document.fullscreenElement
        ) {

            await document
                .documentElement
                .requestFullscreen();

        }

    }

    catch (error) {

        console.log(
            "Fullscreen unavailable:",
            error
        );

    }


    // Landscape
    try {

        if (
            screen.orientation &&
            screen.orientation.lock
        ) {

            await screen.orientation.lock(
                "landscape"
            );

        }

    }

    catch (error) {

        console.log(
            "Orientation lock unavailable:",
            error
        );

    }

    resizeRenderer();

}


// ========================================
// EXIT PHONE VR
// ========================================

async function exitPhoneVR() {

    phoneVrEnabled = false;

    phoneVrButton.textContent =
        "🥽 ENTER VR";

    document.body.classList.remove(
        "phone-vr"
    );


    try {

        if (
            document.fullscreenElement
        ) {

            await document
                .exitFullscreen();

        }

    }

    catch (error) {

        console.log(
            "Could not exit fullscreen."
        );

    }


    try {

        if (
            screen.orientation &&
            screen.orientation.unlock
        ) {

            screen.orientation.unlock();

        }

    }

    catch (error) {

        console.log(
            "Orientation unlock unavailable."
        );

    }

    resizeRenderer();

}


// ========================================
// PHONE VR BUTTON
// ========================================

phoneVrButton.addEventListener(
    "click",
    async () => {

        if (!phoneVrEnabled) {

            await enterPhoneVR();

        }

        else {

            await exitPhoneVR();

        }

    }
);


// ========================================
// WEBXR EVENTS
// ========================================

renderer.xr.addEventListener(
    "sessionstart",
    () => {

        phoneVrEnabled = false;
        gyroEnabled = false;

        document.body.classList.remove(
            "phone-vr"
        );

        video.play();

    }
);


renderer.xr.addEventListener(
    "sessionend",
    () => {

        gyroEnabled = false;

        gyroStatus.textContent =
            "GYRO: OFF";

        gyroButton.textContent =
            "📱 GYRO";

    }
);


// ========================================
// NORMAL RENDER
// ========================================

function renderNormal() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;

    renderer.setScissorTest(
        false
    );

    renderer.setViewport(
        0,
        0,
        width,
        height
    );

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    renderer.render(
        scene,
        camera
    );

}


// ========================================
// PHONE VR SPLIT SCREEN
// ========================================

function renderPhoneVR() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;

    const halfWidth =
        Math.floor(
            width / 2
        );

    renderer.setScissorTest(
        true
    );


    // LEFT EYE

    renderer.setViewport(
        0,
        0,
        halfWidth,
        height
    );

    renderer.setScissor(
        0,
        0,
        halfWidth,
        height
    );

    camera.aspect =
        halfWidth / height;

    camera.updateProjectionMatrix();

    renderer.render(
        scene,
        camera
    );


    // RIGHT EYE

    const rightWidth =
        width - halfWidth;

    renderer.setViewport(
        halfWidth,
        0,
        rightWidth,
        height
    );

    renderer.setScissor(
        halfWidth,
        0,
        rightWidth,
        height
    );

    camera.aspect =
        rightWidth / height;

    camera.updateProjectionMatrix();

    renderer.render(
        scene,
        camera
    );

    renderer.setScissorTest(
        false
    );

}


// ========================================
// RESIZE
// ========================================

function resizeRenderer() {

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    if (!phoneVrEnabled) {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

    }

}


// ========================================
// ANIMATION LOOP
// ========================================

function animate() {

    if (
        !renderer.xr.isPresenting
    ) {

        if (gyroEnabled) {

            updateGyroCamera();

        }

        else {

            updateMouseCamera();

        }

    }


    if (
        phoneVrEnabled &&
        !renderer.xr.isPresenting
    ) {

        renderPhoneVR();

    }

    else {

        renderNormal();

    }

}

renderer.setAnimationLoop(
    animate
);


// ========================================
// WINDOW RESIZE
// ========================================

window.addEventListener(
    "resize",
    resizeRenderer
);