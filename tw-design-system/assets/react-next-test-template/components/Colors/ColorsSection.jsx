import ColorCircle from './ColorCircle'

export default function ColorsSection() {
  return (
    <section>
      <div className="container-md">
        <header className="text-center">
          <h2 className="text-h2">1. Colors</h2>
        </header>

        <div className="flex-container-12">
          <ColorCircle
            title="Primaries"
            colors={['primary-dk', 'primary', 'primary-lt']}
          />

          <ColorCircle
            title="Secondaries"
            colors={['secondary-dk', 'secondary', 'secondary-lt']}
          />

          <ColorCircle
            title="Tertiaries"
            colors={['tertiary-dk', 'tertiary', 'tertiary-lt']}
          />

          <ColorCircle
            title="Backgrounds"
            colors={['background', 'surface', 'outline']}
          />

          <ColorCircle title="Messages" colors={['success', 'info', 'error']} />
        </div>
      </div>
    </section>
  )
}
