class RisleyPrismSimulator {
    constructor() {
        this.outputCanvas = document.getElementById('outputCanvas');
        this.outputCtx = this.outputCanvas.getContext('2d');
        this.sideViewCanvas = document.getElementById('sideViewCanvas');
        this.sideViewCtx = this.sideViewCanvas.getContext('2d');
        
        // System parameters (in mm)
        this.params = {
            wedgeAngle: 11.367 * Math.PI / 180,  // radians
            refractiveIndex: 1.516,
            prismThickness: 8.11,  // mm
            prismDiameter: 25.4,   // mm
            prismSeparation: 10,   // mm
            screenDistance: 200,   // mm
        };
        
        // Rays
        this.rays = [];
        this.maxRays = 10;
        this.selectedRay = null;
        this.hoveredPoint = null;
        
        // Animation
        this.animating = false;
        this.animationSpeed = 1;
        this.time = 0;
        
        // Prism angles
        this.prism1Angle = 0;
        this.prism2Angle = 0;
        this.targetPrism1Angle = 0;
        this.targetPrism2Angle = 0;
        
        // Colors
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFA07A', '#98D8C8', '#6C5CE7', '#FD79A8',
            '#FDCB6E', '#6C63FF'
        ];
        
        // Initialize
        this.updateCalculatedParams();
        this.setupCanvases();
        this.setupEventListeners();
        this.animate();
    }
    
    setupCanvases() {
        // Setup output canvas (top view of screen)
        const container = this.outputCanvas.parentElement;
        const size = Math.min(container.clientWidth - 40, container.clientHeight - 40);
        this.outputCanvas.width = size;
        this.outputCanvas.height = size;
        
        // Setup side view canvas
        const sideContainer = this.sideViewCanvas.parentElement;
        this.sideViewCanvas.width = sideContainer.clientWidth - 30;
        this.sideViewCanvas.height = 140;
        
        window.addEventListener('resize', () => {
            const newSize = Math.min(container.clientWidth - 40, container.clientHeight - 40);
            this.outputCanvas.width = newSize;
            this.outputCanvas.height = newSize;
            
            this.sideViewCanvas.width = sideContainer.clientWidth - 30;
            this.drawOutputView();
            this.drawSideView();
        });
    }
    
    updateCalculatedParams() {
        const alpha = this.params.wedgeAngle;
        const n = this.params.refractiveIndex;
        const S = this.params.prismSeparation;
        const z = this.params.screenDistance;
        const T = this.params.prismThickness;
        
        // Small angle approximation
        const phi_o = (n - 1) * alpha;
        
        // Beam steering radii
        this.r1 = z * Math.tan(phi_o);
        this.r2 = z * Math.tan(phi_o);
        
        // Center defect
        const phi_i = alpha;
        const phi_p = phi_i / n;
        this.rd = 2 * T * Math.tan(phi_i - phi_p) + S * Math.tan(phi_o);
        
        // Maximum range
        this.rmax = this.r1 + this.r2 + this.rd;
        
        // Update display
        document.getElementById('maxRange').textContent = this.rmax.toFixed(1) + ' mm';
        document.getElementById('centerDefect').textContent = this.rd.toFixed(1) + ' mm';
    }
    
    setupEventListeners() {
        // Output canvas click and hover
        this.outputCanvas.addEventListener('click', (e) => this.handleOutputClick(e));
        this.outputCanvas.addEventListener('mousemove', (e) => this.handleOutputHover(e));
        this.outputCanvas.addEventListener('mouseleave', () => {
            this.hoveredPoint = null;
            document.getElementById('coordInfo').textContent = 'x: 0.0, y: 0.0 mm';
        });
        
        // Controls
        document.getElementById('wedgeAngle').addEventListener('input', (e) => {
            this.params.wedgeAngle = parseFloat(e.target.value) * Math.PI / 180;
            this.updateCalculatedParams();
            document.getElementById('wedgeAngleValue').textContent = parseFloat(e.target.value).toFixed(1) + '°';
            this.recalculateAllRays();
        });
        
        document.getElementById('refractiveIndex').addEventListener('input', (e) => {
            this.params.refractiveIndex = parseFloat(e.target.value);
            this.updateCalculatedParams();
            document.getElementById('refractiveIndexValue').textContent = parseFloat(e.target.value).toFixed(3);
            this.recalculateAllRays();
        });
        
        document.getElementById('prismSeparation').addEventListener('input', (e) => {
            this.params.prismSeparation = parseFloat(e.target.value);
            this.updateCalculatedParams();
            document.getElementById('prismSeparationValue').textContent = e.target.value + ' mm';
            this.recalculateAllRays();
        });
        
        document.getElementById('screenDistance').addEventListener('input', (e) => {
            this.params.screenDistance = parseFloat(e.target.value);
            this.updateCalculatedParams();
            document.getElementById('screenDistanceValue').textContent = e.target.value + ' mm';
            this.recalculateAllRays();
        });
        
        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            document.getElementById('animationSpeedValue').textContent = parseFloat(e.target.value).toFixed(1) + 'x';
        });
        
        document.getElementById('clearRays').addEventListener('click', () => this.clearAllRays());
        document.getElementById('addRandomRay').addEventListener('click', () => this.addRandomRay());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('toggleAnimation').addEventListener('click', (e) => {
            this.animating = !this.animating;
            e.target.textContent = this.animating ? 'Stop Animation' : 'Start Animation';
            document.getElementById('animStatus').textContent = this.animating ? 'On' : 'Off';
        });
    }
    
    handleOutputClick(event) {
        const rect = this.outputCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert to mm coordinates
        const centerX = this.outputCanvas.width / 2;
        const centerY = this.outputCanvas.height / 2;
        const scale = (this.outputCanvas.width - 60) / (2 * this.rmax * 1.2);
        
        const xmm = (x - centerX) / scale;
        const ymm = -(y - centerY) / scale;  // Flip y-axis
        
        this.addRay(xmm, ymm);
    }
    
    handleOutputHover(event) {
        const rect = this.outputCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert to mm coordinates
        const centerX = this.outputCanvas.width / 2;
        const centerY = this.outputCanvas.height / 2;
        const scale = (this.outputCanvas.width - 60) / (2 * this.rmax * 1.2);
        
        const xmm = (x - centerX) / scale;
        const ymm = -(y - centerY) / scale;
        
        this.hoveredPoint = { x: xmm, y: ymm };
        document.getElementById('coordInfo').textContent = `x: ${xmm.toFixed(1)}, y: ${ymm.toFixed(1)} mm`;
    }
    
    addRay(x, y) {
        if (this.rays.length >= this.maxRays) {
            alert(`Maximum ${this.maxRays} rays allowed`);
            return;
        }
        
        const r = Math.sqrt(x * x + y * y);
        if (r < this.rd) {
            alert('Target is in center defect region - unreachable');
            return;
        }
        if (r > this.rmax) {
            alert('Target is outside maximum scan range');
            return;
        }
        
        const angles = this.calculatePrismAngles(x, y);
        
        const ray = {
            id: Date.now(),
            targetX: x,
            targetY: y,
            theta1: angles.theta1,
            theta2: angles.theta2,
            color: this.colors[this.rays.length % this.colors.length],
        };
        
        this.rays.push(ray);
        this.selectRay(ray);
        this.updateRayList();
    }
    
    calculatePrismAngles(x, y) {
        const r1_rd = this.r1 + this.rd;
        const r2 = this.r2;
        const rSquared = x * x + y * y;
        const r = Math.sqrt(rSquared);
        
        if (r === 0) {
            return { theta1: 0, theta2: 0 };
        }
        
        // Calculate theta1
        const cosArg1 = (rSquared + r1_rd * r1_rd - r2 * r2) / (2 * r1_rd * r);
        const theta1 = Math.acos(Math.max(-1, Math.min(1, cosArg1))) + Math.atan2(y, x);
        
        // Calculate theta2  
        const cosArg2 = (rSquared - r1_rd * r1_rd + r2 * r2) / (2 * r2 * r);
        const theta2 = Math.acos(Math.max(-1, Math.min(1, cosArg2))) + Math.atan2(y, x);
        
        return { theta1, theta2 };
    }
    
    selectRay(ray) {
        this.selectedRay = ray;
        if (ray) {
            this.targetPrism1Angle = ray.theta1;
            this.targetPrism2Angle = ray.theta2;
            document.getElementById('theta1Display').textContent = 
                (ray.theta1 * 180 / Math.PI).toFixed(1) + '°';
            document.getElementById('theta2Display').textContent = 
                (ray.theta2 * 180 / Math.PI).toFixed(1) + '°';
        }
        this.updateRayList();
    }
    
    removeRay(rayId) {
        this.rays = this.rays.filter(r => r.id !== rayId);
        if (this.selectedRay && this.selectedRay.id === rayId) {
            this.selectedRay = this.rays.length > 0 ? this.rays[0] : null;
            if (this.selectedRay) {
                this.selectRay(this.selectedRay);
            } else {
                document.getElementById('theta1Display').textContent = '0.0°';
                document.getElementById('theta2Display').textContent = '0.0°';
            }
        }
        this.updateRayList();
    }
    
    clearAllRays() {
        this.rays = [];
        this.selectedRay = null;
        this.updateRayList();
        document.getElementById('theta1Display').textContent = '0.0°';
        document.getElementById('theta2Display').textContent = '0.0°';
    }
    
    addRandomRay() {
        const angle = Math.random() * Math.PI * 2;
        const minR = this.rd * 1.5;
        const maxR = this.rmax * 0.8;
        const r = minR + Math.random() * (maxR - minR);
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        this.addRay(x, y);
    }
    
    exportData() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `risley_prism_data_${timestamp}.txt`;
        
        let content = '========================================\n';
        content += 'RISLEY PRISM SIMULATOR - DATA EXPORT\n';
        content += '========================================\n\n';
        
        content += `Export Date: ${new Date().toLocaleString()}\n\n`;
        
        content += '--- SYSTEM PARAMETERS ---\n';
        content += `Wedge Angle (α): ${(this.params.wedgeAngle * 180 / Math.PI).toFixed(3)}°\n`;
        content += `Refractive Index (n): ${this.params.refractiveIndex.toFixed(4)}\n`;
        content += `Prism Thickness: ${this.params.prismThickness.toFixed(2)} mm\n`;
        content += `Prism Diameter: ${this.params.prismDiameter.toFixed(2)} mm\n`;
        content += `Prism Separation: ${this.params.prismSeparation.toFixed(2)} mm\n`;
        content += `Screen Distance: ${this.params.screenDistance.toFixed(2)} mm\n\n`;
        
        content += '--- CALCULATED PARAMETERS ---\n';
        content += `Maximum Scan Range (r_max): ${this.rmax.toFixed(3)} mm\n`;
        content += `Center Defect Radius (r_d): ${this.rd.toFixed(3)} mm\n`;
        content += `Beam Steering Radius 1 (r_1): ${this.r1.toFixed(3)} mm\n`;
        content += `Beam Steering Radius 2 (r_2): ${this.r2.toFixed(3)} mm\n\n`;
        
        content += '--- ACTIVE RAYS ---\n';
        if (this.rays.length === 0) {
            content += 'No active rays\n';
        } else {
            content += `Total Active Rays: ${this.rays.length}\n\n`;
            content += 'Ray#\tTarget_X(mm)\tTarget_Y(mm)\tRadius(mm)\tTheta1(deg)\tTheta2(deg)\tColor\n';
            content += '----\t------------\t------------\t----------\t-----------\t-----------\t-----\n';
            
            this.rays.forEach((ray, index) => {
                const radius = Math.sqrt(ray.targetX * ray.targetX + ray.targetY * ray.targetY);
                content += `${index + 1}\t`;
                content += `${ray.targetX.toFixed(3)}\t\t`;
                content += `${ray.targetY.toFixed(3)}\t\t`;
                content += `${radius.toFixed(3)}\t\t`;
                content += `${(ray.theta1 * 180 / Math.PI).toFixed(3)}\t\t`;
                content += `${(ray.theta2 * 180 / Math.PI).toFixed(3)}\t\t`;
                content += `${ray.color}\n`;
            });
        }
        
        content += '\n--- NOTES ---\n';
        content += 'This data was exported from the Risley Prism Simulator\n';
        content += 'Based on discrete beam pointing using inverse kinematics (Section 4.3)\n';
        content += 'Angles are measured from the home position (θ = 90°) where the thickest part of the prism is at the top\n';
        
        // Create and download the file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show confirmation
        alert(`Data exported successfully as ${filename}`);
    }
    
    recalculateAllRays() {
        this.rays.forEach(ray => {
            const angles = this.calculatePrismAngles(ray.targetX, ray.targetY);
            ray.theta1 = angles.theta1;
            ray.theta2 = angles.theta2;
        });
        if (this.selectedRay) {
            this.targetPrism1Angle = this.selectedRay.theta1;
            this.targetPrism2Angle = this.selectedRay.theta2;
            document.getElementById('theta1Display').textContent = 
                (this.selectedRay.theta1 * 180 / Math.PI).toFixed(1) + '°';
            document.getElementById('theta2Display').textContent = 
                (this.selectedRay.theta2 * 180 / Math.PI).toFixed(1) + '°';
        }
    }
    
    updateRayList() {
        const rayList = document.getElementById('rayList');
        document.getElementById('activeRays').textContent = `${this.rays.length}/10`;
        
        if (this.rays.length === 0) {
            rayList.innerHTML = `
                <div style="text-align: center; color: #999; padding: 20px; font-size: 12px;">
                    No rays added yet
                </div>
            `;
            return;
        }
        
        rayList.innerHTML = this.rays.map((ray, index) => `
            <div class="ray-item ${ray === this.selectedRay ? 'selected' : ''}" 
                 style="border-color: ${ray.color};"
                 onclick="simulator.selectRay(simulator.rays[${index}])">
                <div class="ray-info">
                    <div style="font-weight: 500;">Ray ${index + 1}</div>
                    <div class="ray-coords">
                        Target: (${ray.targetX.toFixed(1)}, ${ray.targetY.toFixed(1)}) mm
                    </div>
                    <div class="ray-angles">
                        <span>θ₁: ${(ray.theta1 * 180 / Math.PI).toFixed(1)}°</span>
                        <span>θ₂: ${(ray.theta2 * 180 / Math.PI).toFixed(1)}°</span>
                    </div>
                </div>
                <button class="ray-remove" onclick="event.stopPropagation(); simulator.removeRay(${ray.id})">×</button>
            </div>
        `).join('');
    }
    
    animate() {
        if (this.animating) {
            this.time += 0.016 * this.animationSpeed;
            
            // Smooth rotation
            const lerpFactor = 0.1 * this.animationSpeed;
            this.prism1Angle += (this.targetPrism1Angle - this.prism1Angle) * lerpFactor;
            this.prism2Angle += (this.targetPrism2Angle - this.prism2Angle) * lerpFactor;
        }
        
        this.drawOutputView();
        this.drawSideView();
        requestAnimationFrame(() => this.animate());
    }
    
    drawOutputView() {
        const ctx = this.outputCtx;
        const width = this.outputCanvas.width;
        const height = this.outputCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = (width - 60) / (2 * this.rmax * 1.2);
        
        // Draw grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        // Grid lines
        const gridSpacing = 10; // mm
        const maxGrid = Math.ceil(this.rmax * 1.2 / gridSpacing) * gridSpacing;
        
        for (let i = -maxGrid; i <= maxGrid; i += gridSpacing) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(centerX + i * scale, 20);
            ctx.lineTo(centerX + i * scale, height - 20);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(20, centerY + i * scale);
            ctx.lineTo(width - 20, centerY + i * scale);
            ctx.stroke();
        }
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // X axis
        ctx.beginPath();
        ctx.moveTo(20, centerY);
        ctx.lineTo(width - 20, centerY);
        ctx.stroke();
        
        // Y axis
        ctx.beginPath();
        ctx.moveTo(centerX, 20);
        ctx.lineTo(centerX, height - 20);
        ctx.stroke();
        
        // Axis labels
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('X (mm)', width - 30, centerY - 5);
        ctx.save();
        ctx.translate(centerX + 5, 30);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Y (mm)', 0, 0);
        ctx.restore();
        
        // Draw scan area boundary
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.rmax * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw center defect
        ctx.fillStyle = 'rgba(244, 67, 54, 0.1)';
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.rd * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Center defect label
        ctx.fillStyle = '#f44336';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Center Defect', centerX, centerY);
        
        // Draw prism indicators (small squares)
        if (this.animating || this.selectedRay) {
            ctx.save();
            
            // Prism 1
            ctx.fillStyle = '#4CAF50';
            ctx.translate(centerX - 40, 30);
            ctx.rotate(this.prism1Angle);
            ctx.fillRect(-10, -10, 20, 20);
            ctx.restore();
            
            ctx.fillStyle = '#666';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('P1', centerX - 40, 55);
            
            // Prism 2
            ctx.save();
            ctx.fillStyle = '#FF9800';
            ctx.translate(centerX + 40, 30);
            ctx.rotate(this.prism2Angle);
            ctx.fillRect(-10, -10, 20, 20);
            ctx.restore();
            
            ctx.fillText('P2', centerX + 40, 55);
        }
        
        // Draw rays
        this.rays.forEach(ray => {
            const x = centerX + ray.targetX * scale;
            const y = centerY - ray.targetY * scale;  // Flip y-axis
            
            ctx.fillStyle = ray.color;
            ctx.beginPath();
            ctx.arc(x, y, ray === this.selectedRay ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
            
            if (ray === this.selectedRay) {
                ctx.strokeStyle = ray.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.stroke();
                
                // Show coordinates
                ctx.fillStyle = ray.color;
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`(${ray.targetX.toFixed(1)}, ${ray.targetY.toFixed(1)})`, 
                           x, y - 15);
            }
        });
        
        // Draw hover point
        if (this.hoveredPoint) {
            const x = centerX + this.hoveredPoint.x * scale;
            const y = centerY - this.hoveredPoint.y * scale;
            
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(x - 10, y);
            ctx.lineTo(x + 10, y);
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x, y + 10);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawSideView() {
        const ctx = this.sideViewCtx;
        const width = this.sideViewCanvas.width;
        const height = this.sideViewCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const centerY = height / 2;
        const scale = width / (this.params.screenDistance + 100);
        
        // Draw optical axis
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(20, centerY);
        ctx.lineTo(width - 20, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw laser source
        ctx.fillStyle = '#333';
        ctx.fillRect(20, centerY - 10, 20, 20);
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(40, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw prisms
        const prism1X = 100;
        const prism2X = 100 + this.params.prismSeparation * scale;
        
        // Prism 1
        ctx.save();
        ctx.translate(prism1X, centerY);
        ctx.rotate(this.prism1Angle);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.lineTo(15, -20);
        ctx.lineTo(15, 20);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        
        // Prism 2
        ctx.save();
        ctx.translate(prism2X, centerY);
        ctx.rotate(this.prism2Angle);
        ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.lineTo(15, -20);
        ctx.lineTo(15, 20);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        
        // Draw screen
        const screenX = prism2X + this.params.screenDistance * scale;
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(screenX - 2, centerY - 40, 4, 80);
        
        // Draw rays
        if (this.selectedRay) {
            ctx.strokeStyle = this.selectedRay.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            
            // Simple ray path
            ctx.beginPath();
            ctx.moveTo(40, centerY);
            ctx.lineTo(prism1X, centerY);
            
            const deflection1 = Math.sin(this.prism1Angle) * 10;
            ctx.lineTo(prism2X, centerY + deflection1);
            
            const finalY = centerY - this.selectedRay.targetY * scale * 0.3;
            ctx.lineTo(screenX, finalY);
            ctx.stroke();
            
            // Mark target on screen
            ctx.fillStyle = this.selectedRay.color;
            ctx.beginPath();
            ctx.arc(screenX, finalY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
        }
        
        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Laser', 30, centerY + 25);
        ctx.fillText('P1', prism1X, centerY + 35);
        ctx.fillText('P2', prism2X, centerY + 35);
        ctx.fillText('Screen', screenX, centerY + 55);
    }
}

// Initialize simulator
let simulator;
document.addEventListener('DOMContentLoaded', () => {
    simulator = new RisleyPrismSimulator();
});