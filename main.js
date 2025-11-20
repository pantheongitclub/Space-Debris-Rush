let debrisArray = [];
let score = 0;
let startTime = Date.now();
let debrisIdCounter = 0;
// ========== SPLASH SCREEN ==========
let gameStarted = false;

function startGame() {
    if (gameStarted) return;
    
    gameStarted = true;
    console.log("loading game");
    
    startBackgroundMusic();
    
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('hidden');
        
       
        setTimeout(() => {
            splash.remove();
        }, 800);
    }
    
    
    init();
}


document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        
        splash.addEventListener('click', startGame);
        splash.addEventListener('touchstart', startGame);
    }
});


// ############### TIMER ###############
let timeRemaining = 60;
let timerRunning = true;

let serialPort = null;
let serialWriter = null;

const decadeData = [
    {
        decade: "1950s",
        year: "1957-1959",
        count: " <100 debris",
        debrisOnScreen: 5,
        description: "The space age begins with Sputnik 1 (1957). There is almost no space debris."
    },
    {
        decade: "1960s",
        year: "1970",
        count: "~2,500 debris",
        debrisOnScreen: 20,
        description: "Cold War: more launches rapidly increase satellites and rocket stages in orbit."
    },
    {
        decade: "1970s",
        year: "1980",
        count: "~5,500 debris",
        debrisOnScreen: 40,
        description: "Launches increase and significant fragmentations (explosions) begin."
    },
    {
        decade: "1980s",
        year: "1990",
        count: "~7,500 debris",
        debrisOnScreen: 55,
        description: "Decades of accumulated launches; most objects are debris (dead satellites)."
    },
    {
        decade: "1990s",
        year: "2000",
        count: "~9,500 debris",
        debrisOnScreen: 75,
        description: "The catalog grows; collision risks are recognized, still without mega-constellations."
    },
    {
        decade: "2000s",
        year: "2010",
        count: "~15,500 debris",
        debrisOnScreen: 90,
        description: "Key decade: more fragmentations and commercial satellites. The population nearly doubles."
    },
    {
        decade: "2010s",
        year: "2020",
        count: "~21,000 debris",
        debrisOnScreen: 115,
        description: "Major events: Chinese anti-satellite test (2007) and the Iridium–Cosmos collision (2009)."
    },
    {
        decade: "2020s",
        year: "2024",
        count: "~50,000 debris",
        debrisOnScreen: 200,
        description: "Mega-constellations and collision events drastically increase space debris."
    }
];

let currentDecadeIndex = 0;
let timelineMode = false


const debrisContainer = document.getElementById('debrisContainer');
const particlesContainer = document.getElementById('particlesContainer');
const gameArea = document.getElementById('gameArea');

const gameWidth = 1000;
const gameHeight = 700;
const earthCenterX = gameWidth / 2;
const earthCenterY = gameHeight / 2;

const debrisImages = ['img/space-debris-1.png', 'img/space-debris-2.png', 'img/space-debris-3.png'];

//connects to Arduino via Web Serial API
async function connectToArduino() {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    serialWriter = serialPort.writable.getWriter();
}

//sebds "H" to Arduino on hit
async function sendHitToArduino() {
    if (!serialWriter) return;
    serialWriter.write(new TextEncoder().encode("H"));
}



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
        playExplosionSound();
        console.log("Debris clicked:", this.id);
        //ledExplosion();
        this.createExplosion();
        this.destroy();
        score++;
        addDebris(0);
        updateStats();
        //Sends signal to Arduino on hit
        sendHitToArduino();

        setTimeout(() => {
            if (debrisArray.length === 0) {
                console.log("All debris deleted");
                if (currentDecadeIndex === 7) {
                    showKesslerPopup();
                }else {
                    advanceToNextDecade();
                }
            }
        }, 100);
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
    //const elapsed = Math.floor((Date.now() - startTime) / 1000);
    //document.getElementById('timer').textContent = elapsed + 's';
    document.getElementById('timer').textContent = Math.ceil(timeRemaining) + 's';
}


// TIMELINE FUNCTION #################

function updateDecadeInfo(index) {
    const data = decadeData[index];
    document.getElementById('currentDecade').textContent = data.decade;
    document.getElementById('debrisCount').textContent = data.count + '';
    document.getElementById('decadeDescription').textContent = data.description;
}

function adjustDebrisForDecade(index) {
    const targetCount = decadeData[index].debrisOnScreen;
    const currentCount = debrisArray.length;
    
    if (targetCount > currentCount) {
        
        const toAdd = targetCount - currentCount;
        addDebris(toAdd);
    } else if (targetCount < currentCount) {
        
        const toRemove = currentCount - targetCount;
        for (let i = 0; i < toRemove; i++) {
            if (debrisArray.length > 0) {
                const debris = debrisArray.pop();
                debris.element.remove();
            }
        }
    }
}


function advanceToNextDecade() {

    if (currentDecadeIndex === 7) {
        console.log("Times up. Showing pop up");
        showKesslerPopup();
        return;
    }

    currentDecadeIndex++;
    
    
    if (currentDecadeIndex >= decadeData.length) {
        currentDecadeIndex = 0;
        console.log("🔄 Ciclo completo - Reiniciando desde 1950s");
    }
    
    
    updateDecadeInfo(currentDecadeIndex);
    
    
    adjustDebrisForDecade(currentDecadeIndex);
    
    
    const slider = document.getElementById('decadeSlider');
    if (slider) {
        slider.value = currentDecadeIndex;
    }
    
    
    timeRemaining = 60;
    
    console.log(`⏭️ Avanzando a: ${decadeData[currentDecadeIndex].decade}`);
}


function updateTimer(deltaTime) {
    if (!timerRunning) return;
    
    timeRemaining -= deltaTime;
    
    
    if (timeRemaining <= 0) {
        advanceToNextDecade();
    }
}

function onDecadeChange(event) {
    const index = parseInt(event.target.value);
    currentDecadeIndex = index;
    
    
    updateDecadeInfo(index);
    
    
    adjustDebrisForDecade(index);
    
    
    updateStats();
    timeRemaining = 60;
}


function createStars() {
    const container = document.getElementById('gameContainer');
    for (let i = 0; i < 1000; i++) {
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

let lastFrameTime = Date.now()

function animate() {
    const currentTime = Date.now();  // ✅ Agregado
    const deltaTime = (currentTime - lastFrameTime) / 1000;  // ✅ Agregado
    lastFrameTime = currentTime;  // ✅ Agregado
    updateTimer(deltaTime);

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

const decadeSlider = document.getElementById('decadeSlider');
if (decadeSlider) {
    decadeSlider.addEventListener('input', onDecadeChange);
}

//if (document.readyState === 'loading') {
//    document.addEventListener('DOMContentLoaded', init);
//} else {
//    init();
//}

window.addEventListener('load', () => {
    updateDecadeInfo(currentDecadeIndex);
});

// ========== POPUP KESSLER ==========

function showKesslerPopup() {
    console.log("Showing pop up");
    const popup = document.getElementById('kesslerPopup');
    if (popup) {
        popup.style.display = 'flex';
    }
}

function hideKesslerPopup() {
    const popup = document.getElementById('kesslerPopup');
    if (popup) {
        popup.style.display = 'none';
    }
    
    
    currentDecadeIndex = 0;
    timeRemaining = 60;
    score = 0;
    
    
    debrisArray.forEach(debris => debris.element.remove());
    debrisArray = [];
    
   
    updateDecadeInfo(0);
    adjustDebrisForDecade(0);
    
    const slider = document.getElementById('decadeSlider');
    if (slider) {
        slider.value = 0;
    }
    
    console.log("Restart game 1950");
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closePopup');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideKesslerPopup);
    }
});

// Arduino Connection and Communication
document.getElementById('connectArduinoBtn').addEventListener('click', () => {
    connectToArduino();
});



// ========= BACKGROUND MUSIC =========
const bgMusic = document.getElementById('bgMusic');

function startBackgroundMusic() {
    if (!bgMusic) return;
    bgMusic.volume = 0.3;
    bgMusic.play().catch(err => {
        console.log('Autoplay bloqueado, la música se iniciará al siguiente click.', err);
    });
}

// ========= EXPLOSION SOUND =========
function playExplosionSound() {
    const explosion = new Audio('assets/Explosion.mp3');
    explosion.volume = 0.5;
    explosion.play();
}
