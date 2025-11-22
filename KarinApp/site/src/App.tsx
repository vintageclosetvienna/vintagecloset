import { useLenis } from './hooks/useLenis'
import { CraftNarrative } from './components/CraftNarrative'
import { FeaturedPieces } from './components/FeaturedPieces'
import { FooterSignature } from './components/FooterSignature'
import { Hero } from './components/Hero'
import { ContactPanel } from './components/ContactPanel'

const App = () => {
  useLenis()

  return (
    <div className="site-shell">
      <Hero />
      <CraftNarrative />
      <FeaturedPieces />
      <ContactPanel />
      <FooterSignature />
    </div>
  )
}

export default App


