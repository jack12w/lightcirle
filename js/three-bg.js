// ============================================
// Yoga B2B — Three.js Hero Background
// ============================================

class HeroBackground {
  constructor(containerId = 'heroCanvas') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.animationId = null;
    this.mouseX = 0;
    this.mouseY = 0;

    this.init();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 30;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    // Particles
    this.createParticles();

    // Lights
    const ambientLight = new THREE.AmbientLight(0x2D5A3D, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xC4926E, 0.4);
    directionalLight.position.set(5, 5, 10);
    this.scene.add(directionalLight);

    // Events
    window.addEventListener('resize', this.onResize.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));

    // Start
    this.animate();
  }

  createParticles() {
    const particleCount = window.innerWidth < 768 ? 800 : 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const palette = [
      new THREE.Color('#2D5A3D'),
      new THREE.Color('#3E7B54'),
      new THREE.Color('#C4926E'),
      new THREE.Color('#D4A88C'),
      new THREE.Color('#E8D5C4'),
      new THREE.Color('#A8D5BA'),
    ];

    for (let i = 0; i < particleCount; i++) {
      // Spherical distribution with organic clustering
      const radius = 12 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Add organic clustering
      const clusterX = Math.sin(theta * 3) * Math.cos(phi * 2) * 5;
      const clusterY = Math.cos(theta * 2) * Math.sin(phi * 3) * 5;
      const clusterZ = Math.sin(phi * 2) * Math.cos(theta * 3) * 5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + clusterX;
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + clusterY;
      positions[i * 3 + 2] = radius * Math.cos(phi) + clusterZ;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.08 + 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  onMouseMove(event) {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    if (this.particles) {
      // Slow, elegant rotation
      this.particles.rotation.y += 0.0004;
      this.particles.rotation.x += 0.0002;

      // Mouse parallax (subtle)
      this.particles.rotation.y += this.mouseX * 0.0003;
      this.particles.rotation.x += this.mouseY * 0.0003;

      // Gentle floating
      this.particles.position.y = Math.sin(Date.now() * 0.0003) * 0.5;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
    window.removeEventListener('resize', this.onResize);
  }
}
