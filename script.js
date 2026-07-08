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

// Begin preloader sequence on load
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
        }
        if (typeof initAnimations === 'function') {
            initAnimations();
        }
    }, 1500); // Wait 1.5s then fade out preloader
});

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
                color: Math.random() > 0.8 ? `hsla(45, 90%, 60%, ${Math.random()})` : `rgba(37, 99, 235, ${Math.random() * 0.5})`
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
                gradient.addColorStop(0, `rgba(15, 23, 42, ${star.alpha * 0.15})`);
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
            gradient.addColorStop(0, `rgba(15, 23, 42, ${ss.alpha})`);
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

    // Load GLTF Rovers
    const roverGroup = new THREE.Group();
    const loader = new THREE.GLTFLoader();

    // Configure DRACOLoader for compressed models
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    loader.load('assets/prana_v1.gltf', (gltf) => {
        const prana = gltf.scene;
        prana.scale.set(0.4, 0.4, 0.4);
        prana.position.set(-1.2, 0.5, 0);
        // Slightly rotate it
        prana.rotation.y = 0.2;

        // Ensure materials interact with lights
        prana.traverse((node) => {
            if (node.isMesh && node.material) {
                node.material.metalness = 0.5;
                node.material.roughness = 0.5;
                // Optional: fix emissive map intensity if they are glowing too much
            }
        });
        roverGroup.add(prana);
    });

    loader.load('assets/srishti_rv26.gltf', (gltf) => {
        const srishti = gltf.scene;
        srishti.scale.set(0.4, 0.4, 0.4);
        srishti.position.set(1.2, 0.5, 0);
        // Slightly rotate it
        srishti.rotation.y = -0.2;

        srishti.traverse((node) => {
            if (node.isMesh && node.material) {
                node.material.metalness = 0.5;
                node.material.roughness = 0.5;
            }
        });
        roverGroup.add(srishti);
    });

    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        particlePos[i * 3] = (Math.random() - 0.5) * 8;
        particlePos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        particlePos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x4f46e5, size: 0.06, transparent: true, opacity: 0.5 });
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
        'MAINTENANCE & REPAIR ',
        'SAMPLE RECOVERY',
        'SETTLEMENT DESIGN',
        'SCIENCE INVESTIGATION',
        'PROJECT DEFENCE',
        '30 ELITE TEAMS',
        'STUDENT BUILT • STUDENT LED ',
        'REMOTE OPERATIONS',
        'AI & COMPUTER VISION'
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
    anchor.addEventListener('click', function (e) {
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

// ========== REGISTRATION COUNTDOWN ==========
function initCountdown() {
    // Target date: August 1, 2026, 23:59:59 local time
    const targetDate = new Date('August 1, 2026 23:59:59').getTime();
    // Start date for progress bar calculation
    const startDate = new Date('June 1, 2026 00:00:00').getTime();
    
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-minutes');
    const secsEl = document.getElementById('countdown-seconds');
    
    const roverIcon = document.getElementById('rover-icon');
    const progressFill = document.getElementById('rover-progress-fill');
    
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        // Progress bar logic
        const totalDuration = targetDate - startDate;
        const elapsed = now - startDate;
        let progress = (elapsed / totalDuration) * 100;
        progress = Math.max(0, Math.min(progress, 100)); // Clamp between 0-100%
        
        if (roverIcon && progressFill) {
            roverIcon.style.left = `${progress}%`;
            progressFill.style.width = `${progress}%`;
        }
        
        if (distance < 0) {
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minsEl.innerText = "00";
            secsEl.innerText = "00";
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        daysEl.innerText = days.toString().padStart(2, '0');
        hoursEl.innerText = hours.toString().padStart(2, '0');
        minsEl.innerText = minutes.toString().padStart(2, '0');
        secsEl.innerText = seconds.toString().padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', initCountdown);

// ========== STEPPER SCROLL ANIMATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.stepper-step');
    const progressBar = document.getElementById('stepper-progress');
    if (!steps.length || !progressBar) return;

    function updateStepper() {
        const container = document.querySelector('.stepper-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerHeight = containerRect.height;
        const windowHeight = window.innerHeight;

        // Calculate how far through the stepper the viewport center is
        const viewportCenter = windowHeight * 0.75;
        const progress = Math.min(Math.max((viewportCenter - containerTop) / containerHeight, 0), 1);
        progressBar.style.height = (progress * 100) + '%';

        // Animate each step when it enters the viewport
        steps.forEach((step) => {
            const stepRect = step.getBoundingClientRect();
            const stepCenter = stepRect.top + stepRect.height / 2;

            if (stepCenter < viewportCenter) {
                step.classList.add('stepper-active');
            }
        });
    }

    window.addEventListener('scroll', updateStepper, { passive: true });
    updateStepper();
});

// ========== VIDEO GALLERY ANIMATION & YOUTUBE API ==========
// ========== VIDEO GALLERY ANIMATION & YOUTUBE API ==========
let ytPlayers = [];
let ytReady = false;

// 1. Load YouTube API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
    ytReady = true;
    const playerDivs = document.querySelectorAll('[id^="yt-player-"]');
    playerDivs.forEach((div, index) => {
        const card = div.closest('.video-item-3d');
        const videoId = div.getAttribute('data-video-id') || (card ? card.getAttribute('data-video-id') : null);
        const player = new YT.Player(div.id, {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'rel': 0,
                'playsinline': 1,
                'modestbranding': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
        ytPlayers.push(player);
    });
};

function onPlayerReady(event) {
    if (typeof event.target.setPlaybackQuality === 'function') {
        event.target.setPlaybackQuality('medium'); // 360p
    }
    
    try {
        const iframe = event.target.getIframe();
        if (iframe) {
            const item = iframe.closest('.video-item-3d');
            if (!item || !item.classList.contains('active')) {
                event.target.pauseVideo();
            } else {
                const gallery = document.querySelector('.video-gallery-container');
                if (gallery) {
                    const rect = gallery.getBoundingClientRect();
                    // If active card loads while user is looking at the section, play it immediately
                    if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                        event.target.playVideo();
                    } else {
                        event.target.pauseVideo();
                    }
                }
            }
        }
    } catch(e) {}
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        if (typeof event.target.setPlaybackQuality === 'function') {
            event.target.setPlaybackQuality('medium'); // 360p
        }
        // Pause all other videos
        ytPlayers.forEach(player => {
            if (player !== event.target && typeof player.pauseVideo === 'function') {
                try { player.pauseVideo(); } catch(e) {}
            }
        });
    }
}

function pauseAllVideos() {
    ytPlayers.forEach(player => {
        try {
            if (typeof player.pauseVideo === 'function') {
                player.pauseVideo();
            }
        } catch (e) {}
    });
}

// Named initialization function to be safely called after GSAP plugins register
function initVideoGallery() {
    const gallerySection = document.getElementById('video-gallery');
    const cards = gsap.utils.toArray('.video-item-3d');

    if (!gallerySection || cards.length === 0) return;

    let activeIndex = 0;

    function setActiveCard(newIndex) {
        activeIndex = ((newIndex % cards.length) + cards.length) % cards.length;
        const prevIndex = (activeIndex - 1 + cards.length) % cards.length;
        const nextIndex = (activeIndex + 1) % cards.length;

        cards.forEach((card, i) => {
            card.classList.remove('prev', 'active', 'next', 'hidden-card');
            if (i === activeIndex) card.classList.add('active');
            else if (i === prevIndex) card.classList.add('prev');
            else if (i === nextIndex) card.classList.add('next');
            else card.classList.add('hidden-card');

            const player = ytPlayers[i];
            if (ytReady && player) {
                if (i === activeIndex && typeof player.playVideo === 'function') {
                    player.playVideo();
                } else if (typeof player.pauseVideo === 'function') {
                    player.pauseVideo();
                }
            }
        });
    }

    // Set initial layout state safely
    setActiveCard(0);

    ScrollTrigger.create({
        id: 'video-gallery-scroll',
        trigger: gallerySection,
        start: 'top center',
        end: 'bottom bottom',
        scrub: 1,
        onEnter: () => {
            // Force active video to play when user scrolls into the section down
            const player = ytPlayers[activeIndex];
            if (ytReady && player && typeof player.playVideo === 'function') player.playVideo();
        },
        onEnterBack: () => {
            // Force active video to play when user scrolls into the section up
            const player = ytPlayers[activeIndex];
            if (ytReady && player && typeof player.playVideo === 'function') player.playVideo();
        },
        onUpdate: (self) => {
            const idx = Math.round(self.progress * (cards.length - 1));
            if (idx !== activeIndex) setActiveCard(idx);
        },
        onLeave: () => pauseAllVideos(),
        onLeaveBack: () => pauseAllVideos()
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) pauseAllVideos();
        });
    }, { threshold: 0 });

    observer.observe(gallerySection);
}

// ========== PRIZE POOL ANIMATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const prizeElement = document.getElementById('prize-pool-amount');
    if (!prizeElement) return;

    const target = parseInt(prizeElement.getAttribute('data-target'), 10) || 1200;
    let animated = false;

    const animateNumber = (element, end, duration) => {
        let start = 0;
        const increment = end / (duration / 16); // roughly 60fps
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                element.innerText = end.toLocaleString();
                clearInterval(timer);
            } else {
                element.innerText = Math.floor(start).toLocaleString();
            }
        }, 16);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                animateNumber(prizeElement, target, 2000); // 2 seconds animation
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(prizeElement);
});
