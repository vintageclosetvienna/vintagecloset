-- ============================================
-- VINTAGE CLOSET - POP UP WEEKENDS (Bandgasse 43)
-- Line-up, gallery and DJ invite links for the ten pop up weekends
-- announced in the journal post "Ten Weekends at Bandgasse 43".
-- Applied 27 Oct 2026 (migration popup_weekends).
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS series TEXT,
  ADD COLUMN IF NOT EXISTS lineup JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS today_note TEXT,
  ADD COLUMN IF NOT EXISTS journal_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_events_series ON events(series);

-- One secret link per line-up slot, so a DJ can fill in their own name, photo
-- and links. Never readable from the browser: only the server (service role)
-- reads it, so tokens cannot leak through the public events table.
CREATE TABLE IF NOT EXISTS event_dj_invites (
  token TEXT PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  UNIQUE (event_id, slot_id)
);
ALTER TABLE event_dj_invites ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: anon and authenticated get nothing.

-- Ten weekends, Saturday + Sunday, 15:00-21:00, four open slots each.
INSERT INTO events (slug, title, description, date, end_date, time, location, image, status, is_published, series, lineup, gallery, journal_slug)
SELECT
  'pop-up-weekend-' || lpad(n::text, 2, '0'),
  'Pop Up Weekend ' || n,
  'Vintage clothes, good music, nice people. Live sets from a secret line up, open decks, coffee and drinks while you browse. Bandgasse 43, 1070 Wien.',
  sat,
  sat + 1,
  '15:00 – 21:00',
  'Bandgasse 43, 1070 Wien',
  'https://ybbfeprueeeijqlbtxts.supabase.co/storage/v1/object/public/product-images/1793032344313-wprhw1.jpg',
  CASE WHEN sat + 1 < CURRENT_DATE THEN 'Past' ELSE 'Upcoming' END,
  TRUE,
  'popup-bandgasse-43',
  jsonb_build_array(
    jsonb_build_object('id', 's1', 'day', 'Sat', 'time', '15:00 – 18:00'),
    jsonb_build_object('id', 's2', 'day', 'Sat', 'time', '18:00 – 21:00'),
    jsonb_build_object('id', 's3', 'day', 'Sun', 'time', '15:00 – 18:00'),
    jsonb_build_object('id', 's4', 'day', 'Sun', 'time', '18:00 – 21:00')
  ),
  '{}',
  'vintage-closet-pop-up-bandgasse-43'
FROM (
  SELECT n, DATE '2026-10-24' + (n - 1) * 7 AS sat FROM generate_series(1, 10) AS n
) w
ON CONFLICT (slug) DO NOTHING;

-- Weekend 1 (opening) uses the photos already posted in the journal (links, no copies).
UPDATE events e SET gallery = ARRAY(SELECT unnest(j.images) OFFSET 1)
FROM journal_articles j
WHERE e.slug = 'pop-up-weekend-01' AND j.slug = 'vintage-closet-pop-up-bandgasse-43' AND e.gallery = '{}';
