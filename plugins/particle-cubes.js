/**
 * plugins/particle-cubes.js — Flutcom Plugin
 * Implements a high-performance, lightweight 3D particle cube hash symbol on a 2D canvas.
 * Perfectly integrates with the Flutcom SPA navigation lifecycle.
 */

(function () {
    let animationFrameId = null;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    function init3DParticles() {
        const canvas = document.getElementById('about-particles-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.clientWidth;
        let height = canvas.clientHeight;

        // Handle high DPI displays for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Core parameters
        const cubeSize = 0.24;
        const gridSpacing = 0.28;
        const cameraDistance = 3.2;

        // Define 16 cubes forming the Hash (#) symbol
        const centers = [
            // Left vertical bar
            { x: -gridSpacing, y: gridSpacing * 2, z: 0 },
            { x: -gridSpacing, y: gridSpacing, z: 0 },
            { x: -gridSpacing, y: 0, z: 0 },
            { x: -gridSpacing, y: -gridSpacing, z: 0 },
            { x: -gridSpacing, y: -gridSpacing * 2, z: 0 },

            // Right vertical bar
            { x: gridSpacing, y: gridSpacing * 2, z: 0 },
            { x: gridSpacing, y: gridSpacing, z: 0 },
            { x: gridSpacing, y: 0, z: 0 },
            { x: gridSpacing, y: -gridSpacing, z: 0 },
            { x: gridSpacing, y: -gridSpacing * 2, z: 0 },

            // Top horizontal bar connections
            { x: -gridSpacing * 2, y: gridSpacing, z: 0 },
            { x: 0, y: gridSpacing, z: 0 },
            { x: gridSpacing * 2, y: gridSpacing, z: 0 },

            // Bottom horizontal bar connections
            { x: -gridSpacing * 2, y: -gridSpacing, z: 0 },
            { x: 0, y: -gridSpacing, z: 0 },
            { x: gridSpacing * 2, y: -gridSpacing, z: 0 }
        ];

        // Generate points: vertices and inner dust
        const particles = [];
        const edges = [];

        centers.forEach((center, cubeIndex) => {
            const h = cubeSize / 2;

            // Add some Z-depth randomness to make it feel 3D and dynamic
            const czOffset = (Math.random() - 0.5) * 0.05;
            const cx = center.x;
            const cy = center.y;
            const cz = center.z + czOffset;

            // 1. Generate 8 vertices of the cube
            const localVertices = [
                { x: cx - h, y: cy - h, z: cz - h, isVertex: true },
                { x: cx + h, y: cy - h, z: cz - h, isVertex: true },
                { x: cx + h, y: cy + h, z: cz - h, isVertex: true },
                { x: cx - h, y: cy + h, z: cz - h, isVertex: true },
                { x: cx - h, y: cy - h, z: cz + h, isVertex: true },
                { x: cx + h, y: cy - h, z: cz + h, isVertex: true },
                { x: cx + h, y: cy + h, z: cz + h, isVertex: true },
                { x: cx - h, y: cy + h, z: cz + h, isVertex: true }
            ];

            const vertexStartIndex = particles.length;
            localVertices.forEach(v => particles.push(v));

            // Define cube edges (connect indices)
            const localEdges = [
                [0, 1], [1, 2], [2, 3], [3, 0], // Back face
                [4, 5], [5, 6], [6, 7], [7, 4], // Front face
                [0, 4], [1, 5], [2, 6], [3, 7]  // Connectors
            ];

            localEdges.forEach(([p1, p2]) => {
                edges.push({
                    p1: vertexStartIndex + p1,
                    p2: vertexStartIndex + p2
                });
            });

            // 2. Generate volumetric inner dust particles
            const dustCount = 35;
            for (let i = 0; i < dustCount; i++) {
                particles.push({
                    x: cx + (Math.random() - 0.5) * cubeSize,
                    y: cy + (Math.random() - 0.5) * cubeSize,
                    z: cz + (Math.random() - 0.5) * cubeSize,
                    isVertex: false
                });
            }
        });

        // Rotation angles
        let angleX = 0.3;
        let angleY = -0.4;
        let angleZ = 0.15;

        // Listen for mousemove on canvas container to add parallax
        const section = canvas.closest('section');
        if (section) {
            section.addEventListener('mousemove', (e) => {
                const rect = section.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                mouse.targetX = x * 0.8;
                mouse.targetY = y * 0.8;
            });
            section.addEventListener('mouseleave', () => {
                mouse.targetX = 0;
                mouse.targetY = 0;
            });
        }

        function resize() {
            if (!canvas.isConnected) return;
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        window.addEventListener('resize', resize);

        function draw() {
            // Check if element is still in DOM to prevent memory leaks in SPA
            if (!canvas.isConnected) {
                window.removeEventListener('resize', resize);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            // Interpolate mouse movements for smooth easing
            mouse.x += (mouse.targetX - mouse.x) * 0.08;
            mouse.y += (mouse.targetY - mouse.y) * 0.08;

            // Increment base angles
            angleY += 0.003;
            angleX += 0.001;

            const currentAngleX = angleX + mouse.y;
            const currentAngleY = angleY + mouse.x;

            const cosX = Math.cos(currentAngleX);
            const sinX = Math.sin(currentAngleX);
            const cosY = Math.cos(currentAngleY);
            const sinY = Math.sin(currentAngleY);
            const cosZ = Math.cos(angleZ);
            const sinZ = Math.sin(angleZ);

            const fov = Math.min(width, height) * 0.85;
            const projected = [];

            // Project all 3D points
            particles.forEach((p, index) => {
                // Rotate around Y axis
                let x1 = p.x * cosY - p.z * sinY;
                let z1 = p.x * sinY + p.z * cosY;

                // Rotate around X axis
                let y2 = p.y * cosX - z1 * sinX;
                let z2 = p.y * sinX + z1 * cosX;

                // Rotate around Z axis
                let x3 = x1 * cosZ - y2 * sinZ;
                let y3 = x1 * sinZ + y2 * cosZ;

                // Perspective projection
                const scale = fov / (cameraDistance + z2);
                const screenX = width / 2 + x3 * scale;
                const screenY = height / 2 + y3 * scale;

                projected.push({
                    x: screenX,
                    y: screenY,
                    z: z2,
                    isVertex: p.isVertex
                });
            });

            // Draw Edges (with perspective-based alpha)
            edges.forEach(edge => {
                const p1 = projected[edge.p1];
                const p2 = projected[edge.p2];

                // Simple clipping
                if (p1.x < 0 || p1.x > width || p1.y < 0 || p1.y > height) return;
                if (p2.x < 0 || p2.x > width || p2.y < 0 || p2.y > height) return;

                const avgZ = (p1.z + p2.z) / 2;
                const alpha = Math.max(0.02, Math.min(0.22, 0.15 - avgZ * 0.08));

                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            });

            // Draw Particles (sorted by Z so back particles are drawn first)
            const sortedIndices = projected
                .map((p, i) => ({ z: p.z, index: i }))
                .sort((a, b) => b.z - a.z);

            sortedIndices.forEach(({ index }) => {
                const p = projected[index];
                if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) return;

                const sizeScale = Math.max(0.2, Math.min(2.5, 1.2 - p.z * 0.4));

                if (p.isVertex) {
                    // Vertices: Big glowing dots
                    const alpha = Math.max(0.3, Math.min(1.0, 0.85 - p.z * 0.25));
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

                    // Draw glow
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2.5 * sizeScale, 0, Math.PI * 2);
                    ctx.fill();

                    // Reset shadow for performance
                    ctx.shadowBlur = 0;
                } else {
                    // Inner dust: Small fine particles
                    const alpha = Math.max(0.1, Math.min(0.55, 0.35 - p.z * 0.15));
                    ctx.fillStyle = `rgba(220, 220, 225, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 0.75 * sizeScale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        }

        // Start drawing loop
        draw();
    }

    // Auto-init on initial load
    document.addEventListener('DOMContentLoaded', init3DParticles);

    // Re-init on Flutcom SPA navigation
    document.addEventListener('fc-view-loaded', () => {
        // Cancel any pending animations before restarting
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        setTimeout(init3DParticles, 120);
    });
})();
