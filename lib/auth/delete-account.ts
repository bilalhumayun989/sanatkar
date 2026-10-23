import type { Prisma, PrismaClient } from '@prisma/client';

/** Delete dependent records before their parents, including shared threads.
 * Keep this exported for integration tests against an isolated PostgreSQL DB.
 */
export async function deleteAccountData(tx: Prisma.TransactionClient, userId: string) {
  // Serialize deletion with concurrent profile writes and duplicate requests.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))::text`;
  await tx.$queryRaw`SELECT id FROM public.profiles WHERE id = ${userId}::uuid FOR UPDATE`;
  await tx.$executeRaw`INSERT INTO public.deleted_accounts(user_id) VALUES (${userId}::uuid) ON CONFLICT DO NOTHING`;
  const listings = { sellerId: userId };
  const listingIds = (await tx.listing.findMany({ where: listings, select: { id: true } })).map(row => row.id);
  const chats = { OR: [{ buyerId: userId }, { sellerId: userId }, { listingId: { in: listingIds } }] };
  const chatIds = (await tx.chat.findMany({ where: chats, select: { id: true } })).map(row => row.id);
  const offerIds = (await tx.offer.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }, { listingId: { in: listingIds } }] }, select: { id: true },
  })).map(row => row.id);
  // Remove copies of deleted message/offer previews from recipients' inboxes too.
  await tx.$executeRaw`
    WITH owned_listings AS (SELECT id FROM public.listings WHERE seller_id = ${userId}::uuid),
    owned_chats AS (SELECT id FROM public.chats WHERE buyer_id = ${userId}::uuid OR seller_id = ${userId}::uuid OR listing_id IN (SELECT id FROM owned_listings)),
    owned_offers AS (SELECT id FROM public.offers WHERE buyer_id = ${userId}::uuid OR seller_id = ${userId}::uuid OR listing_id IN (SELECT id FROM owned_listings)),
    owned_messages AS (SELECT id FROM public.messages WHERE sender_id = ${userId}::uuid OR chat_id IN (SELECT id FROM owned_chats))
    DELETE FROM public.notifications WHERE user_id = ${userId}::uuid
      OR metadata->>'chat_id' IN (SELECT id::text FROM owned_chats)
      OR metadata->>'offer_id' IN (SELECT id::text FROM owned_offers)
      OR metadata->>'message_id' IN (SELECT id::text FROM owned_messages)`;
  await tx.chatHiddenFor.deleteMany({ where: { OR: [{ userId }, { chatId: { in: chatIds } }] } });
  await tx.message.deleteMany({ where: { OR: [{ senderId: userId }, { chatId: { in: chatIds } }] } });
  await tx.chat.deleteMany({ where: chats });
  await tx.offer.deleteMany({ where: { id: { in: offerIds } } });
  await tx.order.deleteMany({ where: { OR: [{ buyerId: userId }, { sellerId: userId }, { productId: { in: listingIds } }] } });
  await tx.favorite.deleteMany({ where: { OR: [{ userId }, { listingId: { in: listingIds } }] } });
  await tx.listingView.deleteMany({ where: { OR: [{ viewerId: userId }, { listingId: { in: listingIds } }] } });
  await tx.listingShare.deleteMany({ where: { OR: [{ sharerId: userId }, { listingId: { in: listingIds } }] } });
  await tx.badgeRequest.deleteMany({ where: { userId } });
  await tx.listing.deleteMany({ where: listings });
  await tx.profile.deleteMany({ where: { id: userId } });
  await tx.$executeRaw`DELETE FROM public.account_deletion_attempts WHERE user_id = ${userId}::uuid`;
}

export class IdentityDeletionError extends Error {}

export async function deleteAccount(db: PrismaClient, userId: string, removeIdentity: () => Promise<void>) {
  let identityRemoved = false;
  // If the remote delete succeeded but the local commit failed transiently,
  // retry the idempotent local cleanup without deleting the identity again.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db.$transaction(async tx => {
        await deleteAccountData(tx, userId);
        if (!identityRemoved) {
          try { await removeIdentity(); identityRemoved = true; }
          catch { throw new IdentityDeletionError('Unable to delete the sign-in account. Please try again.'); }
        }
      }, { timeout: 20000, maxWait: 5000 });
      return;
    } catch (error) {
      if (!identityRemoved || attempt === 2) throw error;
    }
  }
}
