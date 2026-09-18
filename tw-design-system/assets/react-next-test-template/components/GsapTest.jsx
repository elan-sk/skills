'use client'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'

export default function GsapTest() {
  const containerRef = useRef(null)
  const titleRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    // Registrar el plugin
    gsap.registerPlugin(ScrollTrigger)

    const canvas = canvasRef.current
    const canvasContext = canvas.getContext('2d')

    canvas.width = 1068
    canvas.height = 600

    const TOTAL_FRAMES = 65

    const createURL = (frame) => {
      const id = frame.toString().padStart(4, '0')
      return `https://www.apple.com/105/media/us/airpods-pro/2022/d2deeb8e-83eb-48ea-9721-f567cf0fffa8/anim/hero/medium/${id}.png`
    }

    const images = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      const img = new Image()
      img.src = createURL(i)
      return img
    })

    const airpods = { frame: 0 }

    function render() {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height)
      canvasContext.drawImage(images[airpods.frame], 0, 0)
    }

    images[0].onload = () => render()

    // Animación inicial del componente
    const timeline = gsap.timeline({
      ease: 'circ.inOut',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })

    timeline
      .fromTo(
        canvasRef.current,
        {
          scale: 0.9,
          autoAlpha: 0,
        },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.8,
        }
      )
      .fromTo(
        titleRef.current,
        {
          scale: 0.9,
          autoAlpha: 0,
        },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 1.5,
        },
        '<0.3'
      )

    // Animación del título al hacer scroll dentro del contenedor
    gsap.fromTo(
      titleRef.current,
      {
        scale: 1,
        autoAlpha: 1,
      },
      {
        scale: 1.5,
        autoAlpha: 0,
        ease: 'circ.inOut',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          pin: false,
        },
      }
    )

    // Animación de frames del canvas
    gsap.to(airpods, {
      frame: TOTAL_FRAMES - 1,
      ease: 'none',
      snap: 'frame',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        pin: false,
      },
      onUpdate: render,
    })

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-black">
      {/* Contenedor sticky que se queda fijo */}
      <div className="sticky top-0 w-full h-[100vh] flex items-center justify-center">
        <div className="relative w-full max-w-6xl px-4">
          <h2
            ref={titleRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-bold text-white text-center w-full m-0 z-10"
          >
            6.GSAP
          </h2>
          <canvas
            ref={canvasRef}
            id="hero"
            className="w-full h-auto max-w-full mx-auto aspect-[1068/600]"
          />
        </div>
      </div>
    </div>
  )
}
