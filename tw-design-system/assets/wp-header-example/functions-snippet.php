<?php
/**
 * Fragmento de functions.php relevante para este header — NO es el
 * functions.php completo del proyecto (ese tiene mucho más código propio
 * de cada sitio). Solo el registro del menú y el filtro de CTA por clase.
 */

add_action('after_setup_theme', function () {
	register_nav_menus([
		'menu-primary' => 'Menú principal (Header)',
		'menu-footer'  => 'Menú del footer',
	]);
});

/**
 * En el menú "menu-primary", el ítem marcado con la clase CSS "menu-cta"
 * (campo nativo "Clases CSS (opcional)" de Apariencia > Menús, activable
 * desde Opciones de pantalla) se renderiza como botón CTA (.btn-primary).
 * Así se puede elegir cualquier ítem desde el admin sin depender de su
 * posición en el menú ni de un plugin.
 */
add_filter('nav_menu_link_attributes', function ($atts, $item, $args) {
	if (($args->theme_location ?? '') !== 'menu-primary') {
		return $atts;
	}

	if (in_array('menu-cta', (array) $item->classes, true)) {
		$atts['class'] = trim(($atts['class'] ?? '') . ' btn-primary shrink-0');
	}

	return $atts;
}, 10, 3);
