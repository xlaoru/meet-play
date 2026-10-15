"use client";

import { useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

type Event = {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
};

const INITIAL_EVENTS: Event[] = [
  {
    id: "1",
    title: "IT Meetup",
    description: "Встреча разработчиков",
    lat: 48.4647,
    lng: 35.0462,
  },
  {
    id: "2",
    title: "Hackathon",
    description: "Хакатон для разработчиков",
    lat: 48.468,
    lng: 35.04,
  },
];

const MAP_ID = "DEMO_MAP_ID";

export default function EventsMap() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] =
    useState<Event | null>(null);

  const [newLocation, setNewLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  console.log(events);

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
    >
      <div className="relative h-[600px] w-full">
        <Map
          mapId={MAP_ID}
          defaultCenter={{ lat: 48.4647, lng: 35.0462 }}
          defaultZoom={13}
          gestureHandling="greedy"
          onClick={(event) => {
            const latLng = event.detail.latLng;

            if (!latLng) return;

            setNewLocation({
              lat: latLng.lat,
              lng: latLng.lng,
            });

            setSelectedEvent(null);
          }}
          className="h-full w-full"
        >
          {events.map((item) => (
            <AdvancedMarker
              key={item.id}
              position={{
                lat: item.lat,
                lng: item.lng,
              }}
              title={item.title}
              onClick={() => {
                setSelectedEvent(item);
                setNewLocation(null);
              }}
            />
          ))}

          {selectedEvent && (
            <InfoWindow
              position={{
                lat: selectedEvent.lat,
                lng: selectedEvent.lng,
              }}
              onCloseClick={() => setSelectedEvent(null)}
            >
              <div className="max-w-56 p-1">
                <h3 className="font-semibold">
                  {selectedEvent.title}
                </h3>

                <p className="mt-1 text-sm">
                  {selectedEvent.description}
                </p>
              </div>
            </InfoWindow>
          )}

          {newLocation && (
            <AdvancedMarker
              position={newLocation}
              title="Новое событие"
            />
          )}
        </Map>

        {newLocation && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white p-4 shadow-lg sm:left-auto sm:right-4 sm:w-80">
            <h3 className="font-semibold text-gray-900">
              Новое событие
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Широта: {newLocation.lat.toFixed(6)}
            </p>

            <p className="text-sm text-gray-600">
              Долгота: {newLocation.lng.toFixed(6)}
            </p>

            <button
              className="mt-3 rounded-md bg-black px-4 py-2 text-white"
              onClick={() => {
                const title = window.prompt(
                  "Название события"
                );

                if (!title?.trim()) return;

                const newEvent: Event = {
                  id: crypto.randomUUID(),
                  title: title.trim(),
                  description: "",
                  ...newLocation,
                };

                setEvents((prev) => [...prev, newEvent]);
                setNewLocation(null);
              }}
            >
              Создать событие
            </button>

            <button
              className="ml-2 rounded-md border px-4 py-2"
              onClick={() => setNewLocation(null)}
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </APIProvider>
  );
}