<?php
// Buttons
$colors = [
  "", "surface", "outline",
  "primary-dk", "primary", "primary-lt",
  "secondary-dk", "secondary", "secondary-lt",
  "tertiary-dk", "tertiary", "tertiary-lt",
  "success", "info", "error",
];

$buttons = [
  "primary",
  "secondary",
  "tertiary",
  "link", // caso especial: <a> suelto sin clase .btn-*, ver render_cards_buttons()
];

// Render the buttons: Tailwind utility classes are compiled only if they are used, so this element uses all classes to ensure TW compiles them ?>
<div class="btn-primary btn-secondary btn-tertiary hidden"></div><?php

function render_cards_buttons($items) {
  $html = '';
  foreach ($items as $item) {
    $is_link = $item === "link";
    $class = $is_link ? "" : "btn-{$item}";
    $label = $is_link ? "Link (a)" : "Button {$item}";
    $html .= <<<HTML
      <article class="flex-container">
        <h4 class="text-large mb-4 text-center">{$label}</h4>
        <div class="text-center">
          <a href="#" class="{$class}">
            <span> Ver contenido </span>
          </a>
      HTML;
          if ($item !== "" && !$is_link) {
            $html .= <<<HTML
                <p class="test-copy mt-3">.btn-{$item} <span class="test-copy-hidden">btn-{$item}<span></p>
      HTML;
          }
    $html .= <<<HTML
        </div>
      </article>
    HTML;
  }
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
          <div class="flex-grid sm:flex-grid-2 md:flex-grid-3 gap-y-12">
    HTML;   $html .= render_cards_buttons($son);
            $html .= <<<HTML
          </div>
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
