'use client';

import { useState } from 'react';
import { DownloadSimple, InstagramLogo, LinkSimple, WhatsappLogo, Check } from '@phosphor-icons/react';
import { SITE_URL } from '@/lib/site';

/**
 * Share a story card: on phones the share sheet gets the PNG itself, so it goes straight
 * into an Instagram or WhatsApp story; elsewhere the card downloads. Plus WhatsApp and copy link.
 */
export function ShareStory({
  cardPath,
  pagePath,
  text,
  fileName,
  compact = false,
}: {
  cardPath: string;
  pagePath: string;
  text: string;
  fileName: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const pageUrl = `${SITE_URL}${pagePath}`;

  const shareCard = async () => {
    setBusy(true);
    try {
      const response = await fetch(cardPath);
      const blob = await response.blob();
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${pageUrl}` });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch {
      // The person closed the share sheet; nothing to do.
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const pill =
    'inline-flex items-center gap-2 rounded-full font-semibold transition-all active:scale-95 ' +
    (compact ? 'px-3 py-2 text-xs' : 'px-5 py-3 text-sm');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={shareCard}
        disabled={busy}
        className={`${pill} bg-brand-plum text-white hover:bg-brand-plum/90 disabled:opacity-60`}
      >
        <InstagramLogo weight="bold" size={compact ? 14 : 18} />
        {busy ? 'Making card…' : 'Share story card'}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${pageUrl}`)}`}
        target="_blank"
        rel="noreferrer"
        className={`${pill} bg-[#25D366] text-white hover:opacity-90`}
      >
        <WhatsappLogo weight="bold" size={compact ? 14 : 18} />
        WhatsApp
      </a>
      <button type="button" onClick={copy} className={`${pill} border border-hairline bg-white text-ink hover:border-ink`}>
        {copied ? <Check weight="bold" size={compact ? 14 : 18} /> : <LinkSimple weight="bold" size={compact ? 14 : 18} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      {!compact ? (
        <a href={cardPath} download={`${fileName}.png`} className={`${pill} text-muted hover:text-ink`}>
          <DownloadSimple weight="bold" size={18} />
          Card
        </a>
      ) : null}
    </div>
  );
}
