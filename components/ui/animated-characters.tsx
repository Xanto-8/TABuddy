"use client";

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface AnimatedCharactersProps {
  isTyping?: boolean;
  showPassword?: boolean;
  passwordLength?: number;
  isPasswordGuardMode?: boolean;
}

export function AnimatedCharacters({
  isTyping = false,
  showPassword = false,
  passwordLength = 0,
  isPasswordGuardMode = false,
}: AnimatedCharactersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const purpleFaceRef = useRef<HTMLDivElement>(null);
  const blackFaceRef = useRef<HTMLDivElement>(null);
  const orangeFaceRef = useRef<HTMLDivElement>(null);
  const yellowFaceRef = useRef<HTMLDivElement>(null);
  const yellowMouthRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);
  const quickTo = useRef<Record<string, gsap.QuickToFunc> | null>(null);

  const purpleBlinkTimer = useRef<ReturnType<typeof setTimeout>>();
  const blackBlinkTimer = useRef<ReturnType<typeof setTimeout>>();
  const purplePeekTimer = useRef<ReturnType<typeof setTimeout>>();
  const lookingTimer = useRef<ReturnType<typeof setTimeout>>();

  const isLookingRef = useRef(false);

  const stateRef = useRef({
    isTyping,
    isHidingPassword: passwordLength > 0 && !showPassword,
    isShowingPassword: passwordLength > 0 && showPassword,
    isLooking: false,
    isPasswordGuardMode,
  });

  useEffect(() => {
    stateRef.current = {
      isTyping,
      isHidingPassword: passwordLength > 0 && !showPassword,
      isShowingPassword: passwordLength > 0 && showPassword,
      isLooking: isLookingRef.current,
      isPasswordGuardMode,
    };
  }, [isTyping, showPassword, passwordLength, isPasswordGuardMode]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    gsap.set('.pupil', { x: 0, y: 0 });
    gsap.set('.eyeball-pupil', { x: 0, y: 0 });

    if (
      !purpleRef.current || !blackRef.current || !orangeRef.current || !yellowRef.current ||
      !purpleFaceRef.current || !blackFaceRef.current || !orangeFaceRef.current || !yellowFaceRef.current ||
      !yellowMouthRef.current
    ) return;

    const pRef = purpleRef.current;
    const bRef = blackRef.current;
    const oRef = orangeRef.current;
    const yRef = yellowRef.current;
    const pfRef = purpleFaceRef.current;
    const bfRef = blackFaceRef.current;
    const ofRef = orangeFaceRef.current;
    const yfRef = yellowFaceRef.current;
    const ymRef = yellowMouthRef.current;

    quickTo.current = {
      purpleSkew: gsap.quickTo(pRef, 'skewX', { duration: 0.3, ease: 'power2.out' }),
      blackSkew: gsap.quickTo(bRef, 'skewX', { duration: 0.3, ease: 'power2.out' }),
      orangeSkew: gsap.quickTo(oRef, 'skewX', { duration: 0.3, ease: 'power2.out' }),
      yellowSkew: gsap.quickTo(yRef, 'skewX', { duration: 0.3, ease: 'power2.out' }),
      purpleX: gsap.quickTo(pRef, 'x', { duration: 0.3, ease: 'power2.out' }),
      blackX: gsap.quickTo(bRef, 'x', { duration: 0.3, ease: 'power2.out' }),
      purpleHeight: gsap.quickTo(pRef, 'height', { duration: 0.3, ease: 'power2.out' }),
      purpleFaceLeft: gsap.quickTo(pfRef, 'left', { duration: 0.3, ease: 'power2.out' }),
      purpleFaceTop: gsap.quickTo(pfRef, 'top', { duration: 0.3, ease: 'power2.out' }),
      blackFaceLeft: gsap.quickTo(bfRef, 'left', { duration: 0.3, ease: 'power2.out' }),
      blackFaceTop: gsap.quickTo(bfRef, 'top', { duration: 0.3, ease: 'power2.out' }),
      orangeFaceX: gsap.quickTo(ofRef, 'x', { duration: 0.2, ease: 'power2.out' }),
      orangeFaceY: gsap.quickTo(ofRef, 'y', { duration: 0.2, ease: 'power2.out' }),
      yellowFaceX: gsap.quickTo(yfRef, 'x', { duration: 0.2, ease: 'power2.out' }),
      yellowFaceY: gsap.quickTo(yfRef, 'y', { duration: 0.2, ease: 'power2.out' }),
      mouthX: gsap.quickTo(ymRef, 'x', { duration: 0.2, ease: 'power2.out' }),
      mouthY: gsap.quickTo(ymRef, 'y', { duration: 0.2, ease: 'power2.out' }),
    };
    const qt = quickTo.current;

    const calcPos = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 3;
      const dx = mouseRef.current.x - cx;
      const dy = mouseRef.current.y - cy;
      return {
        faceX: Math.max(-15, Math.min(15, dx / 20)),
        faceY: Math.max(-10, Math.min(10, dy / 30)),
        bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
      };
    };

    const calcEyePos = (el: HTMLElement, maxDist: number) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = mouseRef.current.x - cx;
      const dy = mouseRef.current.y - cy;
      const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDist);
      const angle = Math.atan2(dy, dx);
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
    };

    const applyLookAtEachOther = () => {
      if (qt) {
        qt.purpleFaceLeft(55);
        qt.purpleFaceTop(65);
        qt.blackFaceLeft(32);
        qt.blackFaceTop(12);
      }
      pRef.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: 3, y: 4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      bRef.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: 0, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
    };

    const applyHidingPassword = () => {
      if (qt) {
        qt.purpleFaceLeft(55);
        qt.purpleFaceTop(65);
      }
    };

    const applyShowPassword = () => {
      if (qt) {
        qt.purpleSkew(0);
        qt.blackSkew(0);
        qt.orangeSkew(0);
        qt.yellowSkew(0);
        qt.purpleX(0);
        qt.blackX(0);
        qt.purpleHeight(400);
        qt.purpleFaceLeft(20);
        qt.purpleFaceTop(35);
        qt.blackFaceLeft(10);
        qt.blackFaceTop(28);
        qt.orangeFaceX(50 - 82);
        qt.orangeFaceY(85 - 90);
        qt.yellowFaceX(20 - 52);
        qt.yellowFaceY(35 - 40);
        qt.mouthX(10 - 40);
        qt.mouthY(0);
      }
      pRef.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      bRef.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      oRef.querySelectorAll('.pupil').forEach((p) => {
        gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      yRef.querySelectorAll('.pupil').forEach((p) => {
        gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
    };

    const applyPasswordGuardMode = () => {
      if (qt) {
        qt.purpleSkew(0);
        qt.blackSkew(0);
        qt.orangeSkew(0);
        qt.yellowSkew(0);
        qt.purpleX(0);
        qt.blackX(0);
        qt.purpleHeight(400);
        qt.purpleFaceLeft(24);
        qt.purpleFaceTop(22);
        qt.blackFaceLeft(14);
        qt.blackFaceTop(20);
        qt.orangeFaceX(22 - 82);
        qt.orangeFaceY(72 - 90);
        qt.yellowFaceX(12 - 52);
        qt.yellowFaceY(22 - 40);
        qt.mouthX(-14);
        qt.mouthY(-8);
      }
      pRef.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: -5, y: -5, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      });
      bRef.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: -4, y: -4, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      });
      oRef.querySelectorAll('.pupil').forEach((p) => {
        gsap.to(p, { x: -5, y: -5, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      });
      yRef.querySelectorAll('.pupil').forEach((p) => {
        gsap.to(p, { x: -5, y: -5, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      });
    };

    const tick = () => {
      const container = containerRef.current;
      const qtLocal = quickTo.current;
      if (!container || !qtLocal) return;

      const s = stateRef.current;

      if (s.isPasswordGuardMode) {
        applyPasswordGuardMode();
        rafId.current = requestAnimationFrame(tick);
        return;
      }

      if (pRef && !s.isShowingPassword) {
        const pp = calcPos(pRef);
        if (s.isTyping || s.isHidingPassword) {
          qtLocal.purpleSkew(pp.bodySkew - 12);
          qtLocal.purpleX(40);
          qtLocal.purpleHeight(440);
        } else {
          qtLocal.purpleSkew(pp.bodySkew);
          qtLocal.purpleX(0);
          qtLocal.purpleHeight(400);
        }
      }

      if (bRef && !s.isShowingPassword) {
        const bp = calcPos(bRef);
        if (s.isLooking) {
          qtLocal.blackSkew(bp.bodySkew * 1.5 + 10);
          qtLocal.blackX(20);
        } else if (s.isTyping || s.isHidingPassword) {
          qtLocal.blackSkew(bp.bodySkew * 1.5);
          qtLocal.blackX(0);
        } else {
          qtLocal.blackSkew(bp.bodySkew);
          qtLocal.blackX(0);
        }
      }

      if (oRef && !s.isShowingPassword) {
        const op = calcPos(oRef);
        qtLocal.orangeSkew(op.bodySkew);
        qtLocal.orangeFaceX(op.faceX);
        qtLocal.orangeFaceY(op.faceY);
      }

      if (yRef && !s.isShowingPassword) {
        const yp = calcPos(yRef);
        qtLocal.yellowSkew(yp.bodySkew);
        qtLocal.yellowFaceX(yp.faceX);
        qtLocal.yellowFaceY(yp.faceY);
        qtLocal.mouthX(yp.faceX);
        qtLocal.mouthY(yp.faceY);
      }

      if (pRef && !s.isShowingPassword && !s.isLooking) {
        const pp = calcPos(pRef);
        const purpleFaceX = pp.faceX >= 0 ? Math.min(25, pp.faceX * 1.5) : pp.faceX;
        qtLocal.purpleFaceLeft(45 + purpleFaceX);
        qtLocal.purpleFaceTop(40 + pp.faceY);
      }

      if (bRef && !s.isShowingPassword && !s.isLooking) {
        const bp = calcPos(bRef);
        qtLocal.blackFaceLeft(26 + bp.faceX);
        qtLocal.blackFaceTop(32 + bp.faceY);
      }

      if (!s.isShowingPassword) {
        container.querySelectorAll('.pupil').forEach((p) => {
          const el = p as HTMLElement;
          const maxDist = Number(el.dataset.maxDistance) || 5;
          const ePos = calcEyePos(el, maxDist);
          gsap.set(el, { x: ePos.x, y: ePos.y });
        });

        if (!s.isLooking) {
          container.querySelectorAll('.eyeball').forEach((eb) => {
            const el = eb as HTMLElement;
            const maxDist = Number(el.dataset.maxDistance) || 10;
            const pupil = el.querySelector('.eyeball-pupil') as HTMLElement | null;
            if (!pupil) return;
            const ePos = calcEyePos(el, maxDist);
            gsap.set(pupil, { x: ePos.x, y: ePos.y });
          });
        }
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    const purpleEyeballs = pRef.querySelectorAll('.eyeball');
    const blackEyeballs = bRef.querySelectorAll('.eyeball');

    const schedulePurpleBlink = () => {
      purpleBlinkTimer.current = setTimeout(() => {
        purpleEyeballs.forEach((el) => {
          gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' });
        });
        setTimeout(() => {
          purpleEyeballs.forEach((el) => {
            const size = Number((el as HTMLElement).style.width.replace('px', '')) || 18;
            gsap.to(el, { height: size, duration: 0.08, ease: 'power2.out' });
          });
          schedulePurpleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
    };

    const scheduleBlackBlink = () => {
      blackBlinkTimer.current = setTimeout(() => {
        blackEyeballs.forEach((el) => {
          gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' });
        });
        setTimeout(() => {
          blackEyeballs.forEach((el) => {
            const size = Number((el as HTMLElement).style.width.replace('px', '')) || 16;
            gsap.to(el, { height: size, duration: 0.08, ease: 'power2.out' });
          });
          scheduleBlackBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
    };

    schedulePurpleBlink();
    scheduleBlackBlink();

    return () => {
      cancelAnimationFrame(rafId.current);
      clearTimeout(purpleBlinkTimer.current);
      clearTimeout(blackBlinkTimer.current);
      clearTimeout(purplePeekTimer.current);
      clearTimeout(lookingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isPasswordGuardMode) {
      clearTimeout(lookingTimer.current);
      isLookingRef.current = false;
      stateRef.current.isLooking = false;
      return;
    }

    if (isTyping && !showPassword) {
      isLookingRef.current = true;
      stateRef.current.isLooking = true;

      const container = containerRef.current;
      if (container) {
        const pRefEl = container.querySelector('[data-char="purple"]') as HTMLElement;
        const bRefEl = container.querySelector('[data-char="black"]') as HTMLElement;
        const pfRefEl = container.querySelector('[data-face="purple"]') as HTMLElement;
        const bfRefEl = container.querySelector('[data-face="black"]') as HTMLElement;

        const qtLocal = quickTo.current;
        if (qtLocal && pfRefEl && bfRefEl) {
          qtLocal.purpleFaceLeft(55);
          qtLocal.purpleFaceTop(65);
          qtLocal.blackFaceLeft(32);
          qtLocal.blackFaceTop(12);
        }
        pRefEl?.querySelectorAll('.eyeball-pupil').forEach((p) => {
          gsap.to(p, { x: 3, y: 4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        });
        bRefEl?.querySelectorAll('.eyeball-pupil').forEach((p) => {
          gsap.to(p, { x: 0, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        });
      }

      clearTimeout(lookingTimer.current);
      lookingTimer.current = setTimeout(() => {
        isLookingRef.current = false;
        stateRef.current.isLooking = false;
        const container = containerRef.current;
        container?.querySelectorAll('.eyeball-pupil').forEach((p) => {
          gsap.killTweensOf(p);
        });
      }, 800);
    } else {
      clearTimeout(lookingTimer.current);
      isLookingRef.current = false;
      stateRef.current.isLooking = false;
    }
  }, [isTyping, showPassword, isPasswordGuardMode]);

  useEffect(() => {
    if (isPasswordGuardMode) {
      clearTimeout(purplePeekTimer.current);
      return;
    }

    if (!showPassword || passwordLength <= 0) {
      clearTimeout(purplePeekTimer.current);
      return;
    }

    const container = containerRef.current;
    const purpleEyePupils = container?.querySelectorAll('.eyeball-pupil');
    if (!purpleEyePupils?.length) return;

    const schedulePeek = () => {
      purplePeekTimer.current = setTimeout(() => {
        purpleEyePupils.forEach((p) => {
          gsap.to(p, { x: 4, y: 5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        });
        const qtLocal = quickTo.current;
        if (qtLocal) {
          qtLocal.purpleFaceLeft(20);
          qtLocal.purpleFaceTop(35);
        }

        setTimeout(() => {
          purpleEyePupils.forEach((p) => {
            gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
          });
          schedulePeek();
        }, 800);
      }, Math.random() * 3000 + 2000);
    };

    schedulePeek();

    return () => {
      clearTimeout(purplePeekTimer.current);
    };
  }, [showPassword, passwordLength, isPasswordGuardMode]);

  useEffect(() => {
    if (isPasswordGuardMode) {
      return;
    }

    const isHidingPassword = passwordLength > 0 && !showPassword;
    const isShowingPassword = passwordLength > 0 && showPassword;

    if (isShowingPassword) {
      const container = containerRef.current;
      const pRefEl = container?.querySelector('[data-char="purple"]') as HTMLElement;
      const bRefEl = container?.querySelector('[data-char="black"]') as HTMLElement;
      const oRefEl = container?.querySelector('[data-char="orange"]') as HTMLElement;
      const yRefEl = container?.querySelector('[data-char="yellow"]') as HTMLElement;
      const pfRefEl = container?.querySelector('[data-face="purple"]') as HTMLElement;
      const bfRefEl = container?.querySelector('[data-face="black"]') as HTMLElement;
      const ofRefEl = container?.querySelector('[data-face="orange"]') as HTMLElement;
      const yfRefEl = container?.querySelector('[data-face="yellow"]') as HTMLElement;
      const ymRefEl = container?.querySelector('[data-face="mouth"]') as HTMLElement;

      const qtLocal = quickTo.current;
      if (qtLocal && pfRefEl && bfRefEl && ofRefEl && yfRefEl && ymRefEl) {
        qtLocal.purpleSkew(0);
        qtLocal.blackSkew(0);
        qtLocal.orangeSkew(0);
        qtLocal.yellowSkew(0);
        qtLocal.purpleX(0);
        qtLocal.blackX(0);
        qtLocal.purpleHeight(400);
        qtLocal.purpleFaceLeft(20);
        qtLocal.purpleFaceTop(35);
        qtLocal.blackFaceLeft(10);
        qtLocal.blackFaceTop(28);
        qtLocal.orangeFaceX(50 - 82);
        qtLocal.orangeFaceY(85 - 90);
        qtLocal.yellowFaceX(20 - 52);
        qtLocal.yellowFaceY(35 - 40);
        qtLocal.mouthX(10 - 40);
        qtLocal.mouthY(0);
      }
      pRefEl?.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      bRefEl?.querySelectorAll('.eyeball-pupil').forEach((p) => {
        gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      oRefEl?.querySelectorAll('.pupil').forEach((p) => {
        gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      yRefEl?.querySelectorAll('.pupil').forEach((p) => {
        gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
    } else if (isHidingPassword) {
      const qtLocal = quickTo.current;
      if (qtLocal) {
        qtLocal.purpleFaceLeft(55);
        qtLocal.purpleFaceTop(65);
      }
    }
  }, [isPasswordGuardMode, showPassword, passwordLength]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '550px', height: '400px' }}>
      {/* Purple Character */}
      <div
        ref={purpleRef}
        data-char="purple"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '70px',
          width: '180px',
          height: '400px',
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transformOrigin: 'bottom center',
          willChange: 'transform',
        }}
      >
        <div
          ref={purpleFaceRef}
          data-face="purple"
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '32px',
            left: '45px',
            top: '40px',
          }}
        >
          <div className="eyeball" data-max-distance="5" style={{ borderRadius: '50%', width: '18px', height: '18px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', willChange: 'height' }}>
            <div className="eyeball-pupil" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
          </div>
          <div className="eyeball" data-max-distance="5" style={{ borderRadius: '50%', width: '18px', height: '18px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', willChange: 'height' }}>
            <div className="eyeball-pupil" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
          </div>
        </div>
      </div>

      {/* Black Character */}
      <div
        ref={blackRef}
        data-char="black"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '240px',
          width: '120px',
          height: '310px',
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transformOrigin: 'bottom center',
          willChange: 'transform',
        }}
      >
        <div
          ref={blackFaceRef}
          data-face="black"
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '24px',
            left: '26px',
            top: '32px',
          }}
        >
          <div className="eyeball" data-max-distance="4" style={{ borderRadius: '50%', width: '16px', height: '16px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', willChange: 'height' }}>
            <div className="eyeball-pupil" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
          </div>
          <div className="eyeball" data-max-distance="4" style={{ borderRadius: '50%', width: '16px', height: '16px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', willChange: 'height' }}>
            <div className="eyeball-pupil" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
          </div>
        </div>
      </div>

      {/* Orange Character */}
      <div
        ref={orangeRef}
        data-char="orange"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '240px',
          height: '200px',
          backgroundColor: '#FF9B6B',
          borderRadius: '120px 120px 0 0',
          zIndex: 3,
          transformOrigin: 'bottom center',
          willChange: 'transform',
        }}
      >
        <div
          ref={orangeFaceRef}
          data-face="orange"
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '32px',
            left: '82px',
            top: '90px',
          }}
        >
          <div className="pupil" data-max-distance="5" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
          <div className="pupil" data-max-distance="5" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
        </div>
      </div>

      {/* Yellow Character */}
      <div
        ref={yellowRef}
        data-char="yellow"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '310px',
          width: '140px',
          height: '230px',
          backgroundColor: '#E8D754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transformOrigin: 'bottom center',
          willChange: 'transform',
        }}
      >
        <div
          ref={yellowFaceRef}
          data-face="yellow"
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '24px',
            left: '52px',
            top: '40px',
          }}
        >
          <div className="pupil" data-max-distance="5" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
          <div className="pupil" data-max-distance="5" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2D2D2D', willChange: 'transform' }} />
        </div>
        <div
          ref={yellowMouthRef}
          data-face="mouth"
          style={{
            position: 'absolute',
            width: '80px',
            height: '4px',
            backgroundColor: '#2D2D2D',
            borderRadius: '9999px',
            left: '40px',
            top: '88px',
          }}
        />
      </div>
    </div>
  );
}
