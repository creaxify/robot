// Three.js Background Animation

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg-canvas'),
    alpha: true,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Geometric Particles
const geometry = new THREE.IcosahedronGeometry(1, 0);
const particlesCount = 200;

const posArray = new Float32Array(particlesCount * 3);
const scaleArray = new Float32Array(particlesCount);
const speedArray = new Float32Array(particlesCount); // Speed for each particle

for (let i = 0; i < particlesCount; i++) {
    // x, y, z
    posArray[i * 3] = (Math.random() - 0.5) * 20;
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 20;
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2; // Spread in Z

    scaleArray[i] = Math.random();
    speedArray[i] = Math.random() * 0.02 + 0.005;
}

// We will use InstancedMesh for better performance with many objects
const material = new THREE.MeshStandardMaterial({
    color: 0x8a2be2, // Purpleish
    roughness: 0.4,
    metalness: 0.8,
    emissive: 0x220033,
});

const instancedMesh = new THREE.InstancedMesh(geometry, material, particlesCount);
scene.add(instancedMesh);

const dummy = new THREE.Object3D();

// Set initial positions
for (let i = 0; i < particlesCount; i++) {
    dummy.position.set(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
    const s = scaleArray[i] * 0.2 + 0.1;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
}

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

// A main "Hero" object to substitute the drone if needed, or just background elements
// Let's add a large wireframe sphere in the background that rotates
const sphereGeo = new THREE.SphereGeometry(8, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x4444ff,
    wireframe: true,
    transparent: true,
    opacity: 0.1
});
const bigSphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(bigSphere);
bigSphere.position.z = -5;


camera.position.z = 5;

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Scroll Interaction
let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    // Rotate big sphere
    bigSphere.rotation.y += 0.002;
    bigSphere.rotation.x += 0.001;

    // Parallax effect on sphere based on scroll
    bigSphere.position.y = scrollY * 0.005;

    // Animate Particles
    for (let i = 0; i < particlesCount; i++) {
        // We need to re-assign matrix for each particle to animate them individually in InstancedMesh
        // For simple random movement + mouse interaction:

        let x = posArray[i * 3];
        let y = posArray[i * 3 + 1];
        let z = posArray[i * 3 + 2];

        // Gentle float
        y += Math.sin(elapsedTime * speedArray[i] + x) * 0.01;

        // Mouse influence
        dummy.position.set(x + (mouseX * 0.005), y + (-mouseY * 0.005), z);

        // Rotation
        dummy.rotation.x = elapsedTime * speedArray[i];
        dummy.rotation.y = elapsedTime * speedArray[i];

        const s = scaleArray[i] * 0.2 + 0.1;
        dummy.scale.set(s, s, s);

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.rotation.y += 0.0005;

    // Camera Logic
    // Smooth follow mouse
    camera.rotation.y += 0.05 * (targetX - camera.rotation.y);
    camera.rotation.x += 0.05 * (targetY - camera.rotation.x);

    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Slider Navigation
const slider = document.querySelector('.cards-grid');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');


if (slider && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -320, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        slider.scrollBy({ left: 320, behavior: 'smooth' });
    });

    // Auto Slide
    let autoSlideInterval;
    const startAutoSlide = () => {
        clearInterval(autoSlideInterval); // Clear existing to prevent duplicates
        autoSlideInterval = setInterval(() => {
            if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
                // Return to start smoothly
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: 320, behavior: 'smooth' });
            }
        }, 3000); // 3 seconds
    };

    const stopAutoSlide = () => {
        clearInterval(autoSlideInterval);
    };

    // Start initially
    startAutoSlide();


    // Pause on hover
    const sliderWrapper = document.querySelector('.slider-wrapper');
    if (sliderWrapper) {
        sliderWrapper.addEventListener('mouseenter', stopAutoSlide);
        sliderWrapper.addEventListener('mouseleave', startAutoSlide);
    }
}

// Core Metrics Animation using Intersection Observer
const metricsSection = document.querySelector('.core-metrics');

if (metricsSection) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                metricsSection.classList.add('visible');
                observer.unobserve(entry.target); // Run once
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% visible

    observer.observe(metricsSection);
}

// Stats Counter Animation
const statsSection = document.querySelector('.stats-row');
const counters = document.querySelectorAll('.counter');

if (statsSection && counters.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16); // 60fps

                    let current = 0;
                    const updateCount = () => {
                        current += increment;
                        if (current < target) {
                            counter.innerText = Math.ceil(current);
                            requestAnimationFrame(updateCount);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    updateCount();
                });
                statsObserver.unobserve(entry.target); // Run once
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% visible

    statsObserver.observe(statsSection);
}

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}
