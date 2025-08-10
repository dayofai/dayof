import { AccessDenied } from '@/components/auth/access-denied'
import { Protect } from '@clerk/nextjs'

export default function DoorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protect
      permission="org:maniac_cards:door"
      fallback={<AccessDenied reason="You're not authorized for door scanning." />}
    >
      <div className="flex flex-col w-full h-full flex-grow px-2 no-touchie">
          {children}
      </div>
    </Protect>
  )
}
