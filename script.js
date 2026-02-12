document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTS ---
    const els = {
        body: document.body,
        introContent: document.getElementById('intro-content'),
        text: document.getElementById('text-display'),
        subText: document.getElementById('sub-text'),
        startBtn: document.getElementById('start-btn'),
        zone: document.getElementById('interaction-zone'),
        pulse: document.getElementById('pulse-light'),
        bloom: document.getElementById('kiss-bloom'),
        vignette: document.querySelector('.vignette'),
        particles: document.getElementById('particles'),
        
        envelopeStage: document.getElementById('envelope-stage'),
        envelope: document.querySelector('.envelope'),
        seal: document.getElementById('kiss-seal'),
        hint: document.getElementById('click-hint'),
        restartBtn: document.getElementById('restart-btn'),
        letterTextContent: document.getElementById('letter-text-content'),
        
        floatContainer: document.getElementById('floating-container'),
        stuckContainer: document.getElementById('stuck-container'),
        kissTemplate: document.getElementById('kiss-template'),
        heartTemplate: document.getElementById('heart-template')
    };

    const audio = {
        pad: document.getElementById('bgm-pad'),
        heart: document.getElementById('sfx-heart'),
        build: document.getElementById('sfx-build'),
        kiss: document.getElementById('sfx-kiss')
    };

    let holdDuration = 4000;
    let holdStartTime = 0;
    let isHolding = false;
    let completed = false;
    let floatingElements = [];

    // --- INITIALIZATION ---
    createParticles();
    
    const playMusic = () => {
        if(audio.pad.paused) {
            audio.pad.volume = 0.5;
            audio.pad.play().catch(() => {});
        }
    };

    document.body.addEventListener('click', playMusic, { once: true });
    document.body.addEventListener('touchstart', playMusic, { once: true });

    els.startBtn.addEventListener('click', () => {
        els.startBtn.style.opacity = 0;
        setTimeout(() => els.startBtn.remove(), 1000);
        playMusic();
        runIntroSequence();
    });

    els.seal.addEventListener('click', openEnvelope);
    els.restartBtn.addEventListener('click', () => location.reload());

    function runIntroSequence() {
        els.text.innerHTML = "";
        setText("The night is quiet.", "", 1000, () => {
            setText("But here...", "", 2500, () => {
                setText("In the silence...", "", 2000, () => {
                    setText("I just want to be close.", "Press and hold", 0);
                    els.zone.classList.remove('hidden');
                    setupInteraction();
                });
            });
        });
    }

    function setupInteraction() {
        const start = (e) => {
            if(completed) return;
            e.preventDefault();
            isHolding = true;
            holdStartTime = Date.now();
            els.zone.classList.add('active');
            
            audio.heart.volume = 0; 
            audio.heart.play();
            audio.build.volume = 0.1; 
            audio.build.play();
            loop();
        };

        const end = (e) => {
            if(completed) return;
            isHolding = false;
            els.zone.classList.remove('active');
            audio.heart.pause(); 
            audio.build.pause(); 
            audio.build.currentTime = 0;
            els.pulse.style.width = '0'; 
            els.pulse.style.height = '0';
            els.vignette.style.background = `radial-gradient(circle, transparent 40%, rgba(0,0,0,0.9) 100%)`;
        };

        els.zone.addEventListener('mousedown', start);
        els.zone.addEventListener('touchstart', start);
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);
    }

    function loop() {
        if (!isHolding || completed) return;
        let elapsed = Date.now() - holdStartTime;
        let progress = Math.min(elapsed / holdDuration, 1);
        
        let pulseSize = progress * 150; 
        els.pulse.style.width = `${pulseSize}vw`; els.pulse.style.height = `${pulseSize}vw`;
        els.pulse.style.opacity = 0.3 + (progress * 0.5);

        let aperture = 40 - (progress * 30);
        els.vignette.style.background = `radial-gradient(circle, transparent ${aperture}%, rgba(0,0,0,0.95) 100%)`;

        audio.heart.volume = progress; audio.build.volume = progress * 0.8;
        if (elapsed % 600 < 50 && progress > 0.2 && navigator.vibrate) navigator.vibrate(10 + (progress * 50));

        if(progress > 0.2 && progress < 0.5) els.text.innerHTML = "Don't let go...";
        if(progress > 0.5 && progress < 0.8) els.text.innerHTML = "Closer...";
        if(progress > 0.8) els.text.innerHTML = "Almost there...";

        if (progress >= 1) triggerClimax();
        else requestAnimationFrame(loop);
    }

    function triggerClimax() {
        completed = true; isHolding = false;
        audio.pad.pause(); audio.heart.pause(); audio.build.pause(); audio.kiss.play();

        els.zone.style.opacity = 0; els.text.style.opacity = 0; els.subText.style.opacity = 0;
        els.bloom.classList.add('active');

        setTimeout(() => {
            els.body.classList.add('cerulean-mode'); 
            els.bloom.style.opacity = 0; 
            els.introContent.style.display = 'none';
            audio.pad.volume = 0.5; audio.pad.play();

            setTimeout(() => {
                els.envelopeStage.classList.remove('hidden');
                els.envelopeStage.classList.add('visible');
            }, 1000);
        }, 1500);
    }

    function openEnvelope() {
        const popSound = audio.kiss.cloneNode();
        popSound.volume = 0.6; popSound.play();
        els.hint.style.opacity = 0;
        els.seal.classList.add('popped');
        
        setTimeout(() => {
            els.envelope.classList.add('open');
            setTimeout(() => {
                els.envelope.classList.add('vanished');
                
                // Show button after delay, BUT REMOVED the shifted class call
                setTimeout(() => {
                    els.restartBtn.classList.remove('hidden');
                    els.restartBtn.classList.add('visible');
                }, 4000);
            }, 1200);
            
            setInterval(() => createFloatingElement(), 80);
            requestAnimationFrame(updateFloatingElements);
        }, 500);
    }

    function createFloatingElement() {
        if(floatingElements.length > 200) return;
        const isHeart = Math.random() > 0.5;
        const template = isHeart ? els.heartTemplate : els.kissTemplate;
        const svg = template.content.cloneNode(true).querySelector('svg');
        svg.classList.add('floating-element');
        const x = Math.random() * window.innerWidth;
        const y = -50; 
        const dx = (Math.random() - 0.5) * 2; 
        const dy = Math.random() * 2 + 2; 
        const rotation = Math.random() * 360;
        const targetStickY = Math.random() * (window.innerHeight - 50) + 50;

        svg.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        els.floatContainer.appendChild(svg);
        floatingElements.push({ element: svg, x, y, dx, dy, rotation, isHeart, targetStickY });
    }

    function updateFloatingElements() {
        floatingElements.forEach((el, index) => {
            el.x += el.dx; el.y += el.dy; el.rotation += 1;
            el.element.style.transform = `translate(${el.x}px, ${el.y}px) rotate(${el.rotation}deg)`;
            if (el.y >= el.targetStickY && els.stuckContainer.children.length < 600) {
                stickElement(el, index);
            } else if(el.y > window.innerHeight + 100) {
                el.element.remove(); floatingElements.splice(index, 1);
            }
        });
        requestAnimationFrame(updateFloatingElements);
    }

    function stickElement(el, index) {
        el.element.remove(); floatingElements.splice(index, 1);
        const template = el.isHeart ? els.heartTemplate : els.kissTemplate;
        const stuck = template.content.cloneNode(true).querySelector('svg');
        stuck.classList.add('stuck-element');
        stuck.style.left = `${el.x}px`; stuck.style.top = `${el.y}px`;
        stuck.style.setProperty('--rot', `${el.rotation}deg`); 
        els.stuckContainer.appendChild(stuck);

        if(Math.random() > 0.9) {
            const smooch = audio.kiss.cloneNode();
            smooch.volume = 0.05; smooch.playbackRate = 1.2 + Math.random(); smooch.play();
        }
    }

    function setText(html, sub, delay, callback) {
        els.text.style.opacity = 0; els.subText.style.opacity = 0;
        setTimeout(() => {
            els.text.innerHTML = html; els.subText.innerHTML = sub;
            els.text.style.opacity = 1; if(sub) els.subText.style.opacity = 1;
            if(callback) setTimeout(callback, 2000);
        }, delay ? 1000 : 0);
    }

    function createParticles() {
        for(let i=0; i<30; i++) {
            let p = document.createElement('div'); p.className = 'particle';
            p.style.left = Math.random() * 100 + 'vw'; p.style.top = Math.random() * 100 + 'vh';
            p.style.animationDelay = Math.random() * 5 + 's'; p.style.opacity = Math.random() * 0.5;
            els.particles.appendChild(p);
        }
    }
});