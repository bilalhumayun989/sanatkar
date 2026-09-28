import { redirect } from 'next/navigation';

export default async function ListingDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/buyer/${id}`);
}
