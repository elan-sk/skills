function ColorCircle({ title, colors }) {
  return (
    <article>
      <header>
        <h3 className="text-h3 text-center">{title} Colors</h3>
      </header>

      <div className="flex-grid sm:flex-grid-2 md:flex-grid-3 flex-center gap-y-6">
        {colors.map((color) => (
          <div key={color} className="text-center">
            <div
              className={`size-30 rounded-full mx-auto bg-${color} bg-color-selected border-2 border-gray-600 flex-center text-large font-semibold`}
            >
              abc
            </div>

            <div className="pt-2">
              <strong className="capitalize test-copy cursor-pointer">
                {color}
              </strong>
            </div>

            <div>
              <p>
                .<span className="test-copy cursor-pointer">bg-{color}</span>
                <br />
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export default ColorCircle
