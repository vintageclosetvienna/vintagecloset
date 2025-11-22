import { motion } from 'framer-motion'

export const FooterSignature = () => {
  return (
    <footer className="section footer">
      <motion.div
        className="footer__monogram"
        animate={{ rotate: 360 }}
        transition={{ duration: 45, ease: 'linear', repeat: Infinity }}
      >
        <span>KP</span>
      </motion.div>
      <div>
        <p className="label">Designed in Germany · 2025</p>
        <p className="footer__copy">© Karen Pagenstert. Crafted for luminous rituals.</p>
      </div>
      <a href="https://instagram.com/atelier.karen" target="_blank" rel="noreferrer" className="footer__link">
        Follow the atelier
      </a>
    </footer>
  )
}


