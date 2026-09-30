import { redirect } from 'next/navigation';

export default async function ChatRedirect({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  redirect('/messages?chat=' + encodeURIComponent(chatId));
}
