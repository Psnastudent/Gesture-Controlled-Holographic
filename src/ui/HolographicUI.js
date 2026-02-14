export class HolographicUI {
    constructor() {
        this.uiLayer = document.getElementById('ui-layer');

        this.statusElement = document.createElement('div');
        this.statusElement.classList.add('holo-panel');
        this.statusElement.style.position = 'absolute';
        this.statusElement.style.bottom = '20px';
        this.statusElement.style.left = '20px';
        this.statusElement.innerHTML = 'System Standby...';

        this.researchPanel = document.createElement('div');
        this.researchPanel.classList.add('holo-panel');
        this.researchPanel.style.position = 'absolute';
        this.researchPanel.style.top = '20px';
        this.researchPanel.style.right = '20px';
        this.researchPanel.style.textAlign = 'right';
        this.researchPanel.innerHTML = '<strong>Data Link</strong><br>Waiting for input...';

        this.uiLayer.appendChild(this.statusElement);
        this.uiLayer.appendChild(this.researchPanel);

        // Onboarding Overlay
        this.overlay = document.createElement('div');
        this.overlay.style.position = 'absolute';
        this.overlay.style.top = '50%';
        this.overlay.style.left = '50%';
        this.overlay.style.transform = 'translate(-50%, -50%)';
        this.overlay.style.color = '#ffffff';
        this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        this.overlay.style.padding = '20px';
        this.overlay.style.borderRadius = '10px';
        this.overlay.style.textAlign = 'center';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.innerHTML = `
            <h2>HoloResearch Interface</h2>
            <p>1. Allow Camera Access</p>
            <p>2. Raise hand to detect</p>
            <p>3. <strong>Pinch</strong> to Grab & Drag Atoms</p>
            <p>4. Bring Atoms close to Bond</p>
        `;
        this.uiLayer.appendChild(this.overlay);

        // Fade out
        setTimeout(() => {
            this.overlay.style.transition = 'opacity 1s';
            this.overlay.style.opacity = '0';
        }, 8000);
    }

    updateReseachData(data) {
        this.researchPanel.innerHTML = `
            <strong>${data.name}</strong><br>
            <span style="font-size: 0.8em">${data.properties}</span>
        `;
    }

    updateGestureStatus(status) {
        this.statusElement.innerHTML = `STATUS: <strong>${status}</strong>`;

        if (status === 'PINCH') {
            this.statusElement.classList.add('active-gesture');
        } else {
            this.statusElement.classList.remove('active-gesture');
        }
    }

    showError(msg) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('holo-panel');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.borderColor = '#ff0000';
        errorDiv.style.color = '#ff0000';
        errorDiv.style.zIndex = '100';
        errorDiv.innerHTML = `
            <h3>SYSTEM ERROR</h3>
            <p>${msg}</p>
            <button onclick="location.reload()" style="background:transparent; border:1px solid red; color:red; padding:10px; cursor:pointer;">REBOOT SYSTEM</button>
        `;
        this.uiLayer.appendChild(errorDiv);

        // Remove onboarding if error occurs
        if (this.overlay) this.overlay.style.display = 'none';
    }
}
