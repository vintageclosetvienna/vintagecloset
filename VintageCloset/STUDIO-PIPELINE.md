# Vintage Studio pipeline: how the Mac (Rennstern app) connects

The team app (`/staff/studio`) collects shop photos. The Vintage pipeline in the Rennstern app on the Mac
picks them up, edits them and sends the finished pictures back. Everything goes through Supabase
(project `vintageclosetvienna`); no new server is needed.

## Flow
| Status in `public.studio_photos` | Who sets it | Meaning |
|---|---|---|
| `new` | team app (upload) | Photo is in the "Eingang" album |
| `queued` | team app ("Ans Studio senden") | Waiting for the Mac |
| `processing` | Mac | Mac has taken it |
| `done` | Mac | Finished picture uploaded, `result_url` filled |
| `failed` | Mac | Could not edit; `note` says why |
| `used` | team app | Photo was used in a product (`product_id`) |

Originals: bucket `studio`, path in `path`, public link in `url`.
Results: upload into the same bucket under `results/<id>.jpg`, then set `result_path` and `result_url`.

## Login for the Mac
Create one studio account (role `studio` can only read/write studio photos, nothing else):
```sql
insert into public.admin_users(email, role, display_name) values ('studio@vintagecloset.app', 'studio', 'Vintage Studio Mac');
```
Then Supabase → Authentication → Users → Add user with that email and a strong password (auto-confirm).
The Mac signs in with `supabase.auth.signInWithPassword` using the public URL and anon key
(same values as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Never put the service key on the Mac.

## Minimal worker loop (TypeScript, runs on the Mac)
```ts
const { data: jobs } = await sb.from('studio_photos').select('*').eq('status', 'queued').order('created_at').limit(10);
for (const job of jobs ?? []) {
  await sb.from('studio_photos').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', job.id).eq('status', 'queued');
  try {
    const original = await fetch(job.url).then(r => r.arrayBuffer());
    const edited = await runVintagePipeline(original);           // the Rennstern Vintage pipeline
    const resultPath = `results/${job.id}.jpg`;
    await sb.storage.from('studio').upload(resultPath, edited, { contentType: 'image/jpeg', upsert: true });
    const { data } = sb.storage.from('studio').getPublicUrl(resultPath);
    await sb.from('studio_photos').update({ status: 'done', result_path: resultPath, result_url: data.publicUrl, updated_at: new Date().toISOString() }).eq('id', job.id);
  } catch (e) {
    await sb.from('studio_photos').update({ status: 'failed', note: String(e).slice(0, 300), updated_at: new Date().toISOString() }).eq('id', job.id);
  }
}
```
Run it every minute (launchd or a loop with a pause), or subscribe to Realtime changes on `studio_photos`.
