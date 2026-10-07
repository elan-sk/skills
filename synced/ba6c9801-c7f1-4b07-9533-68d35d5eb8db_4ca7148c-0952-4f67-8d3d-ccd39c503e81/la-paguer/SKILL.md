---
name: la-paguer
description: Identidad y formato de documentos de La Paguer (agencia «Marketing que transforma», Quibdó; aliada de Depura Creatividad). Usar siempre que el usuario diga "La Paguer", "lapaguer", "la paguer", o pida un documento, acta, propuesta, informe o correo "con el membrete/estilo de La Paguer" — tomar logo, colores, tipografía, lemas, datos de contacto y la plantilla .docx de la carpeta assets/ de esta skill, sin volver a preguntarlos ni re-extraerlos del PDF.
---

# La Paguer — identidad y formato de documentos

Todo sale de `assets/` (ruta relativa a esta skill). No volver a extraerlo de las fuentes originales salvo que el usuario diga que la marca cambió.

## Assets

| Archivo | Uso |
|---|---|
| `assets/logo-lapaguer.png` | Logo oficial (rosado, con «Marketing que Transforma»), fondo transparente, 1711×1150 (proporción 1,49). Va en el encabezado de todo documento. |
| `assets/plantilla-docx-acta.js` | Generador docx-js probado (carta, encabezado con logo + «MARKETING QUE TRANSFORMA», pie con contacto, número de página y lema). Copiarlo y cambiar solo el arreglo `body`. Necesita `npm install docx` en la carpeta donde se corra. |
| `assets/ejemplo-acta-entrega.docx` | Resultado de referencia (acta de entrega de Cafexport y Local Partners, octubre de 2026). |
| `assets/referencia-estilo-presentacion.png` | Miniaturas de la presentación de marca «Al que le gusta, le sabe», para piezas más gráficas. |

Fuentes originales: `~/Documentos/DEPURA/LA PAGUER/` (PDF «Al que le gusta, le sabe», `La Pagüer.pptx`, `the-paguer.zip` = código del sitio Next.js).

## Marca

- **Colores**: rosado `#FF6EE4` (logo, acentos), rosado oscuro `#C2189B` (texto de acento sobre blanco, por contraste), amarillo `#FBE105` (acentos, texto sobre fondo oscuro), tinta `#1E1E1C` (texto y fondos oscuros), gris `#5B5750` (texto secundario), crema `#FFF7D1` (fondo de recuadros destacados). La presentación también usa rojo `#F80241` y naranja `#FA5E1B` en degradés.
- **Tipografía**: Poppins (regular para texto, ExtraBold para títulos). Los titulares de la presentación usan una display condensada tipo cartel (no disponible como fuente: en documentos, usar Poppins en mayúsculas en negrita).
- **Lemas**: «Marketing que transforma» (principal, va con el logo) · «Una idea poderosa» · «Al que le gusta, le sabe» · «La primera agencia de marketing digital en Quibdó» · «Somos una agencia de marketing que hace lo que todos hacen, pero desde el territorio» · «En Quibdó ya empezamos la transformación».
- **Propósito**: comunicación estratégica para marcas que entienden la sostenibilidad como su razón de ser; trabajo desde el territorio (Quibdó, Manizales, Bogotá).
- **Contacto**: lapaguer.com · Quibdó, Chocó · david@depura-creatividad.com · Instagram @lapaguer_. Aliados: Depura Creatividad, Centro de Innovación del Pacífico.

## Formato de documentos (lo que se aprobó en el acta)

- Tamaño carta, márgenes de 1″; encabezado: logo a la izquierda, «MARKETING QUE TRANSFORMA» a la derecha, línea rosada debajo.
- Pie: contacto + «Página N», línea amarilla arriba; debajo «Al que le gusta, le sabe.» en cursiva rosado oscuro.
- Títulos de sección en mayúsculas negrita con barra rosada a la izquierda; subtítulos en rosado oscuro. Encabezados de tabla con fondo tinta y texto amarillo. Recuadros destacados con fondo crema y barra amarilla.
- Títulos con `keepNext` para que no queden huérfanos al final de una página. Renderizar a PDF con `soffice` y revisar las páginas antes de entregar.
- Sin firmas salvo que se pidan.

## Tono

Textos para clientes en **usted**, cálidos y en lenguaje accesible (no técnico): explicar qué gana el cliente, no cómo está hecho. Nunca voseo ni tuteo en lo que lee el cliente, aunque el sitio de La Paguer use «tú» en su copy.
