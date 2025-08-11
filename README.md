# Risley Prism Simulator

A web-based simulator for discrete beam pointing using Risley prisms based on inverse kinematics principles (Section 4.3 of the Risley Prism Scanner Application Note).

## Overview

This simulator demonstrates how two counter-rotating wedge prisms can steer a laser beam to discrete points on a target screen. The simulator uses inverse kinematics to calculate the required rotation angles for each prism to direct the beam to a desired (x,y) position.

## System Parameters

### Input Parameters

#### **Wedge Angle (α)**
- **Range:** 5° to 20°
- **Default:** 11.367°
- **Description:** The angle of the wedge-shaped prism. This is the angle between the two faces of the prism. A larger wedge angle provides greater beam deflection capability but also increases aberrations.

#### **Refractive Index (n)**
- **Range:** 1.4 to 1.8
- **Default:** 1.516 (typical for BK7 optical glass)
- **Description:** The refractive index of the prism material. This determines how much light bends when entering and exiting the prism. Common materials:
  - BK7 Glass: n ≈ 1.516
  - Fused Silica: n ≈ 1.458
  - SF11 Glass: n ≈ 1.785

#### **Prism Separation (S)**
- **Range:** 5 mm to 50 mm
- **Default:** 10 mm
- **Description:** The physical distance between the two prisms along the optical axis. Increasing separation can reduce the center defect region but may increase system size.

#### **Screen Distance (z)**
- **Range:** 100 mm to 500 mm
- **Default:** 200 mm
- **Description:** The distance from the second prism to the output screen/target plane where the beam position is measured.

### Calculated Parameters

#### **Maximum Scan Range (r_max)**
- **Formula:** r_max = r₁ + r₂ + r_d
- **Description:** The maximum radius that can be reached by the beam on the target screen. Points beyond this radius are unreachable.

#### **Center Defect Radius (r_d)**
- **Description:** The radius of the unreachable region at the center of the scan area. This "blind spot" occurs because the prisms cannot fully cancel each other's deflection at certain angles.
- **Formula:** r_d = 2T·tan(φᵢ - φₚ) + S·tan(φₒ)
  - Where T is prism thickness
  - φᵢ is the incident angle
  - φₚ is the refracted angle inside the prism
  - φₒ is the output deflection angle

#### **Beam Steering Radii (r₁, r₂)**
- **Formula:** r₁ = r₂ = z·tan(φₒ), where φₒ = (n-1)·α (small angle approximation)
- **Description:** The individual contribution of each prism to the beam deflection. In the symmetric case, both prisms contribute equally.

### Prism Angles

#### **Theta 1 (θ₁)**
- **Description:** The rotation angle of the first prism from its home position
- **Range:** 0° to 360°
- **Calculated using inverse kinematics based on target position**

#### **Theta 2 (θ₂)**
- **Description:** The rotation angle of the second prism from its home position
- **Range:** 0° to 360°
- **Calculated using inverse kinematics based on target position**

## Physics Principles

### Small Angle Approximation
For small wedge angles, the beam deflection can be approximated as:
- φₒ ≈ (n - 1) × α

This simplification makes real-time calculations feasible while maintaining reasonable accuracy for wedge angles under 20°.

### Inverse Kinematics
Given a target position (x, y) on the screen, the required prism angles are calculated using:

```
θ₁ = arccos((r² + r₁² - r₂²)/(2·r₁·r)) + atan2(y, x)
θ₂ = arccos((r² - r₁² + r₂²)/(2·r₂·r)) + atan2(y, x)
```

Where r = √(x² + y²) is the target radius.

## Usage

1. **Adjust System Parameters:** Use the sliders to modify wedge angle, refractive index, prism separation, and screen distance.

2. **Add Target Points:** Click anywhere on the output view grid to add a target point. The simulator will automatically calculate the required prism angles.

3. **Manage Rays:** 
   - Add up to 10 simultaneous target points
   - Each ray is color-coded for easy identification
   - Click on a ray in the list to select it
   - Remove individual rays with the × button

4. **Animation:** Enable animation to see smooth transitions between target positions.

5. **Export Data:** Click "Export Data" to save all system parameters and ray information to a text file for analysis.

## Limitations

- **Center Defect:** The circular region at the center cannot be reached due to the physical limitations of the prism system.
- **Maximum Range:** Points beyond the maximum scan radius cannot be reached with the current parameters.
- **Small Angle Approximation:** Accuracy decreases for very large wedge angles (>20°).

## File Structure

```
Risley_Prism_Simulator/
├── index.html       # Main HTML structure
├── styles.css       # All styling rules
├── simulator.js     # Core simulation logic
└── README.md        # This file
```

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- No external dependencies required
- Fully client-side computation
- Responsive design for various screen sizes

## References

Based on the discrete beam pointing principles described in Section 4.3 of the Risley Prism Scanner Application Note, implementing inverse kinematics for precise beam positioning.