import { getSession } from '@/lib/scanning-checks/door-scanning-checks'
import { redirect } from 'next/navigation'

export default async function DoorLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ venueId: string; sessionId: string }>
}) {
  const awaitedParams = await params
  const session = await getSession({ sessionId: awaitedParams.sessionId })

  if (session.data) {
    const currentTime = new Date()

    if (session.data.endTime) {
      const sessionEndTime = new Date(session.data.endTime)

      if (currentTime > sessionEndTime) {
        redirect('/team/door')
      }
    }
  }

  return (
    <>
      {children}
    </>
  )
}
