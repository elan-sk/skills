<header class="cx-header fixed top-0 z-50 w-full bg-background">
  <div class="cx-header__inner container-full flex h-px-72 items-center gap-6">
    <?php if (has_custom_logo()) : ?>
      <div class="cx-header__logo shrink-0">
        <?php the_custom_logo(); ?>
      </div>
    <?php else : ?>
      <a class="cx-header__logo shrink-0" href="<?php echo esc_url(home_url('/')); ?>">
        <span class="font-serif text-h4 text-secondary-dk"><?php echo esc_html(get_bloginfo('name')); ?></span>
      </a>
    <?php endif; ?>

    <!-- Logo shrink-0 + esta sección flex-1: garantiza logo pegado a la
         izquierda y acciones pegadas a la derecha sin importar el ancho
         del nav (ver referencias/philosophy.md, truco flex-1 + ml-auto). -->
    <div class="cx-header__menu-section flex flex-1 items-center justify-end">
      <nav class="cx-header__nav hidden lg:block" aria-label="Menú principal">
        <?php wp_nav_menu([
          'theme_location' => 'menu-primary',
          'container'      => false,
          'items_wrap'     => '<ul class="cx-header__menu flex items-center gap-9">%3$s</ul>',
          'link_before'    => '<span>',
          'link_after'     => '</span>',
          'fallback_cb'    => false,
          'depth'          => 1,
        ]); ?>
      </nav>

      <div class="cx-header__actions ml-[5%] flex items-center gap-3">
        <button type="button" class="icon-circle mb-0 hidden lg:block" data-search-trigger aria-label="Buscar en el sitio" title="Buscar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <button type="button" class="cx-header__toggler mb-0 flex-center size-px-44 rounded-full text-secondary-dk transition-colors duration-150 lg:hidden hover:bg-surface" data-menu-trigger aria-controls="mobile-menu" aria-expanded="false" aria-label="Abrir menú">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

  </div>
</header>
