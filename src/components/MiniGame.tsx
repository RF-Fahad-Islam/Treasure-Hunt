import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchMiniGameLeaderboard, submitScore, type MiniGameScore } from "@/services/minigame";

// --- Game Constants ---
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const CANVAS_W = 800;
const CANVAS_H = 400;
const GROUND_Y = 320;
const INITIAL_SPEED = 6;
const MAX_SPEED = 15;

type Rect = { x: number; y: number; w: number; h: number, type?: string, passed?: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };

export function MiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStateUi, setGameStateUi] = useState<"start" | "playing" | "gameover">("start");
  const [scoreUi, setScoreUi] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem("minigame_highscore") || 0);
  });
  const [leaderboard, setLeaderboard] = useState<MiniGameScore[]>([]);
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // --- Sound Effects (Web Audio API) ---
  const audioCtx = useRef<AudioContext | null>(null);
  
  const playSound = useCallback((type: "jump" | "collect" | "die" | "bloop") => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case "jump":
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case "collect":
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case "bloop":
        osc.type = "sine";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case "die":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }, []);
  
  const keys = useRef<{ [key: string]: boolean }>({});
  const requestRef = useRef<number>(0);

  const gameState = useRef({
    state: "start" as "start" | "playing" | "gameover",
    player: { x: 80, y: GROUND_Y - 40, vy: 0, w: 40, h: 40, isGrounded: true, isDucking: false },
    speed: INITIAL_SPEED,
    score: 0,
    obstacles: [] as Rect[],
    particles: [] as Particle[],
    clouds: [] as { x: number; y: number; speed: number; scale: number }[],
    groundOffset: 0,
    time: 0,
    shake: 0
  });

  const resetGame = useCallback(() => {
    gameState.current = {
      ...gameState.current,
      state: "playing",
      player: { x: 80, y: GROUND_Y - 40, vy: 0, w: 40, h: 40, isGrounded: true, isDucking: false },
      speed: INITIAL_SPEED,
      score: 0,
      obstacles: [],
      particles: [],
      time: 0,
      shake: 0
    };
    // Initialize some clouds
    gameState.current.clouds = Array.from({ length: 5 }).map(() => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * (CANVAS_H / 2),
      speed: Math.random() * 0.5 + 0.2,
      scale: Math.random() * 0.5 + 0.5
    }));
    setGameStateUi("playing");
    setScoreUi(0);
    setNickname("");
    setIsSubmitting(false);
    setHasSubmitted(false);
  }, []);

  useEffect(() => {
    fetchMiniGameLeaderboard().then(setLeaderboard);
  }, []);

  const spawnObstacle = () => {
    const s = gameState.current;
    if (s.obstacles.length > 0) {
      const last = s.obstacles[s.obstacles.length - 1];
      if (CANVAS_W - last.x < 300 + Math.random() * 300) return; // Minimum gap
    }
    
    if (Math.random() < 0.03) {
      const isTreasure = Math.random() < 0.15;
      if (isTreasure) {
        s.obstacles.push({ x: CANVAS_W, y: GROUND_Y - 40, w: 40, h: 40, type: "treasure" });
      } else {
        const typeRoll = Math.random();
        if (typeRoll > 0.8 && s.score > 200) {
          // High bird or low bird
          const h = Math.random() > 0.5 ? 40 : 80;
          s.obstacles.push({ x: CANVAS_W, y: GROUND_Y - h, w: 40, h: 30, type: "bird" });
        } else if (typeRoll > 0.6) {
          // Water trap
          s.obstacles.push({ x: CANVAS_W, y: GROUND_Y - 30, w: 60, h: 30, type: "water" });
        } else {
          // Cactus: small or big, single or double
          const size = Math.random() > 0.5 ? 1 : 2;
          const width = size === 1 ? 30 : 50;
          const height = size === 1 ? 50 : 65;
          s.obstacles.push({ x: CANVAS_W, y: GROUND_Y - height, w: width, h: height, type: "cactus" });
        }
      }
    }
  };

  const spawnDust = (x: number, y: number) => {
    if (Math.random() > 0.3) return;
    gameState.current.particles.push({
      x, y,
      vx: -gameState.current.speed * 0.8 + (Math.random() - 0.5),
      vy: -Math.random() * 2,
      life: 20 + Math.random() * 20,
      maxLife: 40,
      color: "rgba(200, 200, 200, 0.8)",
      size: Math.random() * 4 + 2
    });
  };

  const spawnExplosion = (x: number, y: number) => {
    for (let i = 0; i < 20; i++) {
      gameState.current.particles.push({
        x: x + 20, y: y + 20,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 30 + Math.random() * 30,
        maxLife: 60,
        color: Math.random() > 0.5 ? "#FF5555" : "#FFAA00",
        size: Math.random() * 6 + 2
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    let lastTime = performance.now();

    const update = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.66, 2); 
      lastTime = time;

      const s = gameState.current;
      
      if (s.state === "playing") {
        s.time += dt;
        s.score += 0.1 * dt * (s.speed / INITIAL_SPEED);
        if (Math.floor(s.score) > scoreUi) {
          setScoreUi(Math.floor(s.score));
        }
        
        // Increase speed gradually
        if (s.speed < MAX_SPEED) {
          s.speed += 0.001 * dt;
        }

        const p = s.player;

        // Controls
        p.isDucking = (keys.current["ArrowDown"] || keys.current["s"]) && p.isGrounded;
        
        if ((keys.current["ArrowUp"] || keys.current["w"] || keys.current[" "] || keys.current["Jump"]) && p.isGrounded && !p.isDucking) {
          p.vy = JUMP_FORCE;
          p.isGrounded = false;
          playSound("jump");
          // Jump dust
          for(let i=0; i<5; i++) spawnDust(p.x + p.w/2, p.y + p.h);
        }

        // Fast fall
        if ((keys.current["ArrowDown"] || keys.current["s"]) && !p.isGrounded) {
          p.vy += GRAVITY * 2 * dt;
        }

        // Physics
        p.vy += GRAVITY * dt;
        p.y += p.vy * dt;

        // Ground collision
        if (p.y >= GROUND_Y - (p.isDucking ? 20 : 40)) {
          p.y = GROUND_Y - (p.isDucking ? 20 : 40);
          p.vy = 0;
          if (!p.isGrounded) {
            p.isGrounded = true;
            // Landing dust
            for(let i=0; i<5; i++) spawnDust(p.x + p.w/2, p.y + (p.isDucking ? 20 : 40));
          }
        }
        
        p.h = p.isDucking ? 20 : 40;

        // Running dust
        if (p.isGrounded) {
          spawnDust(p.x + 10, p.y + p.h);
        }

        // Environment scrolling
        s.groundOffset = (s.groundOffset + s.speed * dt) % 40;
        
        for (const cloud of s.clouds) {
          cloud.x -= cloud.speed * dt;
          if (cloud.x < -100) {
            cloud.x = CANVAS_W + 50;
            cloud.y = Math.random() * (CANVAS_H / 2);
          }
        }

        // Obstacles
        spawnObstacle();
        
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed * dt;
          
          // Bird flapping
          if (obs.type === "bird") {
            obs.y += Math.sin(s.time * 0.1) * 1.5;
          }

          // Collision detection
          // Make hitboxes slightly forgiving (smaller than visual)
          const hitP = { x: p.x + 10, y: p.y + 10, w: p.w - 20, h: p.h - 15 };
          const hitO = { x: obs.x + 10, y: obs.y + 10, w: obs.w - 20, h: obs.h - 15 };
          
          if (hitP.x < hitO.x + hitO.w && hitP.x + hitP.w > hitO.x &&
              hitP.y < hitO.y + hitO.h && hitP.y + hitP.h > hitO.y) {
            
            if (obs.type === "treasure") {
              // Collect treasure
              s.score += 100;
              s.obstacles.splice(i, 1);
              playSound("collect");
              // Spawn some sparkling particles
              spawnExplosion(obs.x, obs.y);
              continue; // Don't die
            } else if (obs.type === "water" && p.isDucking) {
              // Survive the water trap!
              if (Math.random() > 0.8) {
                // Occasional splash effect
                spawnDust(obs.x + obs.w/2, obs.y + obs.h); 
                playSound("bloop");
              }
              continue;
            } else {
              // Hit enemy!
              s.state = "gameover";
              setGameStateUi("gameover");
              playSound("die");
              const finalScore = Math.floor(s.score);
              if (finalScore > highScore) {
                setHighScore(finalScore);
                localStorage.setItem("minigame_highscore", finalScore.toString());
              }
              s.shake = 15;
              spawnExplosion(p.x, p.y);
            }
          }

          if (obs.x + obs.w < 0) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // Shake damping
      if (s.shake > 0) {
        s.shake *= 0.9;
        if (s.shake < 0.5) s.shake = 0;
      }

      // --- Draw ---
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      
      const isNight = s.score > 0 && Math.floor(s.score / 500) % 2 === 1;
      
      // Sky
      ctx.fillStyle = isNight ? "#111" : "#F7F7F7";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.save();
      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      }

      // Clouds
      ctx.fillStyle = isNight ? "#333" : "#E0E0E0";
      for (const cloud of s.clouds) {
        ctx.font = `${40 * cloud.scale}px Arial`;
        ctx.fillText("☁️", cloud.x, cloud.y);
      }

      // Ground
      ctx.strokeStyle = isNight ? "#555" : "#888";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_W, GROUND_Y);
      ctx.stroke();
      
      // Ground details (scrolling dashes)
      ctx.beginPath();
      for (let i = 0; i < CANVAS_W + 40; i += 40) {
        ctx.moveTo(i - s.groundOffset, GROUND_Y + 10);
        ctx.lineTo(i - s.groundOffset + 10, GROUND_Y + 10);
        if (i % 80 === 0) {
          ctx.moveTo(i - s.groundOffset + 20, GROUND_Y + 20);
          ctx.lineTo(i - s.groundOffset + 25, GROUND_Y + 20);
        }
      }
      ctx.stroke();

      // Particles
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Obstacles
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      for (const obs of s.obstacles) {
        if (obs.type === "treasure") {
          const hoverY = Math.sin(s.time * 0.2) * 5;
          ctx.fillText("📦", obs.x + obs.w/2, obs.y + obs.h + hoverY);
        } else if (obs.type === "water") {
          ctx.fillText("🌊", obs.x + obs.w/2, obs.y + obs.h + 10);
        } else if (obs.type === "cactus") {
          ctx.fillText(obs.w > 40 ? "🌵🌵" : "🌵", obs.x + obs.w/2, obs.y + obs.h + 5);
        } else if (obs.type === "bird") {
          const wingUp = Math.floor(s.time / 10) % 2 === 0;
          ctx.fillText(wingUp ? "🦅" : "🦇", obs.x + obs.w/2, obs.y + obs.h);
        }
      }

      // Player
      const p = s.player;
      if (s.state !== "gameover" || Math.floor(s.time) % 2 === 0) { // Blink if dead
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h);
        
        if (p.isDucking) {
          ctx.font = "40px Arial";
          ctx.fillText("🦆", 0, 0); // Duck emoji when ducking!
        } else {
          // Bobbing animation when running
          if (p.isGrounded && s.state === "playing") {
            const bob = Math.sin(s.time * 0.4) * 2;
            ctx.translate(0, bob);
            ctx.rotate(Math.sin(s.time * 0.4) * 0.1);
          }
          ctx.font = "45px Arial";
          ctx.save();
          ctx.scale(-1, 1); // Flip horizontally because T-Rex faces left
          ctx.fillText("🦖", 0, 5); // T-Rex
          ctx.restore();
        }
        ctx.restore();
      }

      ctx.restore(); // Restore shake

      // Score UI (drawn on canvas for crispness, or could use React)
      ctx.fillStyle = isNight ? "#FFF" : "#555";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`HI ${highScore.toString().padStart(5, '0')}  ${Math.floor(s.score).toString().padStart(5, '0')}`, CANVAS_W - 20, 30);

      if (s.state === "start") {
        ctx.fillStyle = isNight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = isNight ? "#FFF" : "#333";
        ctx.textAlign = "center";
        ctx.font = "bold 24px Arial";
        ctx.fillText("Press UP or SPACE to Start", CANVAS_W / 2, CANVAS_H / 2);
      } else if (s.state === "gameover") {
        ctx.fillStyle = isNight ? "#FFF" : "#333";
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";
        ctx.fillText("G A M E   O V E R", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = "18px Arial";
        ctx.fillText("Press SPACE to Restart", CANVAS_W / 2, CANVAS_H / 2 + 20);
      }

      requestRef.current = requestAnimationFrame(update);
    };

    // Initial draw & start loop
    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [highScore, scoreUi]); // Add scoreUi to deps if needed, but ref is better

  // Keyboard Handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { 
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault(); // Prevent scrolling
      }
      keys.current[e.key] = true; 
      
      if ((e.key === " " || e.key === "ArrowUp") && gameState.current.state !== "playing") {
        resetGame();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [resetGame]);

  const handlePointerDown = (k: string) => { 
    keys.current[k] = true; 
    if (k === "Jump" && gameState.current.state !== "playing") {
      resetGame();
    }
  };
  const handlePointerUp = (k: string) => { keys.current[k] = false; };

  const handleRegisterClick = () => {
    window.dispatchEvent(new CustomEvent("open-lookup", { detail: "register" }));
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitScore(nickname, scoreUi);
      const updated = await fetchMiniGameLeaderboard();
      setLeaderboard(updated);
      setNickname("");
      setIsSubmitting(false);
      setHasSubmitted(true);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-10 sm:py-20 px-4 sm:px-8 overflow-hidden select-none bg-[#FAFAFA] dark:bg-[#111]">
      <div className="max-w-4xl mx-auto text-center mb-6 sm:mb-10">
        <h2 className="font-display text-3xl md:text-5xl font-black text-[#2B2B2B] dark:text-white tracking-tight mb-2 sm:mb-4">
          Need a <span className="text-[var(--color-brand-green)]">Break?</span>
        </h2>
        <p className="text-[#777] dark:text-white/60 font-semibold max-w-xl mx-auto text-sm sm:text-base">
          Take a moment to relax. Use <kbd className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded">SPACE</kbd> to jump, and <kbd className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded">DOWN</kbd> to survive 🌊!
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
        <div className="lg:col-span-3 relative">
          {/* Game Container */}
          <div 
            className="relative bg-white dark:bg-[#1A1A1A] rounded-[24px] sm:rounded-[32px] p-1.5 sm:p-4 border-2 sm:border-4 border-[var(--border-soft)] shadow-xl"
          >
            <div className="relative w-full aspect-[2/1] sm:aspect-[3/1] bg-[#F7F7F7] dark:bg-[#111] rounded-xl sm:rounded-2xl overflow-hidden shadow-inner transition-colors duration-1000">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-full h-full object-contain touch-none bg-[#F7F7F7] dark:bg-[#111]"
                style={{ imageRendering: "pixelated" }}
              />

              {/* Game Over UI */}
              <AnimatePresence>
                {gameStateUi === "gameover" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  >
                    {!hasSubmitted ? (
                      <form onSubmit={handleSubmitScore} className="bg-white dark:bg-[#2A2A2A] p-5 sm:p-6 rounded-2xl shadow-xl w-full max-w-[280px] sm:max-w-xs text-center">
                        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 dark:text-white">Save your Score!</h3>
                        <p className="text-xl sm:text-2xl font-black text-[var(--color-brand-green)] mb-3 sm:mb-4">{scoreUi}</p>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Nickname"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-[#F0F0F0] dark:bg-[#111] dark:text-white mb-3 sm:mb-4 text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]"
                          maxLength={15}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={resetGame}
                            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-white/10 dark:text-white rounded-xl font-bold text-sm"
                          >
                            Skip
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-3 py-2 bg-[var(--color-brand-green)] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                          >
                            {isSubmitting ? "..." : "Save"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={resetGame}
                          className="btn-press ripple btn-primary px-6 sm:px-8 py-2.5 sm:py-3 shadow-[0_6px_0_#43A047] sm:shadow-[0_8px_0_#43A047] mb-4 text-sm sm:text-base"
                        >
                          Restart Game
                        </button>
                        <br />
                        <button
                          onClick={handleRegisterClick}
                          className="text-white/80 underline font-semibold text-sm"
                        >
                          Register Team Now!
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Mobile Controls */}
          <div className="mt-4 sm:hidden flex justify-around items-center px-4 touch-none pb-4" onContextMenu={e => e.preventDefault()}>
            <motion.button 
              whileTap={{ y: 4, scale: 0.95 }}
              onPointerDown={(e) => { e.preventDefault(); handlePointerDown("ArrowDown"); }}
              onPointerUp={(e) => { e.preventDefault(); handlePointerUp("ArrowDown"); }}
              onPointerCancel={(e) => { e.preventDefault(); handlePointerUp("ArrowDown"); }}
              className="group relative w-24 h-24 bg-white dark:bg-[#2A2A2A] border-b-[6px] border-[#E5E5E5] dark:border-[#111] rounded-[2rem] flex flex-col items-center justify-center shadow-lg transition-all"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="dark:text-white text-[#555]"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
              <span className="text-[11px] font-black dark:text-white/40 text-black/40 uppercase mt-1">Duck</span>
            </motion.button>
            <motion.button 
              whileTap={{ y: 4, scale: 0.95 }}
              onPointerDown={(e) => { e.preventDefault(); handlePointerDown("Jump"); }}
              onPointerUp={(e) => { e.preventDefault(); handlePointerUp("Jump"); }}
              onPointerCancel={(e) => { e.preventDefault(); handlePointerUp("Jump"); }}
              className="w-28 h-28 bg-[var(--color-brand-green)] border-b-[8px] border-[#3A8400] rounded-full flex flex-col items-center justify-center shadow-xl text-white font-black transition-all"
            >
              <span className="text-2xl tracking-tighter leading-none">JUMP</span>
              <span className="text-[10px] opacity-70 uppercase mt-1">or Start</span>
            </motion.button>
          </div>
        </div>

        {/* Leaderboard Panel */}
        <div className="lg:col-span-1 mt-4 lg:mt-0">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 border-2 sm:border-4 border-[var(--border-soft)] shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-display text-lg sm:text-xl font-black dark:text-white">Leaderboard</h3>
              <span className="text-[10px] font-bold text-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 px-2 py-0.5 rounded">GLOBAL</span>
            </div>
            
            <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto pr-1 max-h-[300px] lg:max-h-none">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 bg-[#F7F7F7] dark:bg-[#111] rounded-xl sm:rounded-2xl border border-transparent hover:border-[var(--color-brand-green)] transition-all text-sm sm:text-base">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${
                        idx === 0 ? "bg-yellow-400 text-white" : 
                        idx === 1 ? "bg-gray-300 text-white" : 
                        idx === 2 ? "bg-orange-400 text-white" : 
                        "text-gray-400"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold dark:text-white truncate max-w-[80px] sm:max-w-[100px]">{entry.nickname}</span>
                    </div>
                    <span className="font-mono font-black text-[var(--color-brand-green)]">{Math.floor(entry.score)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 italic text-sm">No scores yet...</div>
              )}
            </div>

            <button 
              onClick={handleRegisterClick}
              className="mt-4 sm:mt-6 w-full py-2.5 sm:py-3 bg-black dark:bg-white dark:text-black text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider"
            >
              Join the Hunt
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
