// The turning sides of a piece sent from the shop's app: its photos carry their view in the file name
// (…/<id>/<n>-front.jpg, -side.jpg, -back.jpg), so the product page can build its turn card from them (31 Oct).
// Pieces added by hand have plain names and simply get no turn card.

export interface TurnView {
  view: 'front' | 'side' | 'back';
  src: string;
}

const ORDER: TurnView['view'][] = ['front', 'side', 'back'];

export function turnViews(images: string[] | null | undefined): TurnView[] {
  const list = images || [];
  return ORDER.flatMap((view) => {
    const src = list.find((u) => new RegExp(`/\\d+-${view}\\.(?:jpe?g|png|webp)(?:\\?|$)`, 'i').test(u));
    return src ? [{ view, src }] : [];
  });
}
