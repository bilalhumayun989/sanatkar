'use client';

import { useEffect } from 'react';

export default function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    // Fire-and-forget — never blocks rendering
    fetch(`/api/listings/${listingId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'view' }),
    }).catch(() => {});
  }, [listingId]);

  return null;
}
