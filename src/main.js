import '../style.css';
import { SceneManager } from './scene/SceneManager.js';
import { GestureManager } from './gesture/GestureManager.js';
import { HolographicUI } from './ui/HolographicUI.js';
import Stats from 'stats.js';

class App {
    constructor() {
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.sceneManager = new SceneManager();
        this.ui = new HolographicUI();
        this.gestureManager = new GestureManager();

        this.lastTime = 0;
        this.animate = this.animate.bind(this);
    }

    async init() {
        console.log("Initializing App...");

        // Initialize Scene FIRST
        this.sceneManager.init();

        // Start Render Loop IMMEDIATELY (after scene is ready)
        this.animate(0);

        // Mouse Support (Fallback)
        window.addEventListener('mousemove', (e) => {
            // Convert to NDS
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Emulate a "OPEN" gesture for move, "PINCH" for click (mousedown)
            // We need to store this state
            if (!this.mouseDown) {
                this.sceneManager.handleGesture({
                    type: 'OPEN',
                    position: { x, y }
                });
            } else {
                this.sceneManager.handleGesture({
                    type: 'PINCH',
                    position: { x, y }
                });
            }
        });

        window.addEventListener('mousedown', () => { this.mouseDown = true; });
        window.addEventListener('mouseup', () => { this.mouseDown = false; });

        // Initialize Gestures (Async - won't block render now)
        try {
            console.log("Starting Camera for Hand Tracking...");
            await this.gestureManager.init();
        } catch (e) {
            console.warn("Gesture Manager failed:", e);
            this.ui.showError("Camera Failed. Using MOUSE MODE.");
        }

        // Connect Gestures to UI and Scene
        this.gestureManager.on('videoFrame', (video) => {
            // Optional: Pass video frame to texture if needed
        });

        this.gestureManager.on('gesture', (data) => {
            this.ui.updateGestureStatus(data.type);
            this.sceneManager.handleGesture(data);
        });

        this.gestureManager.on('error', (msg) => {
            this.ui.showError(msg);
        });

        this.gestureManager.on('status', (msg) => {
            this.ui.updateGestureStatus(msg);
        });

        // Research Updates
        window.addEventListener('research-update', (e) => {
            this.ui.updateReseachData(e.detail);
        });

        // Start Loop handled at top of init
        console.log("App Initialized. Mouse Mode Active.");
    }

    animate(timestamp) {
        requestAnimationFrame(this.animate);
        this.stats.begin();

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.sceneManager.update(deltaTime);
        this.gestureManager.update();

        this.stats.end();
    }
}

const app = new App();

// On-Screen Logger for Debugging
(function () {
    const logDiv = document.createElement('div');
    logDiv.style.position = 'fixed';
    logDiv.style.top = '0';
    logDiv.style.left = '0';
    logDiv.style.width = '100%';
    logDiv.style.height = '150px';
    logDiv.style.background = 'rgba(0,0,0,0.7)';
    logDiv.style.color = '#00ff00';
    logDiv.style.fontFamily = 'monospace';
    logDiv.style.fontSize = '12px';
    logDiv.style.overflowY = 'scroll';
    logDiv.style.zIndex = '9999';
    logDiv.style.pointerEvents = 'none';
    document.body.appendChild(logDiv);

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function append(msg, color) {
        const line = document.createElement('div');
        line.style.color = color;
        line.innerText = `> ${msg}`;
        logDiv.appendChild(line);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    console.log = function (...args) {
        originalLog.apply(console, args);
        append(args.join(' '), '#00ff00');
    };

    console.error = function (...args) {
        originalError.apply(console, args);
        append(args.join(' '), '#ff0000');
    };

    console.warn = function (...args) {
        originalWarn.apply(console, args);
        append(args.join(' '), '#ffff00');
    };

    window.onerror = function (msg, url, line) {
        append(`Global Error: ${msg} (${line})`, '#ff00ff');
    };
})();

app.init();
