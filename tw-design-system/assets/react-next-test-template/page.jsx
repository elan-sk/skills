'use client'
import { useEffect } from 'react'
import ButtonSection from './components/Buttons/ButtonSection'
import ColorsSection from './components/Colors/ColorsSection'
import Reset from './components/Reset'
import SliderTest from './components/SliderTest'
import Typography from './components/Typography'
import GsapTest from './components/GsapTest'

export default function PageTest() {
  useEffect(() => {
    const copyElements = document.querySelectorAll('.test-copy')

    copyElements.forEach((copyEl) => {
      if (copyEl.querySelector('.copy-icon')) return

      const icon = document.createElement('b')
      icon.classList.add('copy-icon')
      icon.textContent = '📋'
      copyEl.appendChild(icon)

      const handler = async () => {
        let text = ''

        const hiddenEl = copyEl.querySelector('.test-copy-hidden')
        if (hiddenEl) {
          text = hiddenEl.textContent.trim()
        } else {
          text = copyEl.textContent.replace(icon.textContent, '').trim()
        }

        try {
          await navigator.clipboard.writeText(text)
          icon.textContent = '✅'
          icon.classList.add('copied')

          setTimeout(() => {
            icon.textContent = '📋'
            icon.classList.remove('copied')
          }, 1500)
        } catch (err) {
          console.error('Error al copiar:', err)
        }
      }

      copyEl.addEventListener('click', handler)

      // cleanup
      return () => {
        copyEl.removeEventListener('click', handler)
      }
    })
  }, [])

  return (
    <>
      <ColorsSection />
      <Typography />
      <Reset />
      <ButtonSection />
      <SliderTest />
      <GsapTest />
    </>
  )
}
