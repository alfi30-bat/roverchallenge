/* ============================================
   ASIAN ROVER CHALLENGE - MAIN SCRIPT
   ============================================ */

// Force page to load at the top
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
}
// Just in case onbeforeunload is bypassed
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ========== AMBIENT SPACE AUDIO ENGINE ==========
let audioPlaying = false;
const bgMusic = document.getElementById('bg-music');

// Set volume slightly lower
if (bgMusic) {
    bgMusic.volume = 0.5;
}

function startAudio() {
    if (bgMusic) {
        bgMusic.play().catch(e => console.warn("Audio autoplay prevented", e));
        audioPlaying = true;
        updateAudioButton();
    }
}

function stopAudio() {
    if (bgMusic) {
        bgMusic.pause();
        audioPlaying = false;
        updateAudioButton();
    }
}

function toggleAudio() {
    if (audioPlaying) {
        stopAudio();
    } else {
        startAudio();
    }
}

function updateAudioButton() {
    const btn = document.getElementById('audio-toggle');
    if (!btn) return;
    if (audioPlaying) {
        btn.textContent = '🔊';
        btn.classList.add('playing');
    } else {
        btn.textContent = '🔇';
        btn.classList.remove('playing');
    }
}

// ========== START SCREEN ==========
document.getElementById('start-btn').addEventListener('click', () => {
    const startScreen = document.getElementById('start-screen');
    startScreen.classList.add('hidden');
    
    // Start audio
    startAudio();
    
    // Begin preloader sequence
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        preloader.classList.add('hidden');
        initAnimations();
    }, 2000);
});

// Audio toggle button
document.getElementById('audio-toggle').addEventListener('click', toggleAudio);

// ========== STARFIELD CANVAS ==========
(function initStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function createStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 5000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5,
                alpha: Math.random(),
                alphaDir: Math.random() > 0.5 ? 0.005 : -0.005,
                speed: Math.random() * 0.02 + 0.005,
                color: `hsl(${180 + Math.random() * 60}, 80%, ${70 + Math.random() * 30}%)`
            });
        }
    }
    
    function createShootingStar() {
        if (Math.random() > 0.995) {
            shootingStars.push({
                x: Math.random() * canvas.width,
                y: 0,
                length: 80 + Math.random() * 60,
                speed: 8 + Math.random() * 6,
                angle: Math.PI / 4 + Math.random() * 0.4,
                alpha: 1,
                decay: 0.015
            });
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        stars.forEach(star => {
            star.alpha += star.alphaDir;
            if (star.alpha <= 0.1 || star.alpha >= 1) star.alphaDir *= -1;
            
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = star.alpha * 0.6;
            ctx.fill();
            
            if (star.radius > 1) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3);
                gradient.addColorStop(0, `rgba(0, 245, 255, ${star.alpha * 0.15})`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 1;
                ctx.fill();
            }
        });
        
        createShootingStar();
        shootingStars = shootingStars.filter(ss => {
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.alpha -= ss.decay;
            
            if (ss.alpha <= 0) return false;
            
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(
                ss.x - Math.cos(ss.angle) * ss.length,
                ss.y - Math.sin(ss.angle) * ss.length
            );
            const gradient = ctx.createLinearGradient(
                ss.x, ss.y,
                ss.x - Math.cos(ss.angle) * ss.length,
                ss.y - Math.sin(ss.angle) * ss.length
            );
            gradient.addColorStop(0, `rgba(0, 245, 255, ${ss.alpha})`);
            gradient.addColorStop(1, 'transparent');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 1;
            ctx.stroke();
            
            return true;
        });
        
        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
    }
    
    resize();
    createStars();
    animate();
    window.addEventListener('resize', () => { resize(); createStars(); });
})();

// ========== THREE.JS 3D ROVER ==========
(function initRover3D() {
    const container = document.getElementById('rover-container');
    if (!container) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'none'; // Ensure mouse goes through
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0x00f5ff, 1.2);
    mainLight.position.set(5, 8, 5);
    scene.add(mainLight);
    
    const accentLight = new THREE.PointLight(0xff6b35, 0.8, 20);
    accentLight.position.set(-5, 3, -3);
    scene.add(accentLight);
    
    const rimLight = new THREE.PointLight(0xa855f7, 0.6, 15);
    rimLight.position.set(3, -2, -5);
    scene.add(rimLight);
    
    // Build the Rover
    const roverGroup = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(2.4, 0.6, 1.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, metalness: 0.8, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    roverGroup.add(body);
    
    const topGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.2);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x00f5ff, metalness: 0.9, roughness: 0.1, emissive: 0x003344, emissiveIntensity: 0.5 });
    const topPanel = new THREE.Mesh(topGeometry, topMaterial);
    topPanel.position.y = 1.15;
    roverGroup.add(topPanel);
    
    const mastGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.2 });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0.7, 1.7, 0);
    roverGroup.add(mast);
    
    const headGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.25);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x333345, metalness: 0.8, roughness: 0.3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.7, 2.3, 0);
    roverGroup.add(head);
    
    const lensGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8);
    const lensMaterial = new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 0.8, metalness: 1, roughness: 0 });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.rotation.z = Math.PI / 2;
    lens.position.set(0.85, 2.3, 0);
    roverGroup.add(lens);
    
    const panelArmGeo = new THREE.BoxGeometry(0.08, 0.05, 1.8);
    const panelArmMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.9, roughness: 0.2 });
    const leftArm = new THREE.Mesh(panelArmGeo, panelArmMat);
    leftArm.position.set(-0.3, 1.2, 0);
    leftArm.rotation.x = 0.2;
    roverGroup.add(leftArm);
    
    const panelGeo = new THREE.BoxGeometry(1.2, 0.04, 1.6);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a4e, metalness: 0.7, roughness: 0.2 });
    const solarPanel = new THREE.Mesh(panelGeo, panelMat);
    solarPanel.position.set(-1.2, 1.3, 0);
    solarPanel.rotation.z = 0.15;
    roverGroup.add(solarPanel);
    
    const armSegGeo1 = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.9, roughness: 0.2 });
    const armSeg1 = new THREE.Mesh(armSegGeo1, armMat);
    armSeg1.position.set(1.3, 1.2, 0.3);
    armSeg1.rotation.z = -0.3;
    roverGroup.add(armSeg1);
    
    const armSegGeo2 = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    const armSeg2 = new THREE.Mesh(armSegGeo2, armMat);
    armSeg2.position.set(1.6, 1.7, 0.3);
    armSeg2.rotation.z = 0.5;
    roverGroup.add(armSeg2);
    
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.6, roughness: 0.5 });
    const treadGeometry = new THREE.TorusGeometry(0.35, 0.05, 6, 16);
    const treadMaterial = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.5, roughness: 0.7 });
    
    const wheelPositions = [
        { x: -1, y: 0.35, z: 1 }, { x: -1, y: 0.35, z: -1 },
        { x: 0, y: 0.35, z: 1 }, { x: 0, y: 0.35, z: -1 },
        { x: 1, y: 0.35, z: 1 }, { x: 1, y: 0.35, z: -1 },
    ];
    
    const wheels = [];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.x = Math.PI / 2;
        roverGroup.add(wheel);
        wheels.push(wheel);
        
        const tread = new THREE.Mesh(treadGeometry, treadMaterial);
        tread.position.set(pos.x, pos.y, pos.z);
        tread.rotation.y = Math.PI / 2;
        roverGroup.add(tread);
    });
    
    const suspGeo = new THREE.BoxGeometry(0.08, 0.04, 0.8);
    const suspMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.8, roughness: 0.3 });
    [-1, 0, 1].forEach(x => {
        const susp = new THREE.Mesh(suspGeo, suspMat);
        susp.position.set(x, 0.55, 0);
        roverGroup.add(susp);
    });
    
    const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
    const antenna = new THREE.Mesh(antennaGeo, mastMaterial);
    antenna.position.set(-0.6, 1.6, -0.4);
    roverGroup.add(antenna);
    
    const antennaDishGeo = new THREE.SphereGeometry(0.12, 8, 8, 0, Math.PI);
    const antennaDish = new THREE.Mesh(antennaDishGeo, topMaterial);
    antennaDish.position.set(-0.6, 2.05, -0.4);
    antennaDish.rotation.x = -Math.PI / 2;
    roverGroup.add(antennaDish);
    
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        particlePos[i * 3] = (Math.random() - 0.5) * 8;
        particlePos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        particlePos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x00f5ff, size: 0.04, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    
    roverGroup.position.set(2, -1, 0);
    roverGroup.rotation.y = -0.5;
    scene.add(roverGroup);
    
    camera.position.set(4, 3, 6);
    camera.lookAt(roverGroup.position);
    
    // Mouse interaction (still tracks mouse for 3D rotation even with pointer-events:none on canvas)
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    
    let scrollProgress = 0;
    window.addEventListener('scroll', () => {
        scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    });
    
    let time = 0;
    function animateRover() {
        time += 0.01;
        roverGroup.rotation.y = -0.5 + Math.sin(time * 0.3) * 0.3 + mouseX * 0.2;
        roverGroup.rotation.x = Math.sin(time * 0.2) * 0.05 + mouseY * 0.1;
        roverGroup.position.y = -1 + Math.sin(time * 0.5) * 0.15;
        roverGroup.position.x = 2 - scrollProgress * 6;
        roverGroup.scale.setScalar(1 - scrollProgress * 0.3);
        
        wheels.forEach(wheel => { wheel.rotation.y += 0.02; });
        
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] += Math.sin(time + i) * 0.002;
            positions[i * 3] += Math.cos(time * 0.5 + i) * 0.001;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = time * 0.05;
        
        accentLight.position.x = Math.sin(time) * 5;
        rimLight.position.z = Math.cos(time * 0.7) * 5;
        
        renderer.render(scene, camera);
        requestAnimationFrame(animateRover);
    }
    
    animateRover();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ========== GSAP ANIMATIONS ==========
function initAnimations() {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);
    
    const heroTl = gsap.timeline({ delay: 0.5 });
    
    heroTl
        .from('.hero-tag', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' })
        .from('.hero-line-1', { y: 80, opacity: 0, duration: 1, ease: 'power4.out' }, '-=0.4')
        .from('.hero-line-2', { y: 80, opacity: 0, scale: 0.9, duration: 1, ease: 'power4.out' }, '-=0.7')
        .from('.hero-line-3', { y: 80, opacity: 0, duration: 1, ease: 'power4.out' }, '-=0.7')
        .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
        .from('.hero-word-rotator', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
        .from('.hero-countdown', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
        .from('.scroll-indicator', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.2');
    
    // Section Headers
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header.children, {
            scrollTrigger: { trigger: header, start: 'top 85%', toggleActions: 'play none none none' },
            y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out'
        });
    });
    
    // About
    gsap.from('.about-content', {
        scrollTrigger: { trigger: '.about-content', start: 'top 80%', toggleActions: 'play none none none' },
        x: -60, opacity: 0, duration: 1, ease: 'power3.out'
    });
    gsap.from('.about-image', {
        scrollTrigger: { trigger: '.about-image', start: 'top 80%', toggleActions: 'play none none none' },
        x: 60, opacity: 0, duration: 1, ease: 'power3.out'
    });
    gsap.from('.about-feature', {
        scrollTrigger: { trigger: '.about-feature', start: 'top 85%', toggleActions: 'play none none none' },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out'
    });
    
    // Challenge Cards
    gsap.utils.toArray('.challenge-card').forEach(card => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
            y: 60, opacity: 0, duration: 0.8, ease: 'power3.out'
        });
    });
    
    // Timeline
    gsap.from('.timeline-line', {
        scrollTrigger: { trigger: '.timeline-line', start: 'top 80%', end: 'bottom 20%', scrub: 1 },
        scaleY: 0, ease: 'none'
    });
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none none' },
            y: 50, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out'
        });
    });
    gsap.utils.toArray('.timeline-dot').forEach((dot, i) => {
        gsap.from(dot, {
            scrollTrigger: { trigger: dot, start: 'top 85%', toggleActions: 'play none none none' },
            scale: 0, duration: 0.6, delay: i * 0.1 + 0.2, ease: 'back.out(1.7)'
        });
    });
    
    // Venue
    gsap.from('.venue-card', {
        scrollTrigger: { trigger: '.venue-card', start: 'top 80%', toggleActions: 'play none none none' },
        y: 60, opacity: 0, duration: 0.8, ease: 'power3.out'
    });
    
    // Sponsors
    gsap.utils.toArray('.sponsor-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
            y: 40, opacity: 0, duration: 0.5, delay: i * 0.1, ease: 'power3.out'
        });
    });
    
    // Register
    gsap.from('.register-card', {
        scrollTrigger: { trigger: '.register-card', start: 'top 80%', toggleActions: 'play none none none' },
        y: 60, opacity: 0, scale: 0.95, duration: 0.8, ease: 'power3.out'
    });
    
    // Stats Counter
    gsap.utils.toArray('.stat-number').forEach(stat => {
        const target = parseInt(stat.dataset.target);
        ScrollTrigger.create({
            trigger: stat, start: 'top 90%',
            onEnter: () => {
                gsap.to(stat, { innerText: target, duration: 2, snap: { innerText: 1 }, ease: 'power2.out' });
            }, once: true
        });
    });
    
    // Parallax
    gsap.to('#rover-container', {
        scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: 1 },
        y: 200, opacity: 0, ease: 'none'
    });
    
    // Dynamic Text Animations
    initTextAnimations();
}

// ========== COUNTDOWN TIMER ==========
(function initCountdown() {
    const eventDate = new Date('2027-01-15T09:00:00+05:30').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = eventDate - now;
        
        if (distance < 0) {
            document.getElementById('countdown-days').textContent = '00';
            document.getElementById('countdown-hours').textContent = '00';
            document.getElementById('countdown-minutes').textContent = '00';
            document.getElementById('countdown-seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('countdown-days').textContent = String(days).padStart(2, '0');
        document.getElementById('countdown-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('countdown-minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('countdown-seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
})();

// ========== NAVBAR ==========
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === current) {
                link.classList.add('active');
            }
        });
    });
    
    // Mobile menu toggle
    mobileToggle.addEventListener('click', () => {
        const hamburger = mobileToggle.querySelector('.hamburger');
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.classList.toggle('menu-open');
    });
})();

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger = document.querySelector('.hamburger');
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.classList.remove('menu-open');
}

// ========== DYNAMIC TEXT ANIMATIONS ==========
function initTextAnimations() {
    // Rotating Words in Hero (typewriter effect)
    const rotatingWords = [
        'AUTONOMOUS NAVIGATION',
        'MARS TERRAIN TRAVERSAL',
        'ROBOTIC ARM OPERATIONS',
        'SCIENCE EXPERIMENTS',
        'GPS-DENIED NAVIGATION',
        'SOIL SAMPLE ANALYSIS',
        'EQUIPMENT SERVICING',
        'DRONE RECONNAISSANCE'
    ];
    
    const rotatingEl = document.getElementById('rotating-word');
    if (rotatingEl) {
        let wordIndex = 0;
        
        function typeNextWord() {
            const word = rotatingWords[wordIndex];
            gsap.to(rotatingEl, {
                duration: word.length * 0.04,
                text: { value: word, delimiter: '' },
                ease: 'none',
                onComplete: () => {
                    gsap.delayedCall(2, () => {
                        gsap.to(rotatingEl, {
                            duration: word.length * 0.025,
                            text: { value: '', delimiter: '' },
                            ease: 'none',
                            onComplete: () => {
                                wordIndex = (wordIndex + 1) % rotatingWords.length;
                                gsap.delayedCall(0.3, typeNextWord);
                            }
                        });
                    });
                }
            });
        }
        
        // Blinking cursor
        const cursorSpan = document.createElement('span');
        cursorSpan.textContent = '|';
        cursorSpan.style.animation = 'blink 1s step-end infinite';
        cursorSpan.style.color = '#00f5ff';
        rotatingEl.parentElement.insertBefore(cursorSpan, rotatingEl.nextSibling);
        
        const style = document.createElement('style');
        style.textContent = '@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }';
        document.head.appendChild(style);
        
        typeNextWord();
    }
    
    // Glitch effect on section headers
    gsap.utils.toArray('h2').forEach(heading => {
        const originalText = heading.textContent;
        heading.setAttribute('data-text', originalText);
        heading.classList.add('glitch-text');
        
        ScrollTrigger.create({
            trigger: heading, start: 'top 85%',
            onEnter: () => {
                heading.classList.add('active');
                setTimeout(() => heading.classList.remove('active'), 400);
            }, once: true
        });
    });
    
    // --- Staggered reveal on about paragraphs (preserves inner HTML) ---
    gsap.utils.toArray('.about-content p').forEach((p, idx) => {
        gsap.from(p, {
            scrollTrigger: { trigger: p, start: 'top 85%', toggleActions: 'play none none none' },
            y: 30, opacity: 0, duration: 0.8, delay: idx * 0.15, ease: 'power3.out'
        });
    });
    
    // --- Staggered reveal on about-feature cards ---
    gsap.utils.toArray('.about-feature').forEach((card, idx) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
            y: 40, opacity: 0, duration: 0.6, delay: idx * 0.1, ease: 'power3.out'
        });
    });
    
    // Timeline heading typewriter
    gsap.utils.toArray('.timeline-item h3').forEach(h3 => {
        gsap.from(h3, {
            scrollTrigger: { trigger: h3, start: 'top 85%', toggleActions: 'play none none none' },
            text: { value: '', delimiter: '' }, duration: 0.8, ease: 'none'
        });
    });
    
    // Dynamic tagline swap
    const taglines = [
        'Design. Build. Conquer Mars.',
        'Engineer the Future of Space.',
        'From Campus to Mars Mission.',
        'Push Boundaries. Break Limits.',
    ];
    
    const taglineEl = document.getElementById('dynamic-tagline');
    if (taglineEl) {
        let tagIndex = 0;
        setInterval(() => {
            tagIndex = (tagIndex + 1) % taglines.length;
            gsap.to(taglineEl, {
                opacity: 0, y: -10, duration: 0.3,
                onComplete: () => {
                    taglineEl.textContent = taglines[tagIndex];
                    gsap.fromTo(taglineEl, 
                        { opacity: 0, y: 10 },
                        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
                    );
                }
            });
        }, 4000);
    }
}

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                scrollTo: { y: target, offsetY: 80 },
                duration: 1,
                ease: 'power3.inOut'
            });
        }
    });
});
