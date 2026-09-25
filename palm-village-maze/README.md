# Hana & the Palm Village Maze (`palm-village-maze`)

An interactive 3D Ancient Iraqi Palm Village & Mud-Brick Alleyway Maze built with **React Three Fiber**, **Three.js**, and **PostProcessing**.

## Highlights

- **Sunlit Ancient Village Architecture**:
  - Weathered warm mud-brick walls with exposed brick patches, protruding wooden roof timber logs (rondels), pointed stone archways, timber-framed open palm gates, recessed plank doors, and multi-pane wooden windows.
  - Cobblestone pathways with wild grass tufts along the wall edges and dappled palm-frond sunlight projections.
  - Towering date palm trees with diamond-cut bark rings, golden date clusters, and gently swaying pinnate fronds against the sky.
  - Cascading purple bougainvillea bushes and climbing green vines with glossy red pomegranate berries.
- **Hana (Yellow-Coat Chibi Explorer)**:
  - Sculpted 3D character with crystal-clear facial features: smooth porcelain-cream face, happy closed smiling arc eyes (`^ ^`), cute peach nose dot, sweet smile (`◡`), large rosy coral-pink cheeks, bell-shaped jet-black bob hair with parted bangs and flowing side strands, wide flared golden-yellow raincoat with 2 black buttons, and black boots.
- **High-Performance Optimization**:
  - Static village walls, floors, windows, doors, vines, berries, purple flowers, grass tufts, and palm trunks are geometry-batched by material into ~15 merged `BufferGeometry` draw calls.
  - Zero-network-asset procedural canvas textures with caching, ref-driven 60fps animation loop, O(1) spatial collision grid, and a distance-sorted 10-light pool.
