<?php
$colors = [
  "", "surface", "outline",
  "primary-dk", "primary", "primary-lt",
  "secondary-dk", "secondary", "secondary-lt",
  "tertiary-dk", "tertiary", "tertiary-lt",
  "success", "info", "error",
];

// Cada fila: [nombre real de la clase, ¿tiene variante --alt?]
$buttons = [
  ["primary", true],
  ["secondary", true],
  ["tertiary", true],
];

// Render the buttons: Tailwind utility classes are compiled only if they are used, so this element uses all classes to ensure TW compiles them ?>
<div class="btn-primary btn-secondary btn-tertiary btn-primary--alt btn-secondary--alt btn-tertiary--alt a--alt hidden"></div><?php

function render_plain_link_card($alt = false) {
  $classes = $alt ? 'a--alt' : '';
  $label = $alt ? 'a--alt' : 'a (plano)';
  $html = <<<HTML
    <article class="flex-container">
      <h4 class="text-large mb-4 text-center">Link {$label}</h4>
      <div class="text-center">
        <a href="#" class="{$classes}">
          <span>Ver contenido</span>
        </a>
        <p class="test-copy mt-3">.{$classes} <span class="test-copy-hidden">{$classes}</span></p>
      </div>
    </article>
  HTML;
  return $html;
}

function render_button_card($item, $modifier = '') {
  $classes = "btn-{$item}" . ($modifier !== '' ? " btn-{$item}{$modifier}" : '');
  $label = $item . $modifier;
  $html = <<<HTML
    <article class="flex-container">
      <h4 class="text-large mb-4 text-center">Button {$label}</h4>
      <div class="text-center">
        <a href="#" class="{$classes}">
          <span>Ver contenido</span>
        </a>
    HTML;
  if ($item !== "") {
    $html .= <<<HTML
        <p class="test-copy mt-3">.{$classes} <span class="test-copy-hidden">{$classes}</span></p>
    HTML;
  }
  $html .= <<<HTML
      </div>
    </article>
  HTML;
  return $html;
}

// Cada TIPO va en su propia fila de 2 columnas fijas (normal + --alt lado a
// lado), y las filas se apilan una debajo de otra — así no se mezclan tipos
// distintos en una misma fila, como pasaba con el grid de 3 columnas.
function render_button_row($item, $has_alt) {
  $html = '<div class="flex-grid flex-grid-2 gap-y-8 pb-8 mb-8 border-b-2 border-dashed border-gray-600">';
  $html .= render_button_card($item);
  $html .= $has_alt ? render_button_card($item, '--alt') : '';
  $html .= '</div>';
  return $html;
}

// Recorre TODOS los fondos y, para cada botón con variante --alt, muestra
// normal y --alt una al lado de la otra — la página de prueba no decide
// cuál usar, eso lo decide el código real de cada componente en producción.
function render_cards_buttons($items) {
  $html = '';
  foreach ($items as [$item, $has_alt]) {
    $html .= render_button_row($item, $has_alt);
  }
  $html .= '<div class="flex-grid flex-grid-2 gap-y-8">';
  $html .= render_plain_link_card(false);
  $html .= render_plain_link_card(true);
  $html .= '</div>';
  return $html;
}

function render_sections_colors($items, $son) {
  $html = '';
  foreach ($items as $item) {
    $html .= <<<HTML
      <section class="bg-{$item} border-2 border-dashed border-gray-600 px-4">
          <header>
            <h3 class="text-h3">Background {$item}</h3>
          </header>
    HTML;   $html .= render_cards_buttons($son);
            $html .= <<<HTML
      </section>
    HTML;
  }
  return $html;
}
?>

<section class="">
  <header>
    <h2 class="text-h2">4. Buttons</h2>
  </header>
  <div class="container">
    <?php echo render_sections_colors($colors, $buttons); ?>
  </div>
</section>
