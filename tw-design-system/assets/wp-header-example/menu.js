// Ocultar el header al scrollear hacia abajo, mostrarlo al scrollear hacia
// arriba. El header ya es `fixed` (ver tailwindcss/components/_header.css),
// así que solo se traslada fuera de vista con .cx-header--hidden en vez de
// togglear su position como en una versión anterior de este componente.
class HeaderScroll {
  constructor (el) {
    this.el = el
    this.threshold = el.clientHeight
    this.lastScrollY = window.scrollY
  }

  init () {
    window.addEventListener('scroll', () => this.handleScroll())
  }

  handleScroll () {
    const currentScrollY = window.scrollY

    if (currentScrollY > this.threshold) {
      if (currentScrollY >= this.lastScrollY) {
        this.el.classList.add('cx-header--hidden')
      } else {
        this.el.classList.remove('cx-header--hidden')
      }
    } else {
      this.el.classList.remove('cx-header--hidden')
    }

    this.lastScrollY = currentScrollY
  }
}

const headerEl = document.querySelector('.cx-header')
if (headerEl) {
  new HeaderScroll(headerEl).init()
}

const trigger = document.querySelector('[data-menu-trigger]')
const overlay = document.getElementById('mobile-menu')
const closeBtn = overlay ? overlay.querySelector('[data-menu-close]') : null

function openMobileMenu () {
  overlay.classList.add('is-open')
  overlay.setAttribute('aria-hidden', 'false')
  trigger.setAttribute('aria-expanded', 'true')
  document.documentElement.classList.add('overflow-hidden')
}

function closeMobileMenu () {
  overlay.classList.remove('is-open')
  overlay.setAttribute('aria-hidden', 'true')
  trigger.setAttribute('aria-expanded', 'false')
  document.documentElement.classList.remove('overflow-hidden')
}

if (trigger && overlay) {
  trigger.addEventListener('click', openMobileMenu)

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMobileMenu)
  }

  overlay.querySelectorAll('.mobile-menu__list a').forEach(function (link) {
    link.addEventListener('click', closeMobileMenu)
  })

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeMobileMenu()
    }
  })
}

// Configurar target="_blank" para links externos
document.addEventListener('DOMContentLoaded', function() {
  const currentHostname = location.hostname;

  document.querySelectorAll('a').forEach(function(link) {
    const linkHostname = link.hostname;

    if (linkHostname && currentHostname !== linkHostname) {
      link.setAttribute('target', '_blank');
      // Agregar rel="noopener noreferrer" por seguridad
      link.setAttribute('rel', 'noopener noreferrer');
    } else {
      link.removeAttribute('target');
    }
  });
});
