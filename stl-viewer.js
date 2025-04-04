import './three.min.js';
import './STLLoader.js';
import './OrbitControls.js';

class STLViewer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.connected = true;

    const shadowRoot = this.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    container.classList.add('viewer-container');
    shadowRoot.appendChild(container);

    // Botões
    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('controls');
    controlsDiv.innerHTML = `
      <button id="bg-default">Fundo Padrão</button>
      <button id="bg-creme">Fundo Creme</button>
      <button id="konpeki-creme">Konpeki Creme</button>
      <button id="konpeki-cinza">Konpeki Cinza</button>
    `;
    shadowRoot.appendChild(controlsDiv);

    const style = document.createElement('style');
    style.textContent = `
    .viewer-container {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      font-family: 'Orbitron', sans-serif;
      overflow: hidden;
      position: relative;
    }
  
    .controls {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  
    button {
      background-color: #2e2e2e; /* Cinza escuro visível */
      color: #fcecc9; /* Um creme cyberpunk sutil */
      border: 1px solid #555;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Orbitron', sans-serif;
      font-size: 13px;
      transition: background 0.2s ease;
    }
  
    button:hover {
      background-color: #444; /* Um hover mais claro */
    }
  `;
    shadowRoot.appendChild(style);

    if (!this.hasAttribute('model')) {
      throw new Error('model attribute is required');
    }

    const model = this.getAttribute('model');

    let camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 1, 1000);
    let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // transparente
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', function () {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    }, false);

    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;

    let scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    let mesh = null;

    new THREE.STLLoader().load(model, (geometry) => {
      const material = new THREE.MeshPhongMaterial({
        color: 0x2e2e2e, // cinza escuro por padrão
        specular: 0xffffff,
        shininess: 80,
        flatShading: false,
      });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      let middle = new THREE.Vector3();
      geometry.computeBoundingBox();
      geometry.boundingBox.getCenter(middle);
      mesh.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-middle.x, -middle.y, -middle.z));
      mesh.rotation.x = -Math.PI / 2;

      let size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      let largestDimension = Math.max(size.x, size.y, size.z);
      camera.position.z = largestDimension * 2;

      let animate = () => {
        controls.update();
        renderer.render(scene, camera);
        if (this.connected) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    });

    // Interações dos botões
    shadowRoot.getElementById('bg-default').addEventListener('click', () => {
      container.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
    });

    shadowRoot.getElementById('bg-creme').addEventListener('click', () => {
      container.style.background = '#fcecc9';
    });

    shadowRoot.getElementById('konpeki-creme').addEventListener('click', () => {
      if (mesh) mesh.material.color.setHex(0xfcecc9);
    });

    shadowRoot.getElementById('konpeki-cinza').addEventListener('click', () => {
      if (mesh) mesh.material.color.setHex(0x2e2e2e);
    });
  }

  disconnectedCallback() {
    this.connected = false;
  }
}

customElements.define('stl-viewer', STLViewer);
