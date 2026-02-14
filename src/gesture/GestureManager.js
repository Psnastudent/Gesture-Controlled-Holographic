import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class GestureManager {
    constructor() {
        this.handLandmarker = undefined;
        this.webcamRunning = false;
        this.video = document.getElementById('webcam');
        // If video element doesn't exist, create it (hidden)
        if (!this.video) {
            this.video = document.createElement('video');
            this.video.id = 'webcam';
            this.video.style.display = 'none';
            this.video.autoplay = true;
            this.video.playsInline = true;
            document.body.appendChild(this.video);
        }

        this.listeners = {};
        this.lastVideoTime = -1;
        this.results = undefined;
    }

    async init() {
        try {
            console.log("Loading Hand Landmarker...");
            this.emit('status', 'Loading AI Model (Please wait)...');

            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );

            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "CPU"
                },
                runningMode: "VIDEO",
                numHands: 2
            });

            console.log("Hand Landmarker Loaded.");
            this.emit('status', 'AI Loaded. Starting Camera...');
            await this.startWebcam();
        } catch (error) {
            console.error("Initialization Error:", error);
            this.emit('error', `Failed to load AI Model: ${error.message}`);
        }
    }

    async startWebcam() {
        // Simplify constraints to just basic video to avoid resolution issues
        const constraints = {
            video: true
        };

        try {
            console.log("Requesting Camera Access...");
            this.emit('status', 'Requesting Camera Access...');

            // Timeout warning if it takes too long (e.g., user prompt ignored or system hang)
            const timeoutId = setTimeout(() => {
                this.emit('status', 'Waiting for PERMISSION... Check browser popup!');
            }, 3000);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            clearTimeout(timeoutId);

            this.video.srcObject = stream;

            this.video.addEventListener('loadeddata', () => {
                this.webcamRunning = true;
                this.video.play()
                    .then(() => {
                        console.log("Webcam playing.");
                        this.emit('status', 'Camera Active. Raise Hand.');
                    })
                    .catch(e => {
                        console.error("Video Play Error:", e);
                        this.emit('error', "Video stream failed to play.");
                    });
            });
        } catch (err) {
            console.error("Error accessing webcam:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                this.emit('error', "Camera Permission DENIED. Click the lock icon in URL bar.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                this.emit('error', "No Camera Found. Check connection.");
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                this.emit('error', "Camera in use by another app (Zoom/Teams?). Close them.");
            } else {
                this.emit('error', `Camera Error: ${err.message}`);
            }
        }
    }

    update() {
        if (!this.handLandmarker || !this.webcamRunning) return;

        let startTimeMs = performance.now();
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            this.results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
        }

        if (this.results && this.results.landmarks) {
            // Emit gesture events
            // Simple logic: If hand detected -> 'HAND_DETECTED'
            for (const landmarks of this.results.landmarks) {
                this.processLandmarks(landmarks);
            }
        }
    }

    processLandmarks(landmarks) {
        // Index finger tip: 8, Thumb tip: 4
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        // Calculate distance for pinch detection
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2) +
            Math.pow(thumbTip.z - indexTip.z, 2)
        );

        // Interaction Point (Midpoint between thumb and index)
        const interactionX = (thumbTip.x + indexTip.x) / 2;
        const interactionY = (thumbTip.y + indexTip.y) / 2;

        // Convert to Normalized Device Coordinates (NDS) for Three.js
        // MediaPipe: x [0, 1] (left-right), y [0, 1] (top-bottom)
        // Three.js: x [-1, 1] (left-right), y [-1, 1] (bottom-top)
        const ndsX = -((interactionX * 2) - 1); // FLIPPED for mirror mode
        const ndsY = -(interactionY * 2) + 1; // Invert Y

        // Hysteresis (State debounce could be added here)
        let gestureType = distance < 0.08 ? 'PINCH' : 'OPEN'; // Adjusted threshold

        // Use index finger tip for "Hover" (OPEN) and Midpoint for "Drag" (PINCH)?
        // Let's stick to midpoint for consistency.

        this.emit('gesture', {
            type: gestureType,
            position: { x: ndsX, y: ndsY },
            rawDistance: distance
        });
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}
