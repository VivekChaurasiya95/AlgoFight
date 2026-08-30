import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './particle-animation.css';

class Particle {
    constructor(x, y, size, particles) {
        this.size = size;
        this.x = x;
        this.y = y;
        this.seed = Math.random() * 1000;
        this.freq = (0.5 + Math.random() * 1) * 0.01;
        this.amplitude = (1 - Math.random() * 2) * 0.5;
        this.color = '#ffffff'; // White mask particle

        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.el.setAttribute('cx', this.x.toString());
        this.el.setAttribute('cy', this.y.toString());
        this.el.setAttribute('r', this.size.toString());
        this.el.setAttribute('fill', this.color);

        const tl = gsap.timeline();
        tl.to(this, {
            size: this.size * 2.2,
            ease: 'power1.inOut',
            duration: 1.6
        });
        tl.to(this, {
            size: 0,
            ease: 'power4.in',
            duration: 2.8
        }, 1.8);
        tl.call(() => this.kill(particles));
    }

    kill(particles) {
        const index = particles.indexOf(this);
        if (index > -1) {
            particles.splice(index, 1);
        }
        this.el.remove();
    }

    render() {
        this.el.setAttribute('cy', this.y.toString());
        this.el.setAttribute('cx', this.x.toString());
        this.el.setAttribute('r', this.size.toString());
    }
}

export default function ParticleAnimation() {
    const svgRef = useRef(null);
    const wrapperRef = useRef(null);
    const cursorRef = useRef(null);
    const wordRef = useRef(null);

    const mouseRef = useRef({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
        smoothX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
        smoothY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
        diff: 0,
        vx: 0,
        vy: 0
    });

    const viewportRef = useRef({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080
    });

    const particlesRef = useRef([]);
    const animationIdRef = useRef();

    useEffect(() => {
        const mouse = mouseRef.current;
        const viewport = viewportRef.current;
        const particles = particlesRef.current;

        const onMouseMove = (e) => {
            if (mouse.vx !== undefined && mouse.vy !== undefined) {
                mouse.vx += mouse.x - e.clientX;
                mouse.vy += mouse.y - e.clientY;
            }
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const onResize = () => {
            viewport.width = window.innerWidth;
            viewport.height = window.innerHeight;

            if (svgRef.current) {
                svgRef.current.style.width = viewport.width + 'px';
                svgRef.current.style.height = viewport.height + 'px';
            }

            if (wordRef.current) {
                const maxScale = viewport.height / (wordRef.current.clientHeight * 0.75 || 200);
                wordRef.current.style.setProperty('--max-scale', maxScale.toString());
            }
        };

        const emitParticle = () => {
            let x = 0;
            let y = 0;
            let size = 0;

            if (mouse.diff > 0.01) {
                x = mouse.smoothX;
                y = mouse.smoothY;
                size = Math.min(mouse.diff * 0.36, 68);
            }

            const particle = new Particle(x, y, size, particles);
            particles.push(particle);

            if (wrapperRef.current) {
                wrapperRef.current.prepend(particle.el);
            }
        };

        const render = () => {
            mouse.smoothX += (mouse.x - mouse.smoothX) * 0.18;
            mouse.smoothY += (mouse.y - mouse.smoothY) * 0.18;
            mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

            emitParticle();

            if (cursorRef.current) {
                cursorRef.current.style.setProperty('--x', mouse.smoothX + 'px');
                cursorRef.current.style.setProperty('--y', mouse.smoothY + 'px');
            }

            particles.forEach((particle) => {
                particle.render();
            });

            animationIdRef.current = requestAnimationFrame(render);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', onResize);

        onResize();
        render();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, []);

    return (
        <div className="suz-stage-container">
            {/* Base Light Background */}
            <div className="suz-light-canvas">
                <div className="suz-bottom-title">Underneath It all</div>
            </div>

            {/* Masked Organic Black Liquid Blob Scene */}
            <div className="suz-masked-blob-layer">
                <div className="suz-black-liquid-fill">
                    <div className="suz-orange-tip" />
                </div>
                <div className="suz-revealed-text-scene" ref={wordRef}>
                    <div className="suz-line-1">We Are All</div>
                    <div className="suz-line-2">A Little Bit</div>
                    <div className="suz-word-mad">
                        <span className="mad-char-1">M</span>
                        <span className="mad-char-2">A</span>
                        <span className="mad-char-3">D</span>
                    </div>
                </div>
            </div>

            {/* Neon Green Cursor Follower Dot */}
            <div className="cursor js-cursor" ref={cursorRef}></div>

            {/* SVG Liquid Gooey Filter */}
            <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                width="100%"
                height="100%"
                className="s-svg js-svg"
            >
                <mask id="suzGooeyMask">
                    <g ref={wrapperRef} filter="url(#suzGooeyEffect)"></g>
                </mask>
                <filter id="suzGooeyEffect">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
                    <feColorMatrix
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -7"
                        result="goo"
                    />
                </filter>
            </svg>
        </div>
    );
}
