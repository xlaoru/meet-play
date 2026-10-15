import EventsMap from "@/components/map/Map";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-bold">
        Мапа подій
      </h1>
      <EventsMap />
    </main>
  );
}