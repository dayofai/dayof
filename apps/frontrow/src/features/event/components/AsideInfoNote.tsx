import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';

export function AsideInfoNote() {
  return (
    <>
      <Divider spacing="tight" />
      <p className="my-4 font-normal text-sm text-white/66 leading-[130%] tracking-[0.02em]">
        DICE protects fans and artists from resellers. Tickets will be securely
        stored in the app.
      </p>
      <Button href="/" size="none" variant="ghost">
        Get a code?
      </Button>
    </>
  );
}
