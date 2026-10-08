<?php
  function render_color_circle($title, $colors) {
    $html = '';
    $html .= <<<HTML
    <article>
      <header>
        <h3 class="text-h3 text-center">{$title} Colors</h3>
      </header>
      <div class="flex-grid sm:flex-grid-2 md:flex-grid-3 flex-center gap-y-6">
    HTML;
    foreach ($colors as $color) {
      $html .= <<<HTML
          <div class="text-center">
            <div class="js-color-circle size-30 rounded-full mx-auto bg-{$color} border-2 border-gray-600 flex-center text-large font-semibold">abc</div>
            <div class="pt-2">
              <strong class="capitalize test-copy">{$color}</strong>
            </div>
            <div>
                <p class="m-0">.<span class="test-copy">bg-{$color}</span></p>
                <p><span class="test-copy js-hex-value"></span></p>
            </div>
          </div>
          HTML;
        }
    $html .= <<<HTML
        </div>
    </article>
    HTML;
    return $html;
  }

  // Colores de TEXTO (black/white): bg- no tiene sentido para estos roles,
  // así que el círculo muestra el fondo AL REVÉS (el otro color de la
  // lista) y el color real va en el texto (text-{$color}), que es la clase
  // que de verdad se usa en el sitio.
  function render_text_color_circle($title, $colors) {
    $html = '';
    $html .= <<<HTML
    <article>
      <header>
        <h3 class="text-h3 text-center">{$title} Colors</h3>
      </header>
      <div class="flex-grid sm:flex-grid-2 md:flex-grid-3 flex-center gap-y-6">
    HTML;
    foreach ($colors as $i => $color) {
      $bgColor = $colors[($i + 1) % count($colors)];
      $html .= <<<HTML
          <div class="text-center">
            <div class="js-text-color-circle size-30 rounded-full mx-auto bg-{$bgColor} text-{$color} border-2 border-gray-600 flex-center text-large font-semibold">abc</div>
            <div class="pt-2">
              <strong class="capitalize test-copy">{$color}</strong>
            </div>
            <div>
                <p class="m-0">.<span class="test-copy">text-{$color}</span></p>
                <p><span class="test-copy js-hex-value"></span></p>
            </div>
          </div>
          HTML;
        }
    $html .= <<<HTML
        </div>
    </article>
    HTML;
    return $html;
  }
?>

<section class="">
  <div class="container-md">
    <header class="text-center">
      <h2 class="text-h2">1. Colors</h2>
    </header>
    <div class="flex-container-12">
      <?php echo render_color_circle('Primaries', ['primary-dk','primary','primary-lt']) ?>
      <?php echo render_color_circle('Secondaries', ['secondary-dk','secondary','secondary-lt']) ?>
      <?php echo render_color_circle('Tertiaries', ['tertiary-dk','tertiary','tertiary-lt']) ?>
      <?php echo render_color_circle('Backgrounds', ['background','surface','outline']) ?>
      <?php echo render_color_circle('Messages', ['success','info','error']) ?>
      <?php echo render_text_color_circle('Text', ['black','white']) ?>
    </div>
  </div>
</section>
