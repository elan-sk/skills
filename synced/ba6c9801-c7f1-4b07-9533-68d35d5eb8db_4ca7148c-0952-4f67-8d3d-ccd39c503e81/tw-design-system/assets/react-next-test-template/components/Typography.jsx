export default function Typography() {
  return (
    <section className="bg-surface">
      <div className="container">
        <header className="text-center">
          <h2 className="text-h2">2. Typography</h2>
        </header>
        <div className="flex-container-12">
          <article>
            <header>
              <h3 className="text-h3 text-center">Fonts Families</h3>
            </header>
            <div className="flex-grid flex-center gap-y-8 xs:flex-grid-2 md:flex-grid-3">
              <div className="text-center">
                <h4 className="text-large">
                  .<span className="test-copy">font-serif</span>
                </h4>
                <p className="font-serif">Text Example</p>
              </div>
              <div className="text-center">
                <h4 className="text-large">
                  .<span className="test-copy">font-sans</span>
                </h4>
                <p className="font-sans">Text Example</p>
              </div>
              <div className="text-center">
                <h4 className="text-large">
                  .<span className="test-copy">font-mono</span>
                </h4>
                <p className="font-mono">Text Example</p>
              </div>
            </div>
          </article>
          <article>
            <header className="text-center">
              <h3 className="text-h3">Fonts Sizes</h3>
            </header>
            <div className="flex-container-2 flex-center">
              <p className="text-h1 test-copy">
                Título H1<span className="test-copy-hidden">text-h1</span>
              </p>
              <p className="text-h2 test-copy">
                Título H2<span className="test-copy-hidden">text-h2</span>
              </p>
              <p className="text-h3 test-copy">
                Título H3<span className="test-copy-hidden">text-h3</span>
              </p>
              <p className="text-h4 test-copy">
                Título H4<span className="test-copy-hidden">text-h4</span>
              </p>
              <p className="text-h5 test-copy">
                Título H5<span className="test-copy-hidden">text-h5</span>
              </p>
              <p className="text-h6 test-copy">
                Título H6<span className="test-copy-hidden">text-h6</span>
              </p>
              <p className="text-large test-copy">
                Texto Encabezado
                <span className="test-copy-hidden">text-large</span>
              </p>
              <p className="text-button test-copy">
                Text Botón<span className="test-copy-hidden">text-button</span>
              </p>
              <p className="text-base test-copy">
                Párrafo<span className="test-copy-hidden">text-base</span>
              </p>
              <p className="text-small test-copy">
                Texto pequeño
                <span className="test-copy-hidden">text-small</span>
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
