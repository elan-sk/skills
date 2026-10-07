const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, TabStopType, PageNumber, ExternalHyperlink,
} = require('docx');

// Marca La Paguer
const C = { pink: 'FF6EE4', pinkDark: 'C2189B', yellow: 'FBE105', ink: '1E1E1C', muted: '5B5750', soft: 'FFF7D1' };
const FONT = 'Poppins';
const LOGO = process.env.LOGO || require('path').join(__dirname, 'logo-lapaguer.png');
const OUT = process.env.OUT || 'acta.docx';

const W = 9360; // ancho útil carta con márgenes de 1"
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none };
const thin = { style: BorderStyle.SINGLE, size: 4, color: 'E4E1DA' };
const thinBorders = { top: thin, bottom: thin, left: thin, right: thin };

const r = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const p = (children, o = {}) => new Paragraph({ spacing: { after: 120, line: 300 }, ...o, children: typeof children === 'string' ? [r(children)] : children });
const h1 = (text) => new Paragraph({
  keepNext: true,
  spacing: { before: 320, after: 140 },
  border: { left: { style: BorderStyle.SINGLE, size: 36, color: C.pink, space: 8 } },
  children: [r(text.toUpperCase(), { bold: true, size: 26, color: C.ink })],
});
const h2 = (text) => new Paragraph({ keepNext: true, spacing: { before: 200, after: 80 }, children: [r(text, { bold: true, size: 22, color: C.pinkDark })] });
const bullet = (children) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60, line: 290 }, children: typeof children === 'string' ? [r(children)] : children });
const link = (url, label) => new ExternalHyperlink({ link: url, children: [r(label || url, { color: C.pinkDark, underline: {} })] });

function table(cols, rows, { head = true, boldFirst = true } = {}) {
  const cell = (content, i, isHead) => new TableCell({
    width: { size: cols[i], type: WidthType.DXA },
    borders: thinBorders,
    shading: isHead ? { type: ShadingType.CLEAR, color: 'auto', fill: C.ink } : undefined,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [new Paragraph({ spacing: { line: 276 }, children: Array.isArray(content) ? content
      : [r(content, isHead ? { bold: true, color: C.yellow, size: 19 } : { size: 19, bold: boldFirst && i === 0, color: C.ink })] })],
  });
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: cols,
    rows: rows.map((row, ri) => new TableRow({ tableHeader: head && ri === 0, children: row.map((c, i) => cell(c, i, head && ri === 0)) })),
  });
}

function callout(children) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 36, color: C.yellow } },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.soft },
      margins: { top: 140, bottom: 140, left: 200, right: 200 },
      children,
    })] })],
  });
}

const logo = fs.readFileSync(LOGO);
const header = new Header({ children: [
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: W }],
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.pink, space: 6 } },
    children: [
      new ImageRun({ type: 'png', data: logo, transformation: { width: 96, height: 64 } }),
      r('\t'), r('MARKETING QUE TRANSFORMA', { bold: true, size: 16, color: C.ink, characterSpacing: 40 }),
    ],
  }),
] });
const footer = new Footer({ children: [
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: W }],
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.yellow, space: 6 } },
    children: [
      r('lapaguer.com  ·  Quibdó, Chocó  ·  david@depura-creatividad.com', { size: 15, color: C.muted }),
      r('\t'), r('Página ', { size: 15, color: C.muted }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 15, color: C.muted }),
    ],
  }),
  new Paragraph({ children: [r('Al que le gusta, le sabe.', { italics: true, size: 15, color: C.pinkDark })] }),
] });

const CAFE = 'https://silver-porpoise-137112.hostingersite.com';
const LOCAL = 'https://lavender-gull-353405.hostingersite.com/';

const body = [
  p([r('ACTA DE ENTREGA', { bold: true, size: 44, color: C.ink })], { spacing: { before: 120, after: 40 } }),
  p([r('Sitios web Cafexport y Local Partners', { bold: true, size: 28, color: C.pinkDark })], { spacing: { after: 200 } }),
  table([2600, 6760], [
    ['Fecha', '6 de octubre de 2026'],
    ['Cliente', 'Cafexport y Local Partners'],
    ['Entrega', 'La Paguer — Marketing que transforma'],
    ['Objeto', 'Entrega de los dos sitios web desarrollados, con sus contenidos, ajustes solicitados y herramientas de administración.'],
  ], { head: false }),

  h1('1. Qué se entrega'),
  p('Se entregan dos sitios web completos, uno para cada marca, con una línea gráfica común y contenidos propios. Ambos sitios se encuentran publicados en un ambiente de prueba, donde pueden revisarse antes de su paso al servidor definitivo:'),
  bullet([r('Cafexport: ', { bold: true }), link(CAFE)]),
  bullet([r('Local Partners: ', { bold: true }), link(LOCAL)]),

  h1('2. Características principales'),
  p('Los dos sitios comparten las siguientes características:'),
  bullet([r('Fácil de administrar: ', { bold: true }), r('están construidos sobre WordPress, la plataforma de sitios web más usada en el mundo. El contenido se edita desde un panel, sin necesidad de programar.')]),
  bullet([r('Páginas armadas por bloques: ', { bold: true }), r('cada página se compone de secciones (banners, cifras, galerías, mosaicos, videos) que pueden editarse, reordenarse o reutilizarse en otras páginas.')]),
  bullet([r('Español e inglés: ', { bold: true }), r('cuentan con selector de idioma y el contenido traducido al inglés.')]),
  bullet([r('Se ven bien en cualquier pantalla: ', { bold: true }), r('el diseño se adapta a celulares, tabletas y computadores.')]),
  bullet([r('Videos que cargan rápido: ', { bold: true }), r('los videos (por ejemplo, el Manifiesto y las entrevistas) se muestran desde YouTube, lo que mantiene el sitio liviano.')]),
  bullet([r('Imágenes optimizadas: ', { bold: true }), r('las imágenes se comprimen de forma automática para que las páginas carguen más rápido.')]),
  bullet([r('Contacto directo: ', { bold: true }), r('formulario de contacto que envía los mensajes al correo, y botón flotante de contacto.')]),
  bullet([r('Historias: ', { bold: true }), r('sección de historias que se alimenta desde el panel, sin necesidad de diseñar cada publicación.')]),
  bullet([r('Compartir en redes: ', { bold: true }), r('botones para compartir los contenidos en redes sociales.')]),
  bullet([r('Informes descargables: ', { bold: true }), r('los informes de gestión y documentos quedan disponibles para consulta y descarga.')]),

  h1('3. Secciones de cada sitio'),
  h2('Cafexport'),
  table([2600, 6760], [
    ['Página', 'Qué encuentra el visitante'],
    ['Inicio', 'Banner principal con imágenes, cifras de impacto, cómo trabajamos, video del Manifiesto, mosaico de origen, proceso y llamado a la acción.'],
    ['Así trabajamos', 'El recorrido del café «del origen al destino», mapa de presencia en Colombia y aliados.'],
    ['Impacto', 'El ecosistema que transforma la caficultura, informes de gestión y la relación con Local Partners.'],
    ['Historias', 'Historias de productores (5 publicadas) y el video del Manifiesto.'],
    ['Nosotros', 'Quiénes son, cifras, la visión «pensamos global, somos local» y el equipo.'],
    ['Origen', 'Galería de las regiones de origen del café.'],
    ['Certificaciones', 'Certificaciones, reconocimientos, registros, normas y acreditaciones.'],
    ['Contacto', 'Formulario de contacto y datos de la empresa.'],
    ['Términos y condiciones', 'Información legal del sitio.'],
  ]),
  h2('Local Partners'),
  table([2600, 6760], [
    ['Página', 'Qué encuentra el visitante'],
    ['Inicio', 'Banner principal, cifras de impacto, cómo trabajamos, video, mosaicos de origen, pilares y llamado a la acción.'],
    ['Así trabajamos', 'Del conocimiento a la acción, regiones impactadas, resultados y aliados.'],
    ['Impacto', 'Impacto en cifras, programas, proyectos y la Unidad de Investigación y Desarrollo.'],
    ['Historias', 'Historias de productores (3 publicadas).'],
    ['Nosotros', 'La Fundación en cifras y su forma de trabajo.'],
    ['Origen', 'Galería de las regiones de origen.'],
    ['Certificaciones', 'Certificaciones, verificaciones e indicadores de integridad y trazabilidad.'],
    ['Documentos', 'Documentos legales, tributarios y financieros para descarga.'],
    ['Noticias', 'Espacio para publicar noticias de la Fundación.'],
    ['Contacto', 'Formulario de contacto y datos de la Fundación.'],
    ['Términos y condiciones', 'Información legal del sitio.'],
  ]),

  h1('4. Ajustes realizados'),
  p('Durante el proyecto se atendieron los ajustes solicitados. Todos se encuentran terminados:'),
  table([6760, 2600], [
    ['Ajuste', 'Estado'],
    ['Ajustes visuales del diseño (versión 3) en Inicio, Así trabajamos, Impacto, Historias, Contacto y Certificaciones', 'Terminado'],
    ['Ajustes de diseño en Figma para Cafexport y Local Partners, con visto bueno de diseño', 'Terminado'],
    ['Réplica del diseño de texturas en Local Partners', 'Terminado'],
    ['Traducción del contenido al inglés en ambos sitios y selector de idioma', 'Terminado'],
    ['Videos del Manifiesto y de entrevistas integrados desde YouTube', 'Terminado'],
    ['Carga de informes de gestión y actualización de cifras con base en ellos', 'Terminado'],
    ['Historias e impacto construidos a partir de los documentos entregados', 'Terminado'],
    ['Actualización de las tarjetas de impacto en Inicio y de la imagen de Origen', 'Terminado'],
    ['Sección Equipo ajustada', 'Terminado'],
    ['Enlace entre la página de Impacto y Local Partners', 'Terminado'],
    ['Aliados agregados en Así trabajamos', 'Terminado'],
    ['Sección de documentos en Local Partners', 'Terminado'],
    ['Cambio del botón flotante de contacto', 'Terminado'],
    ['Actualización de imágenes en ambos sitios', 'Terminado'],
  ], { boldFirst: false }),

  h1('5. Siguiente paso: publicación definitiva'),
  callout([
    p([r('Para publicar los sitios en su dirección definitiva se prepara un ', { size: 20 }), r('paquete de migración', { bold: true, size: 20 }),
      r('. Se solicita amablemente confirmar si la publicación se hará en los servidores de La Paguer o en los servidores propios del cliente, para preparar el paquete según el caso.', { size: 20 })], { spacing: { after: 0 } }),
  ]),

  h1('6. Constancia'),
  p('Con la presente acta se deja constancia de la entrega de los sitios web de Cafexport y Local Partners con las secciones, características y ajustes descritos. Agradecemos de antemano su revisión y quedamos atentos a sus comentarios.'),
];

const doc = new Document({
  creator: 'La Paguer', title: 'Acta de entrega — Cafexport y Local Partners',
  styles: { default: { document: { run: { font: FONT, size: 20, color: C.ink } } } },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 400, hanging: 260 } }, run: { color: C.pinkDark } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1700, bottom: 1300, left: 1440, right: 1440, header: 500, footer: 500 } } },
    headers: { default: header }, footers: { default: footer }, children: body,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('ok', OUT); });
