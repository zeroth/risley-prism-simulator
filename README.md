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

## Beam Modes

The simulator supports two distinct beam propagation modes that determine how the prisms are controlled:

### Divergent Mode (Default)
In divergent mode, rays naturally diverge from the optical center, similar to how light spreads from a point source.

**Characteristics:**
- Each ray has independently calculated prism angles (θ₁ ≠ θ₂ in most cases)
- Prisms rotate to different angles to steer the beam to the target
- The output beam diverges at an angle determined by the target position
- Mimics natural beam propagation through optical systems
- Best for applications where beam divergence is acceptable or desired

**Use Cases:**
- Laser marking or engraving systems
- Scanning applications where divergence is not critical
- Target tracking systems
- General beam steering applications

**Physics:**
In this mode, the two prisms work together with different rotation angles to both deflect and steer the beam. The combination of different prism angles creates a net deflection that positions the beam at the target while allowing natural divergence.

### Parallel Mode
In parallel mode, all output rays exit parallel to the optical axis (center axis), creating beams with no angular deviation regardless of their target position.

**Characteristics:**
- Prisms rotate to complementary angles (θ₁ ≠ θ₂) that cancel angular deviation
- All output beams are parallel to the optical axis (0° angle of propagation)
- The beam is laterally displaced to reach the target position
- No angular deviation is introduced - pure lateral translation
- Every ray travels straight forward after exiting the prism system

**Visual Representation:**
```
Side View - Parallel Mode:
        P1    P2       Screen
Light → ═╗    ╔═ → ═══ → Target (0, 20)
         ║    ║
Light → ═╝    ╚═ → ═══ → Target (0, -20)

All exit rays are parallel to the optical axis (horizontal lines)
```

**Use Cases:**
- Telecentric imaging systems where rays must be perpendicular to the image plane
- Lithography and semiconductor inspection requiring perpendicular incidence
- Metrology systems needing consistent beam angles
- Parallel processing systems where multiple beams must maintain the same direction
- Applications where angular deviation would cause distortion or measurement errors

**Physics:**
In this mode, the two prisms are oriented at carefully calculated angles where:
1. **Prism 1** deflects the beam at an angle toward the target
2. **Prism 2** deflects the beam by an equal but opposite angle to cancel the angular deviation
3. The net result is lateral displacement without angular change

The prism angles are calculated such that:
- θ₁ = target_angle - deflection_offset
- θ₂ = target_angle + deflection_offset

This configuration ensures that while the beam is displaced laterally to reach the target position, it exits parallel to the optical axis with zero angular deviation.

### Mode Comparison

| Aspect | Divergent Mode | Parallel Mode |
|--------|---------------|---------------|
| **Exit Angle** | Varies with position | Always 0° (parallel to axis) |
| **Prism Angles** | Usually θ₁ ≠ θ₂ | Always θ₁ ≠ θ₂ (complementary) |
| **Beam Path** | Angled trajectory | Straight forward trajectory |
| **Application** | General scanning | Telecentric systems |
| **Spot Size** | Varies with angle | Consistent across field |
| **Example θ₁, θ₂** | 45°, 135° | 40°, 50° |

### Mode Selection Impact

**On Ray Management:**
- When switching modes, all existing rays are automatically recalculated
- New rays added will follow the selected mode's calculation method
- The mode affects both manual ray placement and programmatic patterns

**On Prism Control:**
- **Divergent Mode:** Prisms rotate independently to achieve optimal beam steering with natural divergence
- **Parallel Mode:** Prisms rotate to complementary angles that cancel angular deviation while maintaining position

**Visual Indicators:**
- The mode description updates in real-time
- Prism angle displays show the calculated values for each mode
- The side view visualization reflects the beam propagation characteristics
- In parallel mode, all rays should appear parallel to the optical axis in the side view

## Usage

1. **Select Beam Mode:** Choose between Divergent (default) or Parallel mode based on your application requirements.

2. **Adjust System Parameters:** Use the sliders to modify wedge angle, refractive index, prism separation, and screen distance.

3. **Add Target Points:** Click anywhere on the output view grid to add a target point. The simulator will automatically calculate the required prism angles based on the selected mode.

4. **Manage Rays:** 
   - Add up to 10 simultaneous target points
   - Each ray is color-coded for easy identification
   - Click on a ray in the list to select it
   - Drag ray points to reposition them
   - Edit target positions (X, Y) directly in the ray list
   - Adjust prism angles (θ₁, θ₂) manually in radians with degree display
   - Remove individual rays with the × button

5. **Quick Patterns:** Use convenience buttons to add pre-configured ray patterns:
   - "4 Rays on X" - Creates 4 evenly spaced rays along the X-axis
   - "4 Rays on Y" - Creates 4 evenly spaced rays along the Y-axis

6. **Animation:** Enable animation to see smooth transitions between target positions.

7. **Export Data:** Click "Export Data" to save all system parameters and ray information (including both degrees and radians) to a text file for analysis.

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