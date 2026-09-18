import ButtonCard from './ButtonCard'
export default function ButtonSection() {
  const variants = ['primary', 'secondary', 'tertiary', '']

  return (
    <section>
      <header className="text-center">
        <h2 className="text-h2">4. Buttons</h2>
      </header>
      <div className="container flex-grid md:flex-grid-2 lg:flex-grid-3 gap-y-8">
        {variants.map((variant) => {
          return <ButtonCard key={variant} variant={variant} />
        })}
      </div>
    </section>
  )
}
