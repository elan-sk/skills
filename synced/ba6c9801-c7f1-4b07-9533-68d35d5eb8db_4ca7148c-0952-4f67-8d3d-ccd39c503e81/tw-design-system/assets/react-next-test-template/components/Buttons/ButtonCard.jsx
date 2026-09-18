export default function ButtonCard({ variant }) {
  return (
    <article className="flex-container">
      <h4 className="text-large mb-4 text-center">Button {variant}</h4>

      <div className="text-center">
        <a href="#" className={`btn-${variant}`}>
          <span>Ver contenido</span>
        </a>

        {variant !== '' && (
          <p className="test-copy cursor-pointer mt-3">
            .btn-{variant}{' '}
            <span className="test-copy-hidden">btn-{variant}</span>
          </p>
        )}
        {variant === '' && (
          <p className="test-copy cursor-pointer mt-3">Link (Etiqueta a)</p>
        )}
      </div>
    </article>
  )
}
