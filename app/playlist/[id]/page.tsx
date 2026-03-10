import { redirect } from 'next/navigation';

/**
 * Legacy route — redirect to the new /sheet/[sheetId] route.
 */
export default async function PlaylistRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sheet/${id}`);
}
