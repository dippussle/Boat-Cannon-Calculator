# Minecraft Boat Cannon Calculator (Lazy Chunk 2D Edition)

A clean, web-based tool for calculating stacked boat counts and tick timings for Minecraft boat cannons using lazy chunk acceleration and powder snow momentum brakes.

## Features
- **2D Kinematic Trajectory**: Calculates precise X/Z horizontal displacement.
- **Empirical Velocity Model**: Calibrated using in-game entity telemetry (`0.0413265304548704` blocks/boat-tick).
- **Powder Snow Version Selector**:
  - `1.21.9+ (0.95 multiplier)`
  - `Pre-1.21.9 (0.90 multiplier)`
- **Cannon Delay Timing**: Adjust for repeater/piston startup delays.
- **Instant Teleport Command Generator**: Copy `/tp @p X ~ Z` directly into Minecraft.

## Usage
1. Open `index.html` in any browser.
2. Enter your **Origin (X, Z)** and **Target (X, Z)** coordinates.
3. Set your **Max Boat Stack**, **Max Ticks**, and **Cannon Delay** if needed.
4. Click **Calculate Solutions** and copy your preferred configuration.
