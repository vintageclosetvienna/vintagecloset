import { motion } from 'framer-motion'

import { narrativeBlocks } from '../content'

export const CraftNarrative = () => {
  return (
    <section className="section narrative" id="craft">
      <div className="narrative__rail" aria-hidden="true" />

      {narrativeBlocks.map((block) => (
        <motion.article
          className="narrative__card glass"
          key={block.title}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          <header>
            <p className="label">Atelier Chapter</p>
            <h3>{block.title}</h3>
          </header>

          <ul>
            {block.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          <footer>{block.microcopy}</footer>
        </motion.article>
      ))}
    </section>
  )
}


