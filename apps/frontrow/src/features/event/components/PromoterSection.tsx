import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';

export function PromoterSection() {
  return (
    <section>
      <h2 className="mb-4 font-semibold text-white text-xl">Promoter</h2>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 overflow-hidden rounded-full">
          <img
            alt="Frost Children"
            className="h-full w-full object-cover"
            src="https://dice-media.imgix.net/attachments/2022-02-16/b2be09ab-e456-4442-89ae-1d3a67fbb622.jpg?rect=0%2C1%2C639%2C639&auto=format%2Ccompress&q=80&w=50&h=50&fit=crop&crop=faces%2Ccenter"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white">Promoter Name</h3>
        </div>
        <Button variant="default">FOLLOW</Button>
      </div>
      <Divider />
    </section>
  );
}
