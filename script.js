let debrisArray = [];
let score = 0;
let startTime = Date.now();
let debrisIdCounter = 0;

const debrisContainer = document.getElementById('debrisContainer');
const particlesContainer = document.getElementById('particlesContainer');
const gameArea = document.getElementById('gameArea');

const gameWidth = 1000;
const gameHeight = 600;
const earthCenterX = gameWidth / 2;
const earthCenterY = gameHeight / 2;

const debrisImages = ['img/space-debris-1.png', 'img/space-debris-2.png', 'img/space-debris-3.png'];

class Debris {
    constructor(angle = null) {
        this.id = debrisIdCounter++;
        this.size = 50;
        this.angle = angle !== null ? angle : Math.random() * Math.PI * 2;
        this.distance = 200 + Math.random() * 100;
        this.orbitSpeed = (Math.random() * 0.6 + 0.4) * 0.02;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = Math.random() * 0.02 + 0.01;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        this.image = debrisImages[Math.floor(Math.random() * debrisImages.length)];
        
        
        this.element = document.createElement('img');
        this.element.src = this.image;
        this.element.className = 'debris';
        this.element.style.width = this.size + 'px';
        this.element.style.height = this.size + 'px';
        this.element.dataset.debrisId = this.id;
        
        
        const floatDuration = 2 + Math.random() * 2;
        this.element.style.animationDuration = floatDuration + 's';
        this.element.style.animationDelay = Math.random() * 2 + 's';
        
        
        this.element.addEventListener('click', () => this.onClick());
        
        debrisContainer.appendChild(this.element);
        this.update();
    }

    update() {
        
        this.angle += this.orbitSpeed;
        this.floatOffset += this.floatSpeed;
        this.rotation += this.rotationSpeed;

        
        const floatDistance = Math.sin(this.floatOffset) * 15;
        const currentDistance = this.distance + floatDistance;
        
        const x = earthCenterX + Math.cos(this.angle) * currentDistance;
        const y = earthCenterY + Math.sin(this.angle) * currentDistance;

        
        this.element.style.left = (x - this.size / 2) + 'px';
        this.element.style.top = (y - this.size / 2) + 'px';
        this.element.style.transform = `rotate(${this.rotation}deg)`;
    }

    onClick() { 
        this.createExplosion();
        this.destroy();
        score++;
        addDebris(2);
        updateStats();
    }

    createExplosion() {
        const rect = this.element.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();
        
        const x = rect.left - gameRect.left + this.size / 2;
        const y = rect.top - gameRect.top + this.size / 2;

        
        const particleCount = 20;
        const colors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#ff9ff3', '#6bcf7f', '#ff8c42'];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (Math.PI * 2 / particleCount) * i;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            particlesContainer.appendChild(particle);
            
            
            setTimeout(() => {
                particle.remove();
            }, 800);
        }

        
        this.element.classList.add('exploding');
    }

    destroy() {
        
        const index = debrisArray.findIndex(d => d.id === this.id);
        if (index > -1) {
            debrisArray.splice(index, 1);
        }
        
        
        setTimeout(() => {
            this.element.remove();
        }, 500);
    }
}


function addDebris(count) {
    for (let i = 0; i < count; i++) {
        const debris = new Debris();
        debrisArray.push(debris);
    }
}


function initDebris(count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const debris = new Debris(angle);
        debrisArray.push(debris);
    }
}


function updateStats() {
    document.getElementById('destroyed').textContent = score;
    document.getElementById('active').textContent = debrisArray.length;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = elapsed + 's';
}


function createStars() {
    const container = document.getElementById('gameContainer');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(star);
    }
}


function animate() {
    
    debrisArray.forEach(debris => {
        debris.update();
    });

    
    updateStats();

    requestAnimationFrame(animate);
}


function adjustGameArea() {
    const maxWidth = Math.min(1000, window.innerWidth - 100);
    const maxHeight = Math.min(700, window.innerHeight - 200);
    
    if (maxWidth < 1000) {
        gameArea.style.width = maxWidth + 'px';
        gameArea.style.height = maxHeight + 'px';
    }
}


function init() {
    createStars();
    initDebris(16); 
    adjustGameArea();
    animate();
}


window.addEventListener('resize', adjustGameArea);


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
