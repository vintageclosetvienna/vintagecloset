'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { SOCIAL_LINKS } from '@/lib/site';

/* The shop's Instagram story as a small blurred box (his ask 31 Oct): homepage and journal. A tap opens the story on Instagram;
   × hides it for a day. */

const HANDLE = SOCIAL_LINKS.instagram.replace(/\/$/, '').split('/').pop() || 'vintage_closet_vienna';
const STORY_URL = `https://www.instagram.com/stories/${HANDLE}/`;
const KEY = 'vc.storyHidden';

export function InstagramStory({ delay = 2200 }: { delay?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hidden = 0;
    try { hidden = Number(localStorage.getItem(KEY) || 0); } catch { /* private mode */ }
    if (Date.now() - hidden < 24 * 3600 * 1000) return;
    const t = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  const hide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShow(false);
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href={STORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch @${HANDLE}'s Instagram story`}
          initial={{ opacity: 0, y: 24, scale: .92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: .92 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed z-40 left-4 bottom-24 md:left-6 md:bottom-8 w-[210px] rounded-2xl overflow-hidden shadow-2xl group"
        >
          {/* the blurred box: the brand's colours behind frosted glass */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-[#7a3b6e] to-brand-plum" />
          <div className="absolute inset-0 backdrop-blur-xl bg-white/25" />
          <div className="relative flex items-center gap-3 p-3 pr-8">
            <span className="relative flex-shrink-0 h-12 w-12 rounded-full p-[2.5px] bg-[conic-gradient(from_200deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)] group-hover:rotate-12 transition-transform duration-500">
              <span className="block h-full w-full rounded-full bg-white p-[2px]">
                <span className="relative block h-full w-full rounded-full overflow-hidden bg-surface">
                  <Image src="/brand/app-icon-192.png" alt="" fill sizes="48px" className="object-cover" />
                </span>
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-white drop-shadow">New story</span>
              <span className="block text-[11px] text-white/85 truncate">@{HANDLE}</span>
            </span>
          </div>
          <button type="button" onClick={hide} aria-label="Hide for today" className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20">
            <X size={12} weight="bold" />
          </button>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
