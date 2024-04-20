const canvas = document.getElementById('canvas');
const body = document.getElementById('*');
const ctx = canvas.getContext('2d');
const magicCursor = document.getElementById('magicMouseCursor');
canvas.width = window.innerWidth;
canvas.height = 10 * window.innerHeight;
let spots = [];
let dots = document.getElementsByClassName('dots');
let paths = [];
let bgspots = [];
let connectspots = [];
let hue = 130;
var up = true;

const mouse = {
    x: undefined,
    y: undefined
}

const page = {
    x: undefined,
    y: undefined
}













document.body.onscroll = () => {
    let dx = page.x - window.scrollX;
    let dy = page.y - window.scrollY;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let count = Math.min(dist / 10 - Math.random() / 2, 3)
    mouse.x += window.scrollX - page.x;
    mouse.y += window.scrollY - page.y;
    page.x = window.scrollX;
    page.y = window.scrollY;
    for (let i = 0; i < count; i++) {
        let part = new Particle();
        part.updateSpeed(2 + dist / 50);
        spots.push(part);
    }
}

body.addEventListener('mousemove', (event) => {
    let dx = mouse.x - window.scrollX - event.x;
    let dy = mouse.y - window.scrollY - event.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let count = Math.min(dist / 10 - Math.random() / 2, 3)
    mouse.x = event.x + window.scrollX;
    mouse.y = event.y + window.scrollY;
    for (let i = 0; i < count; i++) {
        let part = new Particle();
        part.updateSpeed(2 + dist / 50);
        spots.push(part);
    }

    if (count > 1 && bgspots.length <= 10) {
        Math.random(); Math.random();
        for (let i = 0; i < Math.random() - 0.9; i++) {
            let part = new Particle();
            part.updateSpeed(0.5 + dist / 50);
            part.updateRand(40);
            part.updateDuration(0.001)
            bgspots.push(part);
        }
    }
})

body.addEventListener('mousedown', (event) => {
    mouse.x = event.x + window.scrollX;
    mouse.y = event.y + window.scrollY;
    for (let i = 0; i < 35; i++) {
        let part = new Particle();
        part.updateSpeed(70);
        bgspots.push(part);
    }

    for (let i = 0; i < 50; i++) {
        let part = new Particle();
        part.updateSpeed(10);
        bgspots.push(part);
    }
})

class Particle {
    constructor() {
        this.x = mouse.x;
        this.y = mouse.y;
        this.size = Math.random() * 2.3 + 0.3;
        this.updateSpeed(3);
        this.color = 'hsl(' + hue + ', 100%, 50%)';
        this.change = 0.03;
    }

    updateRand(rand) {
        this.x += Math.random() * rand - rand / 2;
        this.y += Math.random() * rand - rand / 2;
    }

    updateSize(rand) {
        this.size = Math.random() * (rand) + 0.1;
    }

    worldSpawn(x, y) {
        this.x = x;
        this.y = y;
    }

    updateDuration(dur) {
        this.change = dur;
    }

    updateSpeed(speed) {
        this.size = Math.random() * (1.5 + speed / 80) + 0.1;
        this.speedX = Math.random() * speed - speed / 2;
        this.speedY = Math.random() * speed - speed / 2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.1) this.size -= this.change;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleParticle() {
    for (let i = 0; i < spots.length; i++) {
        spots[i].update();
        spots[i].draw();
        for (let j = i + 1; j < Math.min(spots.length, i + 8); j++) {
            const dx = spots[i].x - spots[j].x;
            const dy = spots[i].y - spots[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 800) {
                ctx.beginPath();
                ctx.strokeStyle = spots[i].color;
                ctx.lineWidth = spots[i].size / 9;
                ctx.moveTo(spots[i].x, spots[i].y);
                ctx.lineTo(spots[j].x, spots[j].y);
                ctx.stroke();
            }
        }
        if (spots[i].size <= 0.4) {
            spots.splice(i, 1);
            i--;
        }
    }
}

function handleBg() {
    for (let i = 0; i < bgspots.length; i++) {
        bgspots[i].update();
        bgspots[i].draw();
        for (let j = i + 1; j < Math.min(bgspots.length, i + 8); j++) {
            const dx = bgspots[i].x - bgspots[j].x;
            const dy = bgspots[i].y - bgspots[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 800) {
                ctx.beginPath();
                ctx.strokeStyle = bgspots[i].color;
                ctx.lineWidth = bgspots[i].size / 9;
                ctx.moveTo(bgspots[i].x, bgspots[i].y);
                ctx.lineTo(bgspots[j].x, bgspots[j].y);
                ctx.stroke();
            }
        }
        if (bgspots[i].size <= 0.4) {
            bgspots.splice(i, 1);
            i--;
        }
    }
}
function handle(particles) {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < Math.min(particles.length, i + 14); j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 300) {
                ctx.beginPath();
                ctx.strokeStyle = particles[i].color;
                ctx.lineWidth = particles[i].size / 9;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
        if (particles[i].size <= 0.4) {
            particles.splice(i, 1);
            i--;
        }
    }
    
    let i = particles.length - 1;

    particles[i].update();
    particles[i].draw();
    for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 300) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = particles[i].size / 5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
        }
    }
    if (particles[i].size <= 0.5) {
        particles.splice(i, 1);
        i--;
    }
}

let counter = 10;
let incr = 0.05;
function animate() {
    counter += incr;
    if (incr < 20) {
        incr *= 1.02;
        incr += 0.0005;
    }
    if (counter >= 30) {
        incr *= 1.01;
    }
    if (counter >= 75) {
        incr *= 1.03;
        incr += 0.001;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < dots.length; i++) {
        for (let j = 0; j < Math.random() - 0.98; j++) {
            let part = new Particle();
            part.updateSpeed(0.2);
            part.updateRand(30);
            var rect = dots[i].getBoundingClientRect();
            const centerY = (rect.top + rect.bottom) / 2;
            const centerX = (rect.left + rect.right) / 2;
            part.worldSpawn(centerX, centerY);
            part.updateDuration(0.01);
            connectspots.push(part);
        }
    }
    handleParticle();
    handleBg();
    let part = new Particle();
    part.updateSpeed(0);
    part.updateRand(0);
    part.updateSize(3);
    connectspots.push(part);
    handle(connectspots);
    connectspots.splice(-1);

    for (let i = 0; i < Math.min(counter / 15, paths.length); i++) {
        let currPath = paths[i];
        for (let x = 0; x < 3; x++) {
        for (let j = 1; j < Math.min(currPath.length, (counter - i * 15) / 20 * currPath.length); j++) {
            let lastRect = currPath[j - 1];
            let thisRect = currPath[j];
            let MODIFIER = 5;
            const centerY1 = (lastRect.top + lastRect.bottom) / 2;
            const centerX1 = (lastRect.left + lastRect.right) / 2;
            const centerY2 = (thisRect.top + thisRect.bottom) / 2;
            const centerX2 = (thisRect.left + thisRect.right) / 2;
            ctx.beginPath();
            ctx.strokeStyle = "#90ccd4"; // COLOR HERE
            ctx.lineWidth = 6;
            ctx.moveTo(centerX1 + Math.random() * MODIFIER - MODIFIER / 2, centerY1 + Math.random() * MODIFIER - MODIFIER / 2);
            ctx.lineTo(centerX2 + Math.random() * MODIFIER - MODIFIER / 2, centerY2 + Math.random() * MODIFIER - MODIFIER / 2);
            ctx.stroke();
        }
        }

        for (let j = 1; j < Math.min(currPath.length, (counter - i * 15) / 20 * currPath.length); j++) {
            let lastRect = currPath[j - 1];
            let thisRect = currPath[j];
            let MODIFIER = 20;
            const centerY1 = (lastRect.top + lastRect.bottom) / 2;
            const centerX1 = (lastRect.left + lastRect.right) / 2;
            const centerY2 = (thisRect.top + thisRect.bottom) / 2;
            const centerX2 = (thisRect.left + thisRect.right) / 2;
            ctx.beginPath();
            ctx.strokeStyle = "#90ccd4"; // COLOR HERE
            ctx.lineWidth = 2;
            ctx.moveTo(centerX1 + Math.random() * MODIFIER - MODIFIER / 2, centerY1 + Math.random() * MODIFIER - MODIFIER / 2);
            ctx.lineTo(centerX2 + Math.random() * MODIFIER - MODIFIER / 2, centerY2 + Math.random() * MODIFIER - MODIFIER / 2);
            ctx.stroke();
        }

        for (let j = 1; j < Math.min(currPath.length, (counter - i * 15) / 20 * currPath.length); j++) {
            let lastRect = currPath[j - 1];
            let thisRect = currPath[j];
            let MODIFIER = 20;
            const centerY1 = (lastRect.top + lastRect.bottom) / 2;
            const centerX1 = (lastRect.left + lastRect.right) / 2;
            const centerY2 = (thisRect.top + thisRect.bottom) / 2;
            const centerX2 = (thisRect.left + thisRect.right) / 2;
            ctx.beginPath();
            ctx.strokeStyle = "#90ccd4"; // COLOR HERE
            ctx.lineWidth = 1;
            ctx.moveTo(centerX1 + Math.random() * MODIFIER - MODIFIER / 2, centerY1 + Math.random() * MODIFIER - MODIFIER / 2);
            ctx.lineTo(centerX2 + Math.random() * MODIFIER - MODIFIER / 2, centerY2 + Math.random() * MODIFIER - MODIFIER / 2);
            ctx.stroke();
        }
    }

    
    if (hue == 200) {
        up = false;
    }
    if (up) { 
        hue++;
    } else {
        hue--;
        if (hue == 130) {
            up = true;
        }
    }
    
    // im trying to make it go from greenish to blueish
    window.requestAnimationFrame(animate);
}

window.addEventListener('resize', function () {
    canvas.width = innerWidth;
    canvas.height = 10 * innerHeight;

    let C1PATH = [
        document.getElementById('dotC1-2').getBoundingClientRect(),
        document.getElementById('dotC1-1').getBoundingClientRect(),
        document.getElementById('dotC1-4').getBoundingClientRect()];
    let OPATH = [
        document.getElementById('dotO1-1').getBoundingClientRect(), 
        document.getElementById('dotO1-2').getBoundingClientRect(), 
        document.getElementById('dotO1-4').getBoundingClientRect(), 
        document.getElementById('dotO1-3').getBoundingClientRect(), 
        document.getElementById('dotO1-1').getBoundingClientRect()];
    let N1PATH = [
        document.getElementById('dotN1-3').getBoundingClientRect(), 
        document.getElementById('dotN1-1').getBoundingClientRect(), 
        document.getElementById('dotN1-4').getBoundingClientRect(), 
        document.getElementById('dotN1-2').getBoundingClientRect()];
    let N2PATH = [
        document.getElementById('dotN2-3').getBoundingClientRect(), 
        document.getElementById('dotN2-1').getBoundingClientRect(), 
        document.getElementById('dotN2-4').getBoundingClientRect(), 
        document.getElementById('dotN2-2').getBoundingClientRect()];
    let EPATH = [
        document.getElementById('dotE1-2').getBoundingClientRect(), 
        document.getElementById('dotE1-1').getBoundingClientRect(), 
        document.getElementById('dotE1-3').getBoundingClientRect(), 
        document.getElementById('dotE1-4').getBoundingClientRect()];
    let C2PATH = [
        document.getElementById('dotC2-2').getBoundingClientRect(), 
        document.getElementById('dotC2-1').getBoundingClientRect(), 
        document.getElementById('dotC2-4').getBoundingClientRect()];
    let TPATH = [
        document.getElementById('dotT1-2').getBoundingClientRect(), 
        document.getElementById('dotT1-1').getBoundingClientRect(), 
        document.getElementById('dotT1-4').getBoundingClientRect()];
    paths = [C1PATH, OPATH, N1PATH, N2PATH, EPATH, C2PATH, TPATH]
})

window.addEventListener('mouseout', function () {
    mouse.x = undefined;
    mouse.y = undefined;
})

setTimeout(() => {
    let C1PATH = [
        document.getElementById('dotC1-2').getBoundingClientRect(),
        document.getElementById('dotC1-1').getBoundingClientRect(),
        document.getElementById('dotC1-4').getBoundingClientRect()];
    let OPATH = [
        document.getElementById('dotO1-1').getBoundingClientRect(), 
        document.getElementById('dotO1-2').getBoundingClientRect(), 
        document.getElementById('dotO1-4').getBoundingClientRect(), 
        document.getElementById('dotO1-3').getBoundingClientRect(), 
        document.getElementById('dotO1-1').getBoundingClientRect()];
    let N1PATH = [
        document.getElementById('dotN1-3').getBoundingClientRect(), 
        document.getElementById('dotN1-1').getBoundingClientRect(), 
        document.getElementById('dotN1-4').getBoundingClientRect(), 
        document.getElementById('dotN1-2').getBoundingClientRect()];
    let N2PATH = [
        document.getElementById('dotN2-3').getBoundingClientRect(), 
        document.getElementById('dotN2-1').getBoundingClientRect(), 
        document.getElementById('dotN2-4').getBoundingClientRect(), 
        document.getElementById('dotN2-2').getBoundingClientRect()];
    let EPATH = [
        document.getElementById('dotE1-2').getBoundingClientRect(), 
        document.getElementById('dotE1-1').getBoundingClientRect(), 
        document.getElementById('dotE1-3').getBoundingClientRect(), 
        document.getElementById('dotE1-4').getBoundingClientRect()];
    let C2PATH = [
        document.getElementById('dotC2-2').getBoundingClientRect(), 
        document.getElementById('dotC2-1').getBoundingClientRect(), 
        document.getElementById('dotC2-4').getBoundingClientRect()];
    let TPATH = [
        document.getElementById('dotT1-2').getBoundingClientRect(), 
        document.getElementById('dotT1-1').getBoundingClientRect(), 
        document.getElementById('dotT1-4').getBoundingClientRect()];
    paths = [C1PATH, OPATH, N1PATH, N2PATH, EPATH, C2PATH, TPATH]
    animate();
}, 2200);