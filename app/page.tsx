import { BookingApp } from "@/components/booking-app";
import { Providers } from "@/components/providers";

export default function Home() {
  return (
    <Providers>
      <BookingApp />
    </Providers>
  );
}
