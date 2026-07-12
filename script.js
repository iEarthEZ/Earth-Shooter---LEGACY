const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mainMenu = document.getElementById('main-menu');
const gameOverScreen = document.getElementById('game-over');
const upgradeScreen = document.getElementById('upgrade-screen');
const upgradeOptionsContainer = document.getElementById('upgrade-options');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('start-btn');
const respawnBtn = document.getElementById('respawn-btn');
const menuBtn = document.getElementById('menu-btn');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const finalScoreDisplay = document.getElementById('final-score');
const finalLevelDisplay = document.getElementById('final-level');
const playerHealthBar = document.getElementById('player-health-bar');
const expBar = document.getElementById('exp-bar');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let animationId;
let score = 0;
let level = 1;
let exp = 0;
let expToNextLevel = 10;
let frames = 0;
let isGameOver = false;
let isPaused = false;
let stars = [];
let audioCtx = null;
let screenShake = 0;
let chronoFluxTimer = 0; 
let player;

// --- NEW DEATH STATE VARIABLES ---
let deathPhase = 0; 
let deathTimer = 0;

// Randomized Boss Engine Trackers
let activeBoss = null;
let activeSunBoss = null;
let activeNemesisBoss = null;
let activePhantomBoss = null; 
let levelsSinceBlackhole = 10;
let levelsSinceSun = 10;
let levelsSinceNemesis = 20;
let levelsSincePhantom = 15;  

// Dynamic Environment Systems
let asteroids = [];
let nebulas = [];
let empTimer = 0;
let empDisabledTimer = 0;

// NEW: Asteroid Belt Hazard Engine Trackers
let asteroidBeltEvent = {
    stage: 0,        
    timer: 1200,     
    stageTimer: 0,
    paths: [],
    rocks: []
};

// Supernova Finale Architecture
let supernovaActive = false;
let supernovaTimer = 180 * 60; 
let supernovaRadius = 2500;
let gameWon = false;

// Smooth Grid Color Transition State
let gridColorState = { r: 0, g: 191, b: 255, a: 0.45 };

const keys = { w: false, a: false, s: false, d: false, space: false };
const mouse = { x: canvas.width / 2, y: canvas.height / 2, isDown: false, worldX: 0, worldY: 0 };

window.addEventListener('keydown', (e) => { 
    if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; 
    if(e.code === 'Space') keys.space = true;
    if(e.key.toLowerCase() === 'g' && player) {
        player.ventGravity();
    }
});
window.addEventListener('keyup', (e) => { 
    if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; 
    if(e.code === 'Space') keys.space = false;
});
window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', (e) => { if(e.button === 0) mouse.isDown = true; });
window.addEventListener('mouseup', (e) => { if(e.button === 0) mouse.isDown = false; });

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playShootSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

function playHitSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
}

function playEnemyDieSound(isHeavy) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    let duration = isHeavy ? 0.3 : 0.15;
    let baseFreq = isHeavy ? 150 : 220;
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playBossDieSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(5, audioCtx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
}

function playLevelUpSound() {
    if (!audioCtx) return;
    let now = audioCtx.currentTime;
    let notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.18);
    });
}

function playGameOverSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.7);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.7);
}

function playClickSound() {
    initAudio();
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function applyScreenShake(amount) {
    screenShake = amount;
}

class DistantEvent {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.age = 0;
        this.speedFactor = 0.1; 
        this.hasBlasted = false; 
        
        const types = ['supernova', 'starburst', 'blackhole'];
        this.type = types[Math.floor(Math.random() * types.length)];
        
        if (this.type === 'supernova') {
            this.maxAge = 180;
            this.color = ['#ff9800', '#f44336', '#ffeb3b'][Math.floor(Math.random() * 3)];
        } else if (this.type === 'starburst') {
            this.maxAge = 40;
            this.color = ['#80deea', '#ffffff', '#b388ff'][Math.floor(Math.random() * 3)];
        } else if (this.type === 'blackhole') {
            this.maxAge = 300; 
        }
    }

    update(playerVx, playerVy) {
        this.x -= playerVx * this.speedFactor;
        this.y -= playerVy * this.speedFactor;
        this.age++;
        
        const progress = this.age / this.maxAge;
        
        if (this.type === 'blackhole' && progress >= 0.8 && !this.hasBlasted) {
            this.hasBlasted = true;
            this.blastStarsOutward(400, 35, 15);
        }
        this.draw();
    }

    blastStarsOutward(radius, maxForce, minForce) {
        stars.forEach(star => {
            const dist = Math.hypot(star.x - this.x, star.y - this.y);
            if (dist < radius) { 
                const angle = Math.atan2(star.y - this.y, star.x - this.x);
                const blastForce = Math.random() * maxForce + minForce; 
                star.vx += Math.cos(angle) * blastForce;
                star.vy += Math.sin(angle) * blastForce;
            }
        });
    }

    draw() {
        ctx.save();
        const progress = this.age / this.maxAge;
        const alpha = Math.max(0, 1 - progress);
        
        if (this.type === 'supernova') {
            const radius = progress * 200; 
            
            let grad = ctx.createRadialGradient(this.x, this.y, radius * 0.1, this.x, this.y, radius);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.2, this.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

        } else if (this.type === 'starburst') {
            const radius = progress * 60;
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
        } else if (this.type === 'blackhole') {
            if (progress < 0.8) {
                const currentRadius = 30 * (progress / 0.8);
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentRadius + 10, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(156, 39, 176, ${alpha})`;
                ctx.lineWidth = 4;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.fill();
            } else {
                const blastPhase = (progress - 0.8) / 0.2;
                const blastRadius = 30 + (blastPhase * 150);
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, blastRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - blastPhase})`;
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

class Shockwave {
    constructor(x, y, color, maxRadius, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 0;
        this.maxRadius = maxRadius;
        this.speed = speed;
        this.alpha = 1;
    }
    update() {
        this.radius += this.speed;
        this.alpha = Math.max(0, 1 - (this.radius / this.maxRadius));
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 3 + 1;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.draw();
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 0.9;
        this.friction = 0.82;
        this.maxSpeed = 6.8; 
        this.radius = 15;
        this.color = '#4CAF50';
        this.maxHealth = 100;
        this.health = 100;
        this.shootCooldown = 0;
        this.fireRate = 12;
        this.projectileSize = 5;
        this.projectileDamage = 1;
        this.spreadCount = 1;
        this.damageReduction = 0; 
        this.chronoFluxChance = 0; 
        this.expMultiplier = 1.0;  
        this.pierce = 0; 
        this.lifesteal = 0; 
        
        // Active Synergy States
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashDuration = 0;

        // Gravity Bar Mechanics
        this.gravityBar = 0; 
        this.displayGravityBar = 0; 
        this.gravityThreshold = 75; 
    }

    draw() {
        ctx.save();
        if (this.isDashing) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 30;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.isDashing ? '#00ffff' : this.color;
        ctx.fill();
        ctx.closePath();
        
        const angle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * 25, this.y + Math.sin(angle) * 25);
        ctx.strokeStyle = this.isDashing ? '#ffffff' : '#aaa';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    ventGravity() {
        if (this.gravityBar > 0) {
            this.gravityBar = Math.max(0, this.gravityBar - 15);
            createExplosion(this.x, this.y, '#00ffff', 8);
            playShootSound(); 
        }
    }

    update() {
        if (this.isDashing) {
            this.dashDuration--;
            this.x += this.vx;
            this.y += this.vy;
            createExplosion(this.x, this.y, '#00ffff', 2);
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.vx *= 0.2;
                this.vy *= 0.2;
            }
            this.draw();
            return;
        }

        if (this.dashCooldown > 0) this.dashCooldown--;

        if (keys.space && this.dashCooldown <= 0 && this.maxSpeed > 6.8 && this.lifesteal > 0) {
            if (this.health > 10) {
                this.health -= 5;
                this.isDashing = true;
                this.dashDuration = 15;
                this.dashCooldown = 90;
                const angle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);
                this.vx = Math.cos(angle) * 24;
                this.vy = Math.sin(angle) * 24;
                playHitSound();
                floatingTexts.push(new FloatingText(this.x, this.y - 30, "BLOOD DASH", '#00ffff', 18));
                this.updateHealthUI();
            }
        }

        this.gravityBar = Math.min(100, this.gravityBar + 0.05); 
        this.displayGravityBar += (this.gravityBar - this.displayGravityBar) * 0.1;

        let currentAccel = this.acceleration;
        let currentMax = this.maxSpeed;

        if (this.gravityBar > this.gravityThreshold) {
            let overage = (this.gravityBar - this.gravityThreshold) / (100 - this.gravityThreshold); 
            let speedMultiplier = 1 - (overage * 0.7); 
            currentAccel *= speedMultiplier;
            currentMax *= speedMultiplier;
        }

        nebulas.forEach(n => {
            if (Math.hypot(this.x - n.x, this.y - n.y) < n.radius) {
                currentAccel *= 0.5;
                currentMax *= 0.5;
            }
        });

        if (keys.w) this.vy -= currentAccel;
        if (keys.s) this.vy += currentAccel;
        if (keys.a) this.vx -= currentAccel;
        if (keys.d) this.vx += currentAccel;

        this.vx *= this.friction;
        this.vy *= this.friction;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > currentMax) {
            const ratio = currentMax / speed;
            this.vx *= ratio;
            this.vy *= ratio;
        }

        this.x += this.vx;
        this.y += this.vy;
        
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (mouse.isDown && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = empDisabledTimer > 0 ? this.fireRate * 2.5 : this.fireRate;
        }
        this.draw();
    }

    shoot() {
        const angle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);
        const baseSpeed = 15;
        playShootSound();
        
        let bulletCount = empDisabledTimer > 0 ? 1 : this.spreadCount;
        let baseDamage = this.projectileDamage;

        if (bulletCount === 1) {
            const velocity = { x: Math.cos(angle) * baseSpeed, y: Math.sin(angle) * baseSpeed };
            projectiles.push(new Projectile(this.x, this.y, this.projectileSize, '#ffff00', velocity, baseDamage));
        } else {
            const spreadStep = 0.15;
            const startOffset = -Math.floor(bulletCount / 2) * spreadStep;
            
            for(let i = 0; i < bulletCount; i++) {
                const spreadAngle = angle + startOffset + (i * spreadStep);
                const velocity = { x: Math.cos(spreadAngle) * baseSpeed, y: Math.sin(spreadAngle) * baseSpeed };
                projectiles.push(new Projectile(this.x, this.y, this.projectileSize, '#00ffff', velocity, baseDamage));
            }
        }
    }

    takeDamage(amount) {
        if (this.isDashing) return; 

        if (this.damageReduction && amount > 0) {
            amount = Math.max(1, Math.round(amount * (1 - this.damageReduction)));
        }

        this.health -= amount;
        if (amount > 0) {
            floatingTexts.push(new FloatingText(this.x, this.y - 20, `-${amount}`, '#f44336', 20));
            playHitSound();
            applyScreenShake(amount > 4 ? 12 : 5);
            for(let i = 0; i < 5; i++) particles.push(new Particle(this.x, this.y, this.color));

            if (this.chronoFluxChance > 0 && Math.random() < this.chronoFluxChance) {
                chronoFluxTimer = 180; 
                floatingTexts.push(new FloatingText(this.x, this.y - 50, "CHRONO FLUX ACTIVE", '#00ffff', 18));
            }
        }
        this.updateHealthUI();

        // Check for new death sequence integration
        if (this.health <= 0 && deathPhase === 0) {
            initiateDeathSequence();
        }
    }

    updateHealthUI() {
        const healthPercent = Math.max(0, (this.health / this.maxHealth) * 100);
        playerHealthBar.style.width = `${healthPercent}%`;
        
        if (healthPercent > 50) playerHealthBar.style.backgroundColor = '#4CAF50';
        else if (healthPercent > 20) playerHealthBar.style.backgroundColor = '#ffeb3b';
        else playerHealthBar.style.backgroundColor = '#f44336';
    }
}

class Projectile {
    constructor(x, y, size, color, velocity, damage) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = size;
        this.color = color;
        this.velocity = velocity;
        this.damage = damage;
        this.distanceTraveled = 0;
        this.piercedCount = 0; 
    }

    draw() {
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = this.color;
        const scale = this.size / 5;
        ctx.fillRect(-10 * scale, -2 * scale, 20 * scale, 4 * scale); 
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.distanceTraveled += Math.hypot(this.velocity.x, this.velocity.y);

        if (player.chronoFluxChance > 0 && player.pierce > 0 && frames % 4 === 0) {
            shockwaves.push(new Shockwave(this.x, this.y, 'rgba(0, 255, 255, 0.15)', 40, 2));
        }
        this.draw();
    }
}

class EnemyProjectile extends Projectile {
    constructor(x, y, size, color, velocity, damage) {
        super(x, y, size, color, velocity, damage);
    }
}

class DynamicHazard {
    constructor(type) {
        this.type = type;
        this.x = player.x + (Math.random() - 0.5) * 2000;
        this.y = player.y + (Math.random() - 0.5) * 2000;
        this.radius = Math.random() * 80 + 40;
        
        if (type === 'asteroid') {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 2 + 1;
            this.vx = Math.cos(angle) * spd;
            this.vy = Math.sin(angle) * spd;
            this.damage = 30;
        } else if (type === 'nebula') {
            this.radius = Math.random() * 150 + 120;
            this.color = 'rgba(156, 39, 176, 0.15)';
        }
    }

    update() {
        if (this.type === 'asteroid') {
            this.x += this.vx;
            this.y += this.vy;
            
            if (Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius) {
                player.takeDamage(2);
                this.vx *= -1;
                this.vy *= -1;
            }

            enemies.forEach(e => {
                if (Math.hypot(e.x - this.x, e.y - this.y) < this.radius + e.radius) {
                    e.health -= 5;
                }
            });
            this.draw();
        } else if (this.type === 'nebula') {
            this.draw();
        }
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.type === 'asteroid') {
            ctx.fillStyle = '#616161';
            ctx.strokeStyle = '#424242';
            ctx.lineWidth = 4;
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.restore();
    }
}

class QuantumPhantom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 65;
        this.maxHealth = 480 + (level * 45);
        this.health = this.maxHealth;
        this.name = "QUANTUM PHANTOM";
        
        this.teleportTimer = 160;
        this.shootCooldown = 40;
        this.alpha = 1.0;
        this.isPhased = false; 
    }

    draw() {
        if (this.alpha <= 0.05) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        ctx.beginPath();
        const pulse = Math.sin(frames * 0.1) * 8;
        ctx.arc(this.x, this.y, this.radius + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 170, 0.3)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#0a1a14';
        ctx.strokeStyle = '#00ffa2';
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    update() {
        this.teleportTimer--;

        if (this.teleportTimer <= 40 && this.teleportTimer > 0) {
            this.isPhased = true;
            this.alpha = Math.max(0, this.alpha - 0.05);
        }

        if (this.teleportTimer <= 0) {
            const teleportAngle = Math.random() * Math.PI * 2;
            const teleportDist = 300 + Math.random() * 400;
            this.x = player.x + Math.cos(teleportAngle) * teleportDist;
            this.y = player.y + Math.sin(teleportAngle) * teleportDist;
            this.teleportTimer = 180 + Math.random() * 80;
            this.isPhased = false; 
        }

        if (!this.isPhased && this.alpha < 1) {
            this.alpha = Math.min(1, this.alpha + 0.05);
        }

        if (this.alpha >= 0.9) {
            this.shootCooldown--;
            if (this.shootCooldown <= 0) {
                playShootSound();
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                for(let i = -1; i <= 1; i++) {
                    const offsetAngle = angleToPlayer + (i * 0.2);
                    const velocity = { x: Math.cos(offsetAngle) * 5.5, y: Math.sin(offsetAngle) * 5.5 };
                    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 7, '#00ffa2', velocity, 15 + Math.floor(level*0.1)));
                }
                this.shootCooldown = 65; 
            }
        }
        this.draw();
    }
}

class AdaptiveNemesis {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 75;
        this.maxHealth = 600 + (level * 60);
        this.health = this.maxHealth;
        this.name = "NEMESIS V.3-ADAPTIVE";
        this.cooldown = 0;
        
        this.counterShield = player.fireRate <= 4; 
        this.counterTractor = player.maxSpeed > 8; 
        this.counterRad = player.lifesteal > 0;   
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a0007';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();

        if (this.counterShield && frames % 120 < 60) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 25, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        if (this.counterTractor && frames % 4 === 0) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(player.x, player.y);
            ctx.strokeStyle = 'rgba(233, 30, 99, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }

    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * 1.5;
        this.y += Math.sin(angle) * 1.5;

        if (this.counterTractor) {
            player.vx -= Math.cos(angle) * 0.25;
            player.vy -= Math.sin(angle) * 0.25;
        }

        if (this.counterRad && frames % 30 === 0) {
            shockwaves.push(new Shockwave(this.x, this.y, 'rgba(255, 0, 85, 0.15)', 300, 3));
        }

        this.cooldown--;
        if (this.cooldown <= 0) {
            for (let i = -1; i <= 1; i++) {
                const projAngle = angle + (i * 0.2);
                const velocity = { x: Math.cos(projAngle) * 6, y: Math.sin(projAngle) * 6 };
                enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 8, '#ff0055', velocity, 22));
            }
            this.cooldown = 80;
        }
        this.draw();
    }
}

class SunBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 70;
        this.maxHealth = 400 + (level * 40);
        this.health = this.maxHealth;
        this.name = "SOLAR FLARE CORE";
        
        this.rotation = 0;
        this.spinSpeed = 0.015;
        this.spinTimer = 120;
        
        this.godRayCooldown = 360;
        this.godRayActive = 0;
        
        this.projCooldown = 0;
        this.projAngle = 0;
        
        this.flashTimer = 0;
    }

    draw() {
        if (this.godRayActive > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            const numRays = 16;
            const rayLength = 3000;
            ctx.fillStyle = `rgba(255, 235, 59, ${(this.godRayActive / 40) * 0.4})`;
            
            for (let i = 0; i < numRays; i++) {
                const angle = (Math.PI * 2 / numRays) * i + (this.rotation * 0.8);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle - 0.1) * rayLength, Math.sin(angle - 0.1) * rayLength);
                ctx.lineTo(Math.cos(angle + 0.1) * rayLength, Math.sin(angle + 0.1) * rayLength);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.beginPath();
        const pulse = Math.sin(frames * 0.1) * 3;
        ctx.arc(this.x, this.y, this.radius + pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#ffc107';
        ctx.shadowColor = '#ff9800';
        ctx.shadowBlur = 40;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, this.rotation - Math.PI/4, this.rotation + Math.PI/4);
        ctx.lineWidth = 12;
        ctx.strokeStyle = this.flashTimer > 0 ? '#ffffff' : '#f44336';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = this.flashTimer > 0 ? '#ff5252' : '#ff5722';
        ctx.fill();
    }

    update() {
        this.spinTimer--;
        if (this.spinTimer <= 0) {
            this.spinSpeed = (Math.random() - 0.5) * 0.04; 
            this.spinTimer = 80 + Math.random() * 100;
        }
        this.rotation += this.spinSpeed;

        if (this.flashTimer > 0) this.flashTimer--;
        if (this.godRayActive > 0) this.godRayActive--;

        this.godRayCooldown--;
        if (this.godRayCooldown <= 0) {
            this.godRayActive = 40; 
            this.godRayCooldown = 400; 
            
            player.takeDamage(5 + Math.floor(level * 0.1)); 
            applyScreenShake(20);
            playBossDieSound();
        }

        this.projCooldown--;
        if (this.projCooldown <= 0) {
            playShootSound();
            const velocity = { x: Math.cos(this.projAngle) * 4, y: Math.sin(this.projAngle) * 4 };
            enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 8, '#ffff00', velocity, 12 + Math.floor(level*0.1)));
            this.projAngle += 0.25;
            this.projCooldown = 15; 
        }

        this.draw();
    }
}

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 80;
        this.maxHealth = 500 + (level * 50);
        this.health = this.maxHealth;
        this.name = "TON-618 SINGULARITY";
        this.pulse = 0;
        this.shootCooldown = 120;
        this.timeAlive = 0; 

        shockwaves.push(new Shockwave(this.x, this.y, '#000000', 2500, 45));
    }

    draw() {
        this.pulse += 0.05;
        const glow = Math.abs(Math.sin(this.pulse)) * 15 + 10;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + glow, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#050505';
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.timeAlive++; 
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const angleToPlayer = Math.atan2(this.y - player.y, this.x - player.x);
        
        const eventHorizon = 900; 
        if (distToPlayer < eventHorizon) {
            const pullStrength = 1 - (distToPlayer / eventHorizon);
            const gravityForce = 1.2 * pullStrength;
            
            player.vx += Math.cos(angleToPlayer) * gravityForce;
            player.vy += Math.sin(angleToPlayer) * gravityForce;
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            playShootSound();
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i + this.pulse;
                const velocity = { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 };
                enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 8, '#ff00ff', velocity, 20 + Math.floor(level*0.1)));
            }
            this.shootCooldown = 100;
        }
        this.draw();
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.timeAlive = 0;
        
        const diff = Math.pow(1.015, level - 1);
        
        if (type === 1) {
            this.radius = 28;
            this.color = '#9c27b0';
            this.speed = Math.min((Math.random() * 0.8 + 0.6) + (level * 0.005), 3.0);
            this.maxHealth = Math.floor((20 + (level * 2)) * diff);
            this.expValue = Math.floor(5 + (level * 0.2)); 
            this.scoreValue = Math.floor((5 + (level * 0.5)) * diff);
            this.damage = Math.floor((40 + (level * 0.2)) * Math.sqrt(diff));
        } else if (type === 2) {
            this.radius = 14;
            this.color = '#00bcd4';
            this.speed = Math.min((Math.random() * 1.5 + 1.5) + (level * 0.01), 4.5);
            this.maxHealth = Math.floor((5 + (level * 0.6)) * diff);
            this.expValue = Math.floor(3 + (level * 0.15));
            this.scoreValue = Math.floor((3 + (level * 0.3)) * diff);
            this.damage = Math.floor((10 + (level * 0.1)) * Math.sqrt(diff));
            this.shootCooldown = Math.floor(Math.random() * 60) + 60;
        } else if (type === 3) { 
            this.radius = 12;
            this.color = '#ff5722';
            this.speed = Math.min((Math.random() * 1.0 + 2.8) + (level * 0.015), 5.5); 
            this.maxHealth = Math.floor((2 + (level * 0.4)) * diff);
            this.expValue = Math.floor(4 + (level * 0.15));
            this.scoreValue = Math.floor((4 + (level * 0.3)) * diff);
            this.damage = Math.floor((50 + (level * 0.5)) * Math.sqrt(diff));
        } else if (type === 4) { 
            this.radius = 18;
            this.color = '#e91e63';
            this.speed = Math.min((Math.random() * 0.4 + 0.9) + (level * 0.005), 2.5);
            this.maxHealth = Math.floor((16 + (level * 1.6)) * diff);
            this.expValue = Math.floor(7 + (level * 0.25));
            this.scoreValue = Math.floor((7 + (level * 0.4)) * diff);
            this.damage = Math.floor((25 + (level * 0.2)) * Math.sqrt(diff));
            this.dashTimer = 70;
        } else if (type === 5) {
            this.radius = 22;
            this.color = '#ffeb3b';
            this.speed = Math.min(0.4 + (level * 0.002), 1.5); 
            this.maxHealth = Math.floor((24 + (level * 2.0)) * diff);
            this.expValue = Math.floor(10 + (level * 0.3));
            this.scoreValue = Math.floor((10 + (level * 0.5)) * diff);
            this.damage = Math.floor((15 + (level * 0.15)) * Math.sqrt(diff));
            this.shootCooldown = 140;
        } else if (type === 6) { 
            this.radius = 15;
            this.color = '#8bc34a';
            this.speed = Math.min((Math.random() * 2.0 + 1.8) + (level * 0.01), 6.0);
            this.maxHealth = Math.floor((6 + (level * 0.8)) * diff);
            this.expValue = Math.floor(5 + (level * 0.2));
            this.scoreValue = Math.floor((4 + (level * 0.3)) * diff);
            this.damage = Math.floor((20 + (level * 0.2)) * Math.sqrt(diff));
        } else if (type === 7) { 
            this.radius = 35;
            this.color = '#ffffff';
            this.speed = Math.min(0.3 + (level * 0.001), 1.2);
            this.maxHealth = Math.floor((80 + (level * 4.0)) * diff);
            this.expValue = Math.floor(15 + (level * 0.4));
            this.scoreValue = Math.floor((20 + (level * 0.6)) * diff);
            this.damage = Math.floor((80 + (level * 0.5)) * Math.sqrt(diff));
        } else {
            this.radius = 16;
            this.color = '#f44336';
            this.speed = Math.min((Math.random() * 1.4 + 1.1) + (level * 0.01), 4.0);
            this.maxHealth = Math.floor((3 + (level * 0.8)) * diff);
            this.expValue = Math.floor(2 + (level * 0.1));
            this.scoreValue = Math.floor((1 + (level * 0.2)) * diff);
            this.damage = Math.floor((15 + (level * 0.1)) * Math.sqrt(diff));
        }
        
        this.health = this.maxHealth;
    }

    draw() {
        ctx.save();
        
        let insideNebula = false;
        nebulas.forEach(n => {
            if (Math.hypot(this.x - n.x, this.y - n.y) < n.radius) insideNebula = true;
        });

        if (this.type === 6 || insideNebula) {
            const alpha = Math.abs(Math.sin(this.timeAlive * 0.05)) * 0.3 + 0.05;
            ctx.globalAlpha = alpha;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        if (this.type === 5) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 7) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius - 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        if (this.type !== 6 && !insideNebula) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * (this.health / this.maxHealth), barHeight);
        }
        ctx.restore();
    }

    update() {
        this.timeAlive++;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const dist = Math.hypot(player.x - this.x, player.y - this.y);

        let currentSpeed = this.speed;
        if (chronoFluxTimer > 0) {
            currentSpeed *= 0.4;
        }

        let masterBoss = activeBoss || activeSunBoss || activeNemesisBoss || activePhantomBoss;
        if (masterBoss && masterBoss !== this) {
            const angleToBoss = Math.atan2(masterBoss.y - this.y, masterBoss.x - this.x);
            this.x += Math.cos(angleToBoss) * 2;
            this.y += Math.sin(angleToBoss) * 2;
        } else {
            if (player.gravityBar > player.gravityThreshold) {
                let overage = (player.gravityBar - player.gravityThreshold) / (100 - player.gravityThreshold);
                let pullForce = overage * 4.5; 
                if (dist < 800) {
                    this.x += Math.cos(angle) * pullForce;
                    this.y += Math.sin(angle) * pullForce;
                }
            }
            
            if (this.type === 2) {
                if (dist > 350) {
                    this.x += Math.cos(angle) * currentSpeed;
                    this.y += Math.sin(angle) * currentSpeed;
                } else if (dist < 250) {
                    this.x -= Math.cos(angle) * currentSpeed;
                    this.y -= Math.sin(angle) * currentSpeed;
                }
                
                let attackCooldownDecrease = chronoFluxTimer > 0 ? 0.4 : 1;
                if (this.shootCooldown > 0) this.shootCooldown -= attackCooldownDecrease;
                if (this.shootCooldown <= 0 && dist < 500) {
                    const velocity = { x: Math.cos(angle) * 7, y: Math.sin(angle) * 7 };
                    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 5, '#ff9800', velocity, this.damage));
                    this.shootCooldown = 90;
                }
            } else if (this.type === 4) {
                this.dashTimer--;
                if (this.dashTimer <= 0) {
                    let dashMult = chronoFluxTimer > 0 ? 3 : 8; 
                    this.x += Math.cos(angle) * (currentSpeed * dashMult);
                    this.y += Math.sin(angle) * (currentSpeed * dashMult);
                    if (this.dashTimer <= -12) { 
                        this.dashTimer = 80 + Math.random() * 60;
                    }
                } else {
                    this.x += Math.cos(angle) * currentSpeed;
                    this.y += Math.sin(angle) * currentSpeed;
                }
            } else if (this.type === 5) {
                if (dist > 450) {
                    this.x += Math.cos(angle) * currentSpeed;
                    this.y += Math.sin(angle) * currentSpeed;
                }

                let rate = chronoFluxTimer > 0 ? 0.5 : 1;
                if (this.shootCooldown > 0) this.shootCooldown -= rate;
                if (this.shootCooldown <= 0 && dist < 700) {
                    playShootSound();
                    for (let i = 0; i < 6; i++) {
                        let bulletAngle = angle + (Math.PI * 2 / 6) * i;
                        const velocity = { x: Math.cos(bulletAngle) * 5, y: Math.sin(bulletAngle) * 5 };
                        enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 6, '#ffeb3b', velocity, this.damage));
                    }
                    this.shootCooldown = 150;
                }
            } else {
                this.x += Math.cos(angle) * currentSpeed;
                this.y += Math.sin(angle) * currentSpeed;
            }
        }

        this.draw();
    }
}

let projectiles = [];
let enemyProjectiles = [];
let enemies = [];
let particles = [];
let shockwaves = [];
let distantEvents = []; 
let floatingTexts = [];

class FloatingText {
    constructor(x, y, text, color, size = 16) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 1.0;
        this.vy = -1 - Math.random(); 
    }

    update() {
        this.y += this.vy;
        this.life -= 0.02;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = `bold ${this.size}px Arial`;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

const upgradesList = [
    { 
        name: "Rapid Fire", 
        desc: "Decreases shoot cooldown.", 
        condition: () => player.fireRate > 2, 
        apply: () => player.fireRate = Math.max(2, player.fireRate - 1) 
    },
    { 
        name: "Spread Shot", 
        desc: "+2 Projectiles per shot.", 
        condition: () => player.spreadCount < 11, 
        apply: () => player.spreadCount += 2 
    },
    { 
        name: "Heavy Rounds", 
        desc: "Infinite Damage boost.", 
        condition: () => true, 
        apply: () => { player.projectileDamage += 2.5; player.projectileSize += 1; } 
    },
    { 
        name: "Agility", 
        desc: "Increases movement speed. Enables Active Dash if Vampiric Strike is owned.", 
        condition: () => player.maxSpeed < 13, 
        apply: () => player.maxSpeed += 0.5 
    },
    { 
        name: "Vitality", 
        desc: "Max HP +20 and fully heals.", 
        condition: () => true, 
        apply: () => { player.maxHealth += 20; player.health = player.maxHealth; player.takeDamage(0); } 
    },
    { 
        name: "Aegis Shield", 
        desc: "Mitigates incoming damage by 15% permanently.", 
        condition: () => player.damageReduction < 0.60, 
        apply: () => player.damageReduction += 0.15
    },
    {
        name: "Chrono Flux",
        desc: "Chance to warp time and slow down space elements upon hit.",
        condition: () => player.chronoFluxChance < 0.45,
        apply: () => player.chronoFluxChance += 0.15
    },
    {
        name: "Void Harvest",
        desc: "+25% increase to cosmic experience gain factors.",
        condition: () => player.expMultiplier < 2.5,
        apply: () => player.expMultiplier += 0.25
    },
    {
        name: "Piercing Rounds",
        desc: "Projectiles pass through additional enemies.",
        condition: () => player.pierce < 5,
        apply: () => player.pierce += 1
    },
    {
        name: "Vampiric Strike",
        desc: "Adds chance to repair HP on kills. Enables Active Dash if Agility is owned.",
        condition: () => player.lifesteal < 0.25,
        apply: () => player.lifesteal += 0.05
    }
];

function initStars() {
    stars = [];
    const colors = ['#ffffff', '#ffffff', '#80deea', '#b388ff'];
    for (let i = 0; i < 500; i++) { 
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: 0,
            vy: 0,
            size: Math.random() * 2.5 + 0.5,
            speedFactor: Math.random() * 0.4 + 0.1,
            twinkleSpeed: Math.random() * 0.03 + 0.005,
            alpha: Math.random(),
            dir: Math.random() > 0.5 ? 1 : -1,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function updateAndDrawStars(playerVx, playerVy) {
    for (let i = 0; i < stars.length; i++) {
        let star = stars[i];
        
        star.alpha += star.twinkleSpeed * star.dir;
        if (star.alpha > 1 || star.alpha < 0.2) star.dir *= -1;
        
        star.x -= playerVx * star.speedFactor;
        star.y -= playerVy * star.speedFactor;
        
        star.x += star.vx;
        star.y += star.vy;
        
        star.vx *= 0.92;
        star.vy *= 0.92;
        
        let targetBoss = activeBoss || activePhantomBoss;
        if (targetBoss) {
            const starWorldX = star.x + player.x - canvas.width/2;
            const starWorldY = star.y + player.y - canvas.height/2;
            const angleToBoss = Math.atan2(targetBoss.y - starWorldY, targetBoss.x - starWorldX);
            star.x += Math.cos(angleToBoss) * 2;
            star.y += Math.sin(angleToBoss) * 2;
        }
        
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
        
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;
}

function init() {
    initAudio();
    player = new Player(0, 0);
    projectiles = [];
    enemyProjectiles = [];
    enemies = [];
    particles = [];
    shockwaves = [];
    distantEvents = [];
    floatingTexts = [];
    asteroids = [];
    nebulas = [];
    activeBoss = null;
    activeSunBoss = null;
    activeNemesisBoss = null;
    activePhantomBoss = null;
    
    levelsSinceBlackhole = 10;
    levelsSinceSun = 10;
    levelsSinceNemesis = 20;
    levelsSincePhantom = 15;
    
    empTimer = 0;
    empDisabledTimer = 0;
    supernovaActive = false;
    supernovaTimer = 180 * 60;
    supernovaRadius = 2500;
    gameWon = false;
    screenShake = 0;
    chronoFluxTimer = 0;
    score = 0;
    level = 1;
    exp = 0;
    expToNextLevel = 10; 
    frames = 0;
    isGameOver = false;
    isPaused = false;
    
    // NEW DEATH STATE RESET
    deathPhase = 0; 
    deathTimer = 0;
    
    gridColorState = { r: 0, g: 191, b: 255, a: 0.45 }; 
    
    asteroidBeltEvent = {
        stage: 0,
        timer: 1500, 
        stageTimer: 0,
        paths: [],
        rocks: []
    };

    initStars();
    updateHUD();
    player.takeDamage(0);
    
    mainMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    upgradeScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    animate();
}

function updateHUD() {
    scoreDisplay.innerText = score;
    levelDisplay.innerText = level;
    const expPercent = Math.min(100, (exp / expToNextLevel) * 100);
    expBar.style.width = `${expPercent}%`;
}

function addExperience(amount) {
    if (player && player.expMultiplier) {
        amount = Math.round(amount * player.expMultiplier);
    }

    if (amount > 0) {
        floatingTexts.push(new FloatingText(player.x, player.y - 40, `+${amount} XP`, '#00bcd4', 16));
    }
    
    exp += amount;
    
    while (exp >= expToNextLevel) {
        exp -= expToNextLevel;
        level++;
        levelsSinceBlackhole++;
        levelsSinceSun++;
        levelsSinceNemesis++;
        levelsSincePhantom++; 
        
        if (level === 11) {
            for(let i=0; i<8; i++) asteroids.push(new DynamicHazard('asteroid'));
        } else if (level === 21) {
            asteroids = [];
            for(let i=0; i<4; i++) nebulas.push(new DynamicHazard('nebula'));
        } else if (level === 31) {
            nebulas = [];
            empTimer = 300; 
        } else if (level === 41) {
            empDisabledTimer = 0;
        }

        if (level >= 100 && !supernovaActive) {
            supernovaActive = true;
            floatingTexts.push(new FloatingText(player.x, player.y - 80, "SUPERNOVA IMMINENT: INVERSION PROTOCOL", '#ff0055', 24));
        }

        expToNextLevel = Math.floor(10 + (level * 12) + (Math.pow(level, 2) * 0.4)); 
        triggerLevelUp();
    }
    updateHUD();
}

function triggerLevelUp() {
    isPaused = true;
    mouse.isDown = false;
    playLevelUpSound();
    upgradeOptionsContainer.innerHTML = '';
    
    let availableUpgrades = upgradesList.filter(u => u.condition());
    if (availableUpgrades.length === 0) {
        availableUpgrades = [upgradesList[2], upgradesList[4]]; 
    }

    let shuffled = availableUpgrades.sort(() => 0.5 - Math.random());
    let selectedUpgrades = shuffled.slice(0, 3);
    
    selectedUpgrades.forEach(upgrade => {
        const card = document.createElement('div');
        card.classList.add('upgrade-card');
        card.innerHTML = `<h3>${upgrade.name}</h3><p>${upgrade.desc}</p>`;
        card.addEventListener('click', () => {
            playClickSound();
            upgrade.apply();
            isPaused = false;
            upgradeScreen.classList.add('hidden');
            hud.classList.remove('hidden');
            animate();
        });
        upgradeOptionsContainer.appendChild(card);
    });
    
    hud.classList.add('hidden');
    upgradeScreen.classList.remove('hidden');
}

function spawnEnemy() {
    const spawnRadius = Math.max(canvas.width, canvas.height);
    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * spawnRadius;
    const y = player.y + Math.sin(angle) * spawnRadius;
    
    let possibleTypes = [0]; 
    if (level > 2) possibleTypes.push(2); 
    if (level > 4) possibleTypes.push(3); 
    if (level > 6) possibleTypes.push(4); 
    if (level > 8) possibleTypes.push(5); 
    if (level > 12) possibleTypes.push(6);
    if (level > 18) possibleTypes.push(7); 

    let chosenType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    enemies.push(new Enemy(x, y, chosenType));
}

function getSmoothGridColor() {
    let target = { r: 0, g: 191, b: 255, a: 0.45 }; 
    
    if (player.gravityBar > player.gravityThreshold) target = { r: 0, g: 255, b: 255, a: 0.7 };
    else if (activeBoss) target = { r: 156, g: 39, b: 176, a: 0.6 };
    else if (activeSunBoss) target = { r: 255, g: 152, b: 0, a: 0.6 };
    else if (activeNemesisBoss) target = { r: 255, g: 0, b: 85, a: 0.6 };
    else if (activePhantomBoss) target = { r: 0, g: 255, b: 170, a: 0.6 }; 

    gridColorState.r += (target.r - gridColorState.r) * 0.02;
    gridColorState.g += (target.g - gridColorState.g) * 0.02;
    gridColorState.b += (target.b - gridColorState.b) * 0.02;
    gridColorState.a += (target.a - gridColorState.a) * 0.02;
    
    return `rgba(${Math.round(gridColorState.r)}, ${Math.round(gridColorState.g)}, ${Math.round(gridColorState.b)}, ${gridColorState.a})`;
}

function drawInfiniteGrid(cameraX, cameraY) {
    const gridSize = 100;
    const stepSize = 15; 
    
    const startX = Math.floor(cameraX / gridSize) * gridSize - gridSize;
    const endX = startX + canvas.width + gridSize * 2;
    const startY = Math.floor(cameraY / gridSize) * gridSize - gridSize;
    const endY = startY + canvas.height + gridSize * 2;

    let coreBoss = activeBoss || activeSunBoss || activeNemesisBoss || activePhantomBoss;

    function getLensedPosition(worldX, worldY) {
        let finalX = worldX;
        let finalY = worldY;
        let finalFactor = 0;

        if (coreBoss) {
            const dx = worldX - coreBoss.x;
            const dy = worldY - coreBoss.y;
            const dist = Math.hypot(dx, dy);
            const maxInfluenceRadius = 900; 
            
            if (dist > 0 && dist <= maxInfluenceRadius) {
                let linearForce = 1.0 - (dist / maxInfluenceRadius);
                let smoothForce = linearForce * linearForce * (3.0 - 2.0 * linearForce);
                let pulse = 1.0 + Math.sin(frames * 0.04) * 0.08;
                let basePull = 420 * pulse;
                let pull = Math.min(basePull * smoothForce, dist * 0.93);
                
                const angle = Math.atan2(dy, dx);
                finalX -= Math.cos(angle) * pull;
                finalY -= Math.sin(angle) * pull;
                finalFactor = Math.max(finalFactor, smoothForce);
            }
        }

        if (player.gravityBar > player.gravityThreshold) {
            const dx = worldX - player.x;
            const dy = worldY - player.y;
            const dist = Math.hypot(dx, dy);
            const maxPlayerInfluence = 800;

            if (dist > 0 && dist <= maxPlayerInfluence) {
                let overage = (player.gravityBar - player.gravityThreshold) / (100 - player.gravityThreshold);
                let linearForce = 1.0 - (dist / maxPlayerInfluence);
                let smoothForce = linearForce * linearForce * (3.0 - 2.0 * linearForce) * overage;
                let pull = Math.min(300 * smoothForce, dist * 0.8);

                const angle = Math.atan2(dy, dx);
                finalX -= Math.cos(angle) * pull;
                finalY -= Math.sin(angle) * pull;
                finalFactor = Math.max(finalFactor, smoothForce);
            }
        }

        return { x: finalX, y: finalY, factor: finalFactor };
    }

    const currentStrainColor = getSmoothGridColor(); 

    for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        let first = true;
        let maxLineFactor = 0;
        
        for (let y = startY; y <= endY; y += stepSize) {
            const pt = getLensedPosition(x, y);
            if (pt.factor > maxLineFactor) maxLineFactor = pt.factor;
            
            if (first) {
                ctx.moveTo(pt.x, pt.y);
                first = false;
            } else {
                ctx.lineTo(pt.x, pt.y);
            }
        }
        
        if (maxLineFactor > 0.05 && (coreBoss || player.gravityBar > player.gravityThreshold)) {
            ctx.strokeStyle = currentStrainColor;
            ctx.lineWidth = 1.5 + maxLineFactor * 2.0;
        } else {
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
        }
        ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        let first = true;
        let maxLineFactor = 0;
        
        for (let x = startX; x <= endX; x += stepSize) {
            const pt = getLensedPosition(x, y);
            if (pt.factor > maxLineFactor) maxLineFactor = pt.factor;
            
            if (first) {
                ctx.moveTo(pt.x, pt.y);
                first = false;
            } else {
                ctx.lineTo(pt.x, pt.y);
            }
        }
        
        if (maxLineFactor > 0.05 && (coreBoss || player.gravityBar > player.gravityThreshold)) {
            ctx.strokeStyle = currentStrainColor;
            ctx.lineWidth = 1.5 + maxLineFactor * 2.0;
        } else {
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
        }
        ctx.stroke();
    }
}

function drawBossUI() {
    let currentBoss = activeBoss || activeSunBoss || activeNemesisBoss || activePhantomBoss;
    if (!currentBoss) return;
    
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    
    const barWidth = canvas.width * 0.6;
    const barHeight = 20;
    const x = (canvas.width - barWidth) / 2;
    const y = 40;
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentBoss.name, canvas.width / 2, y - 10);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const healthPercent = Math.max(0, currentBoss.health / currentBoss.maxHealth);
    
    if (activeBoss) ctx.fillStyle = '#9c27b0';
    else if (activeSunBoss) ctx.fillStyle = '#ff9800';
    else if (activeNemesisBoss) ctx.fillStyle = '#ff0055';
    else if (activePhantomBoss) ctx.fillStyle = '#00ffa2';

    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    ctx.restore();
}

function drawSupernovaTimer() {
    if (!supernovaActive) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    let secondsLeft = Math.ceil(supernovaTimer / 60);
    ctx.fillText(`CONTAINMENT CRITICAL: ${secondsLeft}s`, canvas.width / 2, 100);
    ctx.restore();
}

function drawPlayerGravityBar() {
    if (!player) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    
    const barWidth = 200;
    const barHeight = 16; 
    const x = canvas.width / 2 - barWidth / 2;
    const y = canvas.height / 2 + 50; 
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const fillPercent = player.displayGravityBar / 100;
    ctx.fillStyle = player.gravityBar > player.gravityThreshold ? '#00ffff' : '#8bc34a';
    ctx.fillRect(x, y, barWidth * fillPercent, barHeight);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    const thresholdX = x + (barWidth * (player.gravityThreshold / 100));
    ctx.beginPath();
    ctx.moveTo(thresholdX, y - 4);
    ctx.lineTo(thresholdX, y + barHeight + 4);
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(player.gravityBar)}%`, canvas.width / 2, y + barHeight / 2 + 1);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText("STABILIZE [G]", canvas.width / 2, y + 35);
    
    ctx.restore();
}

function createExplosion(x, y, color, amount) {
    for (let i = 0; i < amount; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateAsteroidBeltEvent() {
    if (isGameOver || isPaused || gameWon || supernovaActive) return;

    if (asteroidBeltEvent.stage === 0) {
        asteroidBeltEvent.timer--;
        if (asteroidBeltEvent.timer <= 0) {
            asteroidBeltEvent.stage = 1;
            asteroidBeltEvent.stageTimer = 120; 
            asteroidBeltEvent.paths = [];
            asteroidBeltEvent.rocks = [];
        }
        return;
    }

    if (asteroidBeltEvent.stage === 1) {
        asteroidBeltEvent.stageTimer--;
        if (asteroidBeltEvent.stageTimer <= 0) {
            asteroidBeltEvent.stage = 2;
            asteroidBeltEvent.stageTimer = 150; 

            const camY = player.y - canvas.height / 2;
            const numTracks = 3 + Math.floor(Math.random() * 3); 

            for (let i = 0; i < numTracks; i++) {
                asteroidBeltEvent.paths.push({
                    y: camY + (canvas.height * 0.15) + (Math.random() * canvas.height * 0.7),
                    height: 75,
                    direction: Math.random() > 0.5 ? 1 : -1 
                });
            }
        }
        return;
    }

    if (asteroidBeltEvent.stage === 2) {
        asteroidBeltEvent.stageTimer--;
        if (asteroidBeltEvent.stageTimer <= 0) {
            asteroidBeltEvent.stage = 3;
            asteroidBeltEvent.stageTimer = 240; 

            asteroidBeltEvent.paths.forEach(path => {
                const camX = player.x - canvas.width / 2;
                let numRocks = 4 + Math.floor(Math.random() * 4);
                
                for (let r = 0; r < numRocks; r++) {
                    let startX = path.direction === 1 
                        ? camX - 250 - (r * 300) 
                        : camX + canvas.width + 250 + (r * 300);
                    
                    asteroidBeltEvent.rocks.push({
                        x: startX,
                        y: path.y + (Math.random() - 0.5) * 20, 
                        vx: path.direction * (13 + Math.random() * 6), 
                        radius: 25 + Math.random() * 20,
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.08,
                        color: ['#4e342e', '#5d4037', '#795548', '#3e2723'][Math.floor(Math.random() * 4)]
                    });
                }
            });
        }
        return;
    }

    if (asteroidBeltEvent.stage === 3) {
        asteroidBeltEvent.stageTimer--;

        for (let i = asteroidBeltEvent.rocks.length - 1; i >= 0; i--) {
            let rock = asteroidBeltEvent.rocks[i];
            rock.x += rock.vx;
            rock.rotation += rock.rotSpeed;

            let dist = Math.hypot(player.x - rock.x, player.y - rock.y);
            if (dist < player.radius + rock.radius && !player.isDashing) {
                let chunkDamage = Math.floor(player.maxHealth * 0.55); 
                if (player.health - chunkDamage <= 0) {
                    chunkDamage = player.health - 1; 
                }
                
                if (chunkDamage > 0) {
                    player.takeDamage(chunkDamage);
                    floatingTexts.push(new FloatingText(player.x, player.y - 40, "CRITICAL BELT IMPACT!", '#ff3d00', 22));
                }
                
                asteroidBeltEvent.rocks.splice(i, 1);
                continue;
            }

            const camX = player.x - canvas.width / 2;
            if ((rock.vx > 0 && rock.x > camX + canvas.width + 1200) || 
                (rock.vx < 0 && rock.x < camX - 1200)) {
                asteroidBeltEvent.rocks.splice(i, 1);
            }
        }

        if (asteroidBeltEvent.stageTimer <= 0 || asteroidBeltEvent.rocks.length === 0) {
            asteroidBeltEvent.stage = 0;
            asteroidBeltEvent.timer = 1800 + Math.floor(Math.random() * 1800); 
            asteroidBeltEvent.paths = [];
            asteroidBeltEvent.rocks = [];
        }
    }
}

// --- NEW SYSTEM: Cinematic Death Functions ---
function initiateDeathSequence() {
    deathPhase = 1;
    deathTimer = 180; 
    
    createExplosion(player.x, player.y, player.color, 80);
    createExplosion(player.x, player.y, '#ff0055', 50);
    createExplosion(player.x, player.y, '#ffffff', 30);
    
    shockwaves.push(new Shockwave(player.x, player.y, 'rgba(255, 0, 85, 0.8)', 2500, 18));
    shockwaves.push(new Shockwave(player.x, player.y, 'rgba(255, 255, 255, 0.9)', 1200, 12));
    
    applyScreenShake(50); 
    playGameOverSound();
}

function showDeathScreen() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden'); 
    finalScoreDisplay.innerText = score;
    finalLevelDisplay.innerText = level;
}


function animate() {
    if (isGameOver || isPaused || gameWon) return;
    animationId = requestAnimationFrame(animate);
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (chronoFluxTimer > 0) chronoFluxTimer--;

    updateAsteroidBeltEvent();

    if (Math.random() < 0.003) {
        distantEvents.push(new DistantEvent(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    for (let i = distantEvents.length - 1; i >= 0; i--) {
        distantEvents[i].update(player.vx, player.vy);
        if (distantEvents[i].age >= distantEvents[i].maxAge) distantEvents.splice(i, 1);
    }

    updateAndDrawStars(player.vx, player.vy);

    ctx.save();
    
    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    const cameraX = player.x - canvas.width / 2;
    const cameraY = player.y - canvas.height / 2;
    mouse.worldX = mouse.x + cameraX;
    mouse.worldY = mouse.y + cameraY;
    
    ctx.translate(-cameraX, -cameraY);
    drawInfiniteGrid(cameraX, cameraY);

    asteroids.forEach(a => a.update());
    nebulas.forEach(n => n.update());

    if (asteroidBeltEvent.stage === 2) {
        ctx.save();
        asteroidBeltEvent.paths.forEach(path => {
            let laneAlpha = 0.15 + Math.abs(Math.sin(frames * 0.15)) * 0.15;
            ctx.fillStyle = `rgba(255, 0, 0, ${laneAlpha})`;
            ctx.fillRect(cameraX - 600, path.y - path.height / 2, canvas.width + 1200, path.height);

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 10]);
            ctx.strokeRect(cameraX - 600, path.y - path.height / 2, canvas.width + 1200, path.height);
        });
        ctx.restore();
    }

    if (asteroidBeltEvent.stage === 3) {
        asteroidBeltEvent.rocks.forEach(rock => {
            ctx.save();
            ctx.translate(rock.x, rock.y);
            ctx.rotate(rock.rotation);

            ctx.beginPath();
            const points = 9;
            for (let p = 0; p < points; p++) {
                let rockAngle = (Math.PI * 2 / points) * p;
                let rockRadiusVariance = rock.radius * (0.85 + Math.sin(p * 3.8) * 0.15);
                let px = Math.cos(rockAngle) * rockRadiusVariance;
                let py = Math.sin(rockAngle) * rockRadiusVariance;
                
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = rock.color;
            ctx.strokeStyle = '#231512';
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(-rock.radius * 0.25, -rock.radius * 0.15, rock.radius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fill();
            ctx.restore();
        });
    }

    if (empTimer > 0) {
        empTimer--;
        if (empTimer <= 0) {
            empDisabledTimer = 300; 
            floatingTexts.push(new FloatingText(player.x, player.y - 60, "WEAPON MATRIX OFFLINE", '#ff5722', 20));
            empTimer = 600; 
        }
    }
    if (empDisabledTimer > 0) empDisabledTimer--;

    if (supernovaActive) {
        supernovaTimer--;
        supernovaRadius -= 0.3; 
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, supernovaRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();

        enemies.forEach(e => {
            if (Math.hypot(e.x - player.x, e.y - player.y) > supernovaRadius) {
                e.health = 0; 
            }
        });

        if (supernovaTimer <= 0) {
            gameWon = true;
            cancelAnimationFrame(animationId);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            alert("SYSTEM ASCENSION SUCCESSFUL. YOU SURVIVED THE CORE INSURGENCY.");
            return;
        }
    }

    if (level > 10 && !activeBoss && !activeSunBoss && !activeNemesisBoss && !activePhantomBoss && !supernovaActive) {
        if (Math.random() < 0.0008) { 
            if (levelsSincePhantom >= 10 && Math.random() < 0.25) {
                activePhantomBoss = new QuantumPhantom(player.x, player.y - 650);
                levelsSincePhantom = 0;
            } else if (levelsSinceNemesis >= 14 && Math.random() < 0.2) {
                activeNemesisBoss = new AdaptiveNemesis(player.x, player.y - 650);
                levelsSinceNemesis = 0;
            } else if (levelsSinceSun >= 7 && Math.random() < 0.4) {
                activeSunBoss = new SunBoss(player.x, player.y - 650);
                levelsSinceSun = 0;
            } else if (levelsSinceBlackhole >= 4) {
                activeBoss = new Boss(player.x, player.y - 650);
                levelsSinceBlackhole = 0;
            }
        }
    }

    if (activeBoss) {
        activeBoss.update();
        if (Math.hypot(player.x - activeBoss.x, player.y - activeBoss.y) < activeBoss.radius + player.radius) player.takeDamage(2);
    }
    if (activeSunBoss) {
        activeSunBoss.update();
        if (Math.hypot(player.x - activeSunBoss.x, player.y - activeSunBoss.y) < activeSunBoss.radius + player.radius) player.takeDamage(1);
    }
    if (activeNemesisBoss) {
        activeNemesisBoss.update();
        if (Math.hypot(player.x - activeNemesisBoss.x, player.y - activeNemesisBoss.y) < activeNemesisBoss.radius + player.radius) player.takeDamage(2);
    }
    if (activePhantomBoss) {
        activePhantomBoss.update();
        if (!activePhantomBoss.isPhased && Math.hypot(player.x - activePhantomBoss.x, player.y - activePhantomBoss.y) < activePhantomBoss.radius + player.radius) {
            player.takeDamage(2);
        }
    }

    // UPDATED CHECK: Only update and draw player if they are alive (death phase 0)
    if (deathPhase === 0) {
        player.update();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        let hit = false;
        let master = activeBoss || activeSunBoss || activeNemesisBoss || activePhantomBoss;

        if (master) {
            let isDeflected = activeNemesisBoss && activeNemesisBoss.counterShield && (frames % 120 < 60);
            let isPhased = activePhantomBoss && activePhantomBoss.isPhased; 
            
            if (!isDeflected && !isPhased && Math.hypot(p.x - master.x, p.y - master.y) < master.radius) {
                master.health -= p.damage;
                floatingTexts.push(new FloatingText(p.x, p.y, p.damage, '#ffffff', 18));
                
                if (player.spreadCount >= 5 && player.projectileDamage > 5) {
                    for(let k=0; k<4; k++) {
                        const flakAngle = (Math.PI / 2) * k;
                        projectiles.push(new Projectile(p.x, p.y, 3, '#ffaa00', {x:Math.cos(flakAngle)*6, y:Math.sin(flakAngle)*6}, p.damage*0.4));
                    }
                }

                hit = true;
                if (master.health <= 0) {
                    playBossDieSound();
                    score += 1500;
                    addExperience(400);
                    activeBoss = null; activeSunBoss = null; activeNemesisBoss = null; activePhantomBoss = null;
                }
            }
        }

        if (hit) {
            p.piercedCount++;
            if (p.piercedCount > player.pierce) projectiles.splice(i, 1);
            continue;
        }
        if (p.distanceTraveled > 1500) projectiles.splice(i, 1);
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const ep = enemyProjectiles[i];
        ep.update();
        if (Math.hypot(player.x - ep.x, player.y - ep.y) < player.radius + ep.radius) {
            player.takeDamage(ep.damage);
            enemyProjectiles.splice(i, 1);
            continue;
        }
        if (ep.distanceTraveled > 2000) enemyProjectiles.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();

        if (enemy.health <= 0) {
            enemies.splice(i, 1);
            continue;
        }

        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.radius + player.radius) {
            if (player.isDashing) {
                enemy.health -= 150; 
                createExplosion(enemy.x, enemy.y, enemy.color, 20);
            } else {
                player.takeDamage(enemy.damage);
                if (enemy.type !== 1 && enemy.type !== 5 && enemy.type !== 7) enemies.splice(i, 1);
            }
            continue;
        }

        for (let j = projectiles.length - 1; j >= 0; j--) {
            const projectile = projectiles[j];
            if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) < enemy.radius + projectile.radius) {
                enemy.health -= projectile.damage;
                floatingTexts.push(new FloatingText(projectile.x, projectile.y, projectile.damage, '#ffffff', 16));
                
                projectile.piercedCount++;
                if (projectile.piercedCount > player.pierce) projectiles.splice(j, 1);
                
                if (enemy.health <= 0) {
                    playEnemyDieSound(enemy.type === 7);
                    enemies.splice(i, 1);
                    score += enemy.scoreValue;
                    addExperience(enemy.expValue); 

                    if (player.lifesteal > 0 && Math.random() < player.lifesteal) {
                        player.health = Math.min(player.maxHealth, player.health + 2);
                        player.updateHealthUI();
                    }
                }
                break;
            }
        }
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
        shockwaves[i].update();
        if (shockwaves[i].alpha <= 0) shockwaves.splice(i, 1);
    }

    frames++;

    if (!activeBoss && !activeSunBoss && !activeNemesisBoss && !activePhantomBoss) {
        let spawnRate = Math.max(2, 50 - Math.floor(level / 5)); 
        if (supernovaActive) spawnRate = 4; 
        if (frames % spawnRate === 0 && enemies.length < 140) spawnEnemy();
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    ctx.restore();
    drawBossUI();
    drawSupernovaTimer();
    drawPlayerGravityBar(); 

    if (asteroidBeltEvent.stage === 1) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 

        let dangerAlpha = 0.12 + Math.abs(Math.sin(frames * 0.1)) * 0.18; 
        ctx.fillStyle = `rgba(255, 0, 0, ${dangerAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 38px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;

        if (Math.floor(frames / 15) % 2 === 0) {
            ctx.fillText("⚠️ ASTEROID BELT NEARBY ⚠️", canvas.width / 2, canvas.height / 3.2);
        }
        ctx.restore();
    }
    
    // --- NEW: DEATH CINEMATIC OVERLAY ---
    if (deathPhase === 1) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        
        let fadeProgress = 1 - (deathTimer / 180);
        ctx.fillStyle = `rgba(10, 0, 0, ${fadeProgress * 0.9})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (Math.random() < 0.4) {
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#ff0055' : '#00ffff';
            ctx.font = 'bold 72px "Courier New", Courier, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 20;
            
            ctx.fillText("SYSTEM CRITICAL FAILURE", (canvas.width / 2) + offsetX, (canvas.height / 2) + offsetY);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, canvas.height / 2 + offsetY - 10, canvas.width, 5);
        }
        ctx.restore();
        
        deathTimer--;
        if (deathTimer <= 0) {
            showDeathScreen();
        }
    }
}

function returnToMenu() {
    gameOverScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
}

startBtn.addEventListener('click', () => { playClickSound(); init(); });
respawnBtn.addEventListener('click', () => { playClickSound(); init(); });
menuBtn.addEventListener('click', () => { playClickSound(); returnToMenu(); });