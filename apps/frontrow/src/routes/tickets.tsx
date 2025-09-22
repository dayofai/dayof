import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TicketFormState {
  attendeeName: string;
  attendeeEmail: string;
  eventName: string;
  eventDateTime: string;
  venueName: string;
  seat: string;
  section: string;
}

export const Route = createFileRoute("/tickets")({
  component: TicketsPage,
});

const initialState: TicketFormState = {
  attendeeName: "",
  attendeeEmail: "",
  eventName: "",
  eventDateTime: "",
  venueName: "",
  seat: "",
  section: "",
};

function TicketsPage() {
  const [form, setForm] = useState<TicketFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isDisabled = useMemo(() => {
    return submitting || !form.attendeeName || !form.attendeeEmail || !form.eventName;
  }, [form, submitting]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.attendeeEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        eventName: form.eventName,
        eventDateISO: form.eventDateTime
          ? new Date(form.eventDateTime).toISOString()
          : undefined,
        venueName: form.venueName,
        seat: form.seat || undefined,
        section: form.section || undefined,
        description: form.attendeeName,
        organizationName: `Ticket for ${form.attendeeName}`,
        logoText: form.attendeeEmail,
      };

      const response = await fetch("/api/create-pass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "ticket.pkpass";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Wallet pass download should begin shortly.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate pass"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a Wallet Pass</CardTitle>
        </CardHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Attendee</h3>
              <div className="mt-2 space-y-3">
                <div className="grid gap-1">
                  <Label htmlFor="attendeeName">Name</Label>
                  <Input
                    id="attendeeName"
                    name="attendeeName"
                    placeholder="Jane Doe"
                    value={form.attendeeName}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="attendeeEmail">Email</Label>
                  <Input
                    id="attendeeEmail"
                    name="attendeeEmail"
                    type="email"
                    placeholder="jane@example.com"
                    value={form.attendeeEmail}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Event</h3>
              <div className="mt-2 space-y-3">
                <div className="grid gap-1">
                  <Label htmlFor="eventName">Event name</Label>
                  <Input
                    id="eventName"
                    name="eventName"
                    placeholder="DayOf Launch"
                    value={form.eventName}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="eventDateTime">Event date & time</Label>
                  <Input
                    id="eventDateTime"
                    name="eventDateTime"
                    type="datetime-local"
                    value={form.eventDateTime}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="venueName">Venue</Label>
                  <Input
                    id="venueName"
                    name="venueName"
                    placeholder="DayOf Arena"
                    value={form.venueName}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Seating</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="seat">Seat</Label>
                  <Input
                    id="seat"
                    name="seat"
                    placeholder="B12"
                    value={form.seat}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    name="section"
                    placeholder="VIP"
                    value={form.section}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>
            </section>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isDisabled}>
              {submitting ? 'Generating…' : 'Generate Pass'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}