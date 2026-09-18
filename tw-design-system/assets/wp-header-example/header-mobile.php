<div id="mobile-menu" class="mobile-menu fixed inset-0 z-[60] flex flex-col bg-background" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Menú de navegación">

  <div class="mobile-menu__top container flex h-px-72 items-center justify-between">
    <?php if (has_custom_logo()) : ?>
      <div class="mobile-menu__logo shrink-0">
        <?php the_custom_logo(); ?>
      </div>
    <?php else : ?>
      <a class="mobile-menu__logo shrink-0" href="<?php echo esc_url(home_url('/')); ?>">
        <span class="font-serif text-h4 text-secondary-dk"><?php echo esc_html(get_bloginfo('name')); ?></span>
      </a>
    <?php endif; ?>

    <button type="button" class="mobile-menu__close mb-0 flex-center size-px-44 rounded-full text-secondary-dk transition-colors duration-150 hover:bg-surface" data-menu-close aria-label="Cerrar menú">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <nav class="mobile-menu__nav container flex-1 overflow-y-auto py-9" aria-label="Menú principal (mobile)">
    <?php wp_nav_menu([
      'theme_location' => 'menu-primary',
      'container'      => false,
      'items_wrap'     => '<ul class="mobile-menu__list flex flex-col gap-6">%3$s</ul>',
      'link_before'    => '<span>',
      'link_after'     => '</span>',
      'fallback_cb'    => false,
      'depth'          => 1,
    ]); ?>
  </nav>

  <div class="mobile-menu__footer container flex justify-center pb-9">
    <button type="button" class="flex items-center gap-2 text-button !mb-0 font-semibold text-secondary-dk" data-search-trigger>
      <svg class="size-px-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Buscar</span>
    </button>
  </div>

</div>
