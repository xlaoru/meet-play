
"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
} from "@vis.gl/react-google-maps";
import {
  CalendarDays,
  Clock,
  Flag,
  MapPin,
  Plus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type SportType = "FOOTBALL" | "BASKETBALL" | "VOLLEYBALL" | "OTHER";

type UserProfile = {
  id: number;
  name: string;
  age: number;
  telegramUsername: string;
  createdAt: string;
};

type SportLocation = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  entryFee: number;
  contactInfo: string | null;
  creatorId: number;
  sportType: SportType;
};

type SportEvent = {
  id: number;
  title: string;
  note: string;
  sportType: SportType;
  startsAt: string;
  endsAt: string;
  maxParticipants: number;
  locationId: number;
  organizerId: number;
  participantIds: number[];
};

type LocationForm = {
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
  entryFee: string;
  contactInfo: string;
  sportType: SportType;
};

type EventForm = {
  title: string;
  note: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: string;
  sportType: SportType;
};

type PanelMode = "details" | "create-location" | "create-event" | null;

const MAP_ID = "DEMO_MAP_ID";
const USER_STORAGE_KEY = "userId";

const MOCK_USERS: UserProfile[] = [
  {
    id: 1,
    name: "Ілля",
    age: 19,
    telegramUsername: "@illia",
    createdAt: "2026-10-14T12:00:00",
  },
  {
    id: 2,
    name: "Ваня",
    age: 20,
    telegramUsername: "@vania",
    createdAt: "2026-10-14T12:00:00",
  },
  {
    id: 3,
    name: "Саша",
    age: 20,
    telegramUsername: "@sasha",
    createdAt: "2026-10-14T12:00:00",
  },
  {
    id: 4,
    name: "Демо-користувач",
    age: 22,
    telegramUsername: "@demo",
    createdAt: "2026-10-14T12:00:00",
  },
];

const INITIAL_LOCATIONS: SportLocation[] = [
  {
    id: 1,
    name: "Резинка",
    address: "Парк Глоби, Дніпро",
    latitude: 48.4647,
    longitude: 35.0462,
    openingTime: "08:00:00",
    closingTime: "19:00:00",
    entryFee: 0,
    contactInfo: "@owner",
    creatorId: 1,
    sportType: "OTHER",
  },
  {
    id: 2,
    name: "Баскетбольний майданчик",
    address: "Центральний район, Дніпро",
    latitude: 48.468,
    longitude: 35.04,
    openingTime: "08:00:00",
    closingTime: "21:00:00",
    entryFee: 100,
    contactInfo: "@sports_admin",
    creatorId: 4,
    sportType: "BASKETBALL",
  },
];

const INITIAL_EVENTS: SportEvent[] = [
  {
    id: 1,
    title: "Вечірній футбол",
    note: "Візьміть футбольний м'яч",
    sportType: "FOOTBALL",
    startsAt: "2026-10-16T18:00:00",
    endsAt: "2026-10-16T19:30:00",
    maxParticipants: 10,
    locationId: 1,
    organizerId: 1,
    participantIds: [1, 2, 3],
  },
  {
    id: 2,
    title: "Стрітбол",
    note: "Візьміть воду",
    sportType: "BASKETBALL",
    startsAt: "2026-10-17T17:00:00",
    endsAt: "2026-10-17T18:00:00",
    maxParticipants: 6,
    locationId: 1,
    organizerId: 2,
    participantIds: [2],
  },
  {
    id: 3,
    title: "Баскетбол 3x3",
    note: "Шукаємо ще двох гравців",
    sportType: "BASKETBALL",
    startsAt: "2026-10-18T16:00:00",
    endsAt: "2026-10-18T17:30:00",
    maxParticipants: 6,
    locationId: 2,
    organizerId: 4,
    participantIds: [4, 2],
  },
];

const EMPTY_LOCATION_FORM: LocationForm = {
  name: "",
  address: "",
  openingTime: "08:00",
  closingTime: "19:00",
  entryFee: "0",
  contactInfo: "",
  sportType: "FOOTBALL",
};

const EMPTY_EVENT_FORM: EventForm = {
  title: "",
  note: "",
  date: "",
  startTime: "18:00",
  endTime: "19:30",
  maxParticipants: "10",
  sportType: "FOOTBALL",
};

const SPORT_LABELS: Record<SportType, string> = {
  FOOTBALL: "Футбол",
  BASKETBALL: "Баскетбол",
  VOLLEYBALL: "Волейбол",
  OTHER: "Інше",
};

/**
 * Normalize coordinates received from an API or form.
 * Google Maps requires finite numeric latitude and longitude.
 */
function normalizeCoordinates(
  latitude: unknown,
  longitude: unknown,
): { latitude: number; longitude: number } | null {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    latitude === "" ||
    longitude === ""
  ) {
    return null;
  }

  const lat = typeof latitude === "number" ? latitude : Number(latitude);
  const lng = typeof longitude === "number" ? longitude : Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lng,
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Дату не вказано";

  // Handle both ISO datetime strings and date-only strings.
  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (datePart) {
    const [year, month, day] = datePart.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return "Некоректна дата";
    }

    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Некоректна дата";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "--:--";

  const match = value.match(/(?:T|\s)?(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "--:--";
}

function toLocalDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

function sortEvents(events: SportEvent[]) {
  return [...events].sort((a, b) =>
    String(a.startsAt ?? "").localeCompare(String(b.startsAt ?? "")),
  );
}

function getNextId<T extends { id: number }>(items: T[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function isFutureDateTime(value: string) {
  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function LocationFields({
  form,
  onChange,
}: {
  form: LocationForm;
  onChange: <K extends keyof LocationForm>(
    field: K,
    value: LocationForm[K],
  ) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Назва майданчика *</Label>
        <Input
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Наприклад, Баскетбольний майданчик"
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Адреса</Label>
        <Input
          value={form.address}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="Вулиця, парк, район"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Вид спорту</Label>
        <Select
          value={form.sportType}
          onValueChange={(value) => {
            if (value) onChange("sportType", value as SportType);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Оберіть вид спорту" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SPORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Відкриття</Label>
          <Input
            type="time"
            value={form.openingTime}
            onChange={(event) =>
              onChange("openingTime", event.target.value)
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Закриття</Label>
          <Input
            type="time"
            value={form.closingTime}
            onChange={(event) =>
              onChange("closingTime", event.target.value)
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Вартість відвідування (грн)</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={form.entryFee}
          onChange={(event) => onChange("entryFee", event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Контакти власника</Label>
        <Input
          value={form.contactInfo}
          onChange={(event) =>
            onChange("contactInfo", event.target.value)
          }
          placeholder="@telegram або номер телефону"
        />
      </div>
    </>
  );
}

export default function EventsMap() {
  const [locations, setLocations] =
    useState<SportLocation[]>(INITIAL_LOCATIONS);

  const [events, setEvents] =
    useState<SportEvent[]>(INITIAL_EVENTS);

  const [users] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [selectedLocationId, setSelectedLocationId] =
    useState<number | null>(null);

  const [newCoordinates, setNewCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationForm, setLocationForm] =
    useState<LocationForm>(EMPTY_LOCATION_FORM);

  const [eventForm, setEventForm] =
    useState<EventForm>(EMPTY_EVENT_FORM);

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedUserId = localStorage.getItem(USER_STORAGE_KEY);

        let user = savedUserId
          ? MOCK_USERS.find((item) => item.id === Number(savedUserId))
          : undefined;

        if (!user) {
          user = {
            id: getNextId(MOCK_USERS),
            name: "Гість",
            age: 20,
            telegramUsername: "",
            createdAt: new Date().toISOString(),
          };

          localStorage.setItem(USER_STORAGE_KEY, String(user.id));
        }

        setCurrentUser(user);
      } catch {
        setErrorMessage(
          "Не вдалося ініціалізувати профіль. Перевірте налаштування браузера.",
        );
      } finally {
        setIsInitializing(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const selectedLocation =
    locations.find(({ id }) => id === selectedLocationId) ?? null;

  const locationEvents = selectedLocation
    ? sortEvents(
      events.filter(
        ({ locationId }) => locationId === selectedLocation.id,
      ),
    )
    : [];

  const updateLocationField = <K extends keyof LocationForm>(
    field: K,
    value: LocationForm[K],
  ) => {
    setLocationForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateEventField = <K extends keyof EventForm>(
    field: K,
    value: EventForm[K],
  ) => {
    setEventForm((previous) => ({ ...previous, [field]: value }));
  };

  const closePanel = () => {
    setSelectedLocationId(null);
    setNewCoordinates(null);
    setPanelMode(null);
    setErrorMessage(null);
  };

  const handleMapClick = (latitude: number, longitude: number) => {
    const coordinates = normalizeCoordinates(latitude, longitude);

    if (!coordinates) {
      setErrorMessage("Не вдалося визначити координати на карті.");
      return;
    }

    setSelectedLocationId(null);
    setNewCoordinates(coordinates);
    setLocationForm(EMPTY_LOCATION_FORM);
    setEventForm(EMPTY_EVENT_FORM);
    setErrorMessage(null);
    setPanelMode("create-location");
  };

  const handleSelectLocation = (location: SportLocation) => {
    setSelectedLocationId(location.id);
    setNewCoordinates(null);
    setErrorMessage(null);
    setPanelMode("details");
  };

  const handleSaveLocation = () => {
    if (!currentUser || !newCoordinates) return;

    const coordinates = normalizeCoordinates(
      newCoordinates.latitude,
      newCoordinates.longitude,
    );

    if (!coordinates) {
      setErrorMessage("Координати майданчика некоректні.");
      return;
    }

    const name = locationForm.name.trim();
    const entryFee = Number(locationForm.entryFee);

    if (!name) {
      setErrorMessage("Вкажіть назву майданчика.");
      return;
    }

    if (!Number.isFinite(entryFee) || entryFee < 0) {
      setErrorMessage("Вартість має бути невід'ємним числом.");
      return;
    }

    if (
      !locationForm.openingTime ||
      !locationForm.closingTime ||
      locationForm.openingTime >= locationForm.closingTime
    ) {
      setErrorMessage("Перевірте години роботи майданчика.");
      return;
    }

    const newLocation: SportLocation = {
      id: getNextId(locations),
      name,
      address: locationForm.address.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      openingTime: `${locationForm.openingTime}:00`,
      closingTime: `${locationForm.closingTime}:00`,
      entryFee,
      contactInfo: locationForm.contactInfo.trim() || null,
      creatorId: currentUser.id,
      sportType: locationForm.sportType,
    };

    setLocations((previous) => [...previous, newLocation]);
    setSelectedLocationId(newLocation.id);
    setNewCoordinates(null);
    setPanelMode("details");
    setErrorMessage(null);
  };

  const openCreateEvent = () => {
    setEventForm({
      ...EMPTY_EVENT_FORM,
      sportType: selectedLocation?.sportType ?? "FOOTBALL",
    });
    setErrorMessage(null);
    setPanelMode("create-event");
  };

  const handleSaveEvent = () => {
    if (!currentUser || !selectedLocation) return;

    const title = eventForm.title.trim();
    const maxParticipants = Number(eventForm.maxParticipants);

    if (!title || !eventForm.date) {
      setErrorMessage("Вкажіть назву гри та дату.");
      return;
    }

    if (
      !Number.isInteger(maxParticipants) ||
      maxParticipants < 1
    ) {
      setErrorMessage("Кількість учасників має бути цілим числом від 1.");
      return;
    }

    if (!eventForm.startTime || !eventForm.endTime) {
      setErrorMessage("Вкажіть час початку та завершення гри.");
      return;
    }

    const startsAt = toLocalDateTime(
      eventForm.date,
      eventForm.startTime,
    );

    const endsAt = toLocalDateTime(
      eventForm.date,
      eventForm.endTime,
    );

    const startTimestamp = new Date(startsAt).getTime();
    const endTimestamp = new Date(endsAt).getTime();

    if (
      !Number.isFinite(startTimestamp) ||
      !Number.isFinite(endTimestamp)
    ) {
      setErrorMessage("Перевірте дату та час гри.");
      return;
    }

    if (!isFutureDateTime(startsAt)) {
      setErrorMessage("Початок гри має бути в майбутньому.");
      return;
    }

    if (endTimestamp <= startTimestamp) {
      setErrorMessage("Завершення має бути пізніше за початок.");
      return;
    }

    const newEvent: SportEvent = {
      id: getNextId(events),
      title,
      note: eventForm.note.trim(),
      sportType: eventForm.sportType,
      startsAt,
      endsAt,
      maxParticipants,
      locationId: selectedLocation.id,
      organizerId: currentUser.id,
      participantIds: [currentUser.id],
    };

    setEvents((previous) => [...previous, newEvent]);
    setPanelMode("details");
    setErrorMessage(null);
  };

  const handleToggleParticipation = (event: SportEvent) => {
    if (!currentUser) return;

    const isOrganizer = event.organizerId === currentUser.id;
    const isParticipating = event.participantIds.includes(currentUser.id);
    const participantsCount = event.participantIds.length;

    setErrorMessage(null);

    if (isOrganizer) {
      setErrorMessage("Організатор не може вийти з власної гри.");
      return;
    }

    if (
      !isParticipating &&
      participantsCount >= event.maxParticipants
    ) {
      setErrorMessage("Вільні місця закінчилися. Виберіть іншу подію.");
      return;
    }

    setEvents((previous) =>
      previous.map((item) => {
        if (item.id !== event.id) return item;
        if (item.organizerId === currentUser.id) return item;

        if (item.participantIds.includes(currentUser.id)) {
          return {
            ...item,
            participantIds: item.participantIds.filter(
              (id) => id !== currentUser.id,
            ),
          };
        }

        if (item.participantIds.length >= item.maxParticipants) {
          return item;
        }

        return {
          ...item,
          participantIds: [...item.participantIds, currentUser.id],
        };
      }),
    );
  };

  if (isInitializing) {
    return (
      <div className="flex h-[700px] items-center justify-center rounded-xl border">
        Завантаження профілю...
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    >
      <div className="relative h-[700px] w-full overflow-hidden rounded-xl border">
        <Map
          mapId={MAP_ID}
          defaultCenter={{ lat: 48.4647, lng: 35.0462 }}
          defaultZoom={13}
          gestureHandling="greedy"
          onClick={(event) => {
            const coordinates = event.detail.latLng;

            if (coordinates) {
              handleMapClick(coordinates.lat, coordinates.lng);
            }
          }}
          className="h-full w-full"
        >
          {locations.map((location) => {
            const coordinates = normalizeCoordinates(
              location.latitude,
              location.longitude,
            );

            if (!coordinates) {
              console.warn(
                "Skipping location with invalid coordinates:",
                location,
              );
              return null;
            }

            return (
              <AdvancedMarker
                key={location.id}
                position={{
                  lat: coordinates.latitude,
                  lng: coordinates.longitude,
                }}
                title={location.name}
                onClick={() => handleSelectLocation(location)}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background">
                    <Flag className="size-5" />
                  </div>

                  <div className="rounded-md border bg-background px-2 py-1 text-xs font-medium shadow-sm">
                    {location.name}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {newCoordinates &&
            (() => {
              const coordinates = normalizeCoordinates(
                newCoordinates.latitude,
                newCoordinates.longitude,
              );

              if (!coordinates) return null;

              return (
                <AdvancedMarker
                  position={{
                    lat: coordinates.latitude,
                    lng: coordinates.longitude,
                  }}
                  title="Нова локація"
                >
                  <div className="flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-md">
                    <MapPin className="size-5" />
                  </div>
                </AdvancedMarker>
              );
            })()}
        </Map>

        {panelMode === "create-location" && newCoordinates && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[90%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Нова спортивна локація</CardTitle>
                  <CardDescription>
                    Координати вибрано на карті.
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePanel}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <LocationFields
                form={locationForm}
                onChange={updateLocationField}
              />

              {errorMessage && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveLocation}
                  disabled={!locationForm.name.trim() || !currentUser}
                >
                  Створити майданчик
                </Button>

                <Button variant="outline" onClick={closePanel}>
                  Скасувати
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedLocation && panelMode && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[90%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[420px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    {panelMode === "create-event"
                      ? "Створити гру"
                      : selectedLocation.name}
                  </CardTitle>

                  <CardDescription>
                    {selectedLocation.address || "Адресу не вказано"}
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePanel}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {panelMode === "create-event" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Назва гри *</Label>
                    <Input
                      value={eventForm.title}
                      onChange={(event) =>
                        updateEventField("title", event.target.value)
                      }
                      placeholder="Наприклад, Вечірній баскетбол"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Примітка</Label>
                    <Textarea
                      value={eventForm.note}
                      onChange={(event) =>
                        updateEventField("note", event.target.value)
                      }
                      placeholder="Візьміть воду та спортивне взуття"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Вид спорту</Label>
                    <Select
                      value={eventForm.sportType}
                      onValueChange={(value) => {
                        if (value) {
                          updateEventField(
                            "sportType",
                            value as SportType,
                          );
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {Object.entries(SPORT_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Дата гри *</Label>
                    <Input
                      type="date"
                      value={eventForm.date}
                      onChange={(event) =>
                        updateEventField("date", event.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Початок</Label>
                      <Input
                        type="time"
                        value={eventForm.startTime}
                        onChange={(event) =>
                          updateEventField(
                            "startTime",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Завершення</Label>
                      <Input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(event) =>
                          updateEventField(
                            "endTime",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Максимум учасників</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={eventForm.maxParticipants}
                      onChange={(event) =>
                        updateEventField(
                          "maxParticipants",
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  {errorMessage && (
                    <p role="alert" className="text-sm text-destructive">
                      {errorMessage}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleSaveEvent}
                      disabled={
                        !eventForm.title.trim() ||
                        !eventForm.date ||
                        !Number.isInteger(
                          Number(eventForm.maxParticipants),
                        ) ||
                        Number(eventForm.maxParticipants) < 1
                      }
                    >
                      Створити гру
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setPanelMode("details");
                        setErrorMessage(null);
                      }}
                    >
                      Скасувати
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      {formatTime(selectedLocation.openingTime)}–
                      {formatTime(selectedLocation.closingTime)}
                    </p>

                    <p className="flex items-center gap-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      {selectedLocation.entryFee === 0
                        ? "Безкоштовно"
                        : `${selectedLocation.entryFee} грн`}
                    </p>

                    <p>
                      Вид спорту:{" "}
                      {SPORT_LABELS[selectedLocation.sportType]}
                    </p>

                    {selectedLocation.contactInfo && (
                      <p>Контакти: {selectedLocation.contactInfo}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">
                        Заплановані ігри ({locationEvents.length})
                      </h3>

                      <Button size="sm" onClick={openCreateEvent}>
                        <Plus className="mr-1 size-4" />
                        Створити гру
                      </Button>
                    </div>

                    {locationEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        На цій локації ще немає запланованих ігор.
                      </p>
                    ) : (
                      locationEvents.map((event) => {
                        const participantsCount =
                          event.participantIds.length;

                        const isParticipating =
                          currentUser !== null &&
                          event.participantIds.includes(currentUser.id);

                        const isOrganizer =
                          currentUser !== null &&
                          event.organizerId === currentUser.id;

                        const isFull =
                          participantsCount >= event.maxParticipants;

                        const organizer =
                          users.find(
                            (user) => user.id === event.organizerId,
                          ) ??
                          (currentUser?.id === event.organizerId
                            ? currentUser
                            : undefined);

                        return (
                          <div
                            key={event.id}
                            className="space-y-3 rounded-lg border p-3"
                          >
                            <div>
                              <h4 className="font-semibold">
                                {event.title}
                              </h4>

                              {event.note && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {event.note}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                {SPORT_LABELS[event.sportType]}
                              </Badge>

                              <Badge variant="secondary">
                                <CalendarDays className="mr-1 size-3" />
                                {formatDate(event.startsAt)}
                              </Badge>

                              <Badge variant="secondary">
                                <Clock className="mr-1 size-3" />
                                {formatTime(event.startsAt)}–
                                {formatTime(event.endsAt)}
                              </Badge>

                              <Badge variant="secondary">
                                <Users className="mr-1 size-3" />
                                {participantsCount}/{event.maxParticipants}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              Організатор: {organizer?.name ?? "Учасник"}
                              {organizer?.telegramUsername &&
                                ` (${organizer.telegramUsername})`}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              Учасники:{" "}
                              {participantsCount > 0
                                ? event.participantIds
                                  .map(
                                    (id) =>
                                      users.find(
                                        (user) => user.id === id,
                                      )?.name ??
                                      (currentUser?.id === id
                                        ? currentUser.name
                                        : "Учасник"),
                                  )
                                  .join(", ")
                                : "Поки що немає"}
                            </p>

                            {isOrganizer ? (
                              <p className="text-sm text-muted-foreground">
                                Ви організатор цієї гри.
                              </p>
                            ) : (
                              <Button
                                className="w-full"
                                variant={
                                  isParticipating ? "outline" : "default"
                                }
                                disabled={!isParticipating && isFull}
                                onClick={() =>
                                  handleToggleParticipation(event)
                                }
                              >
                                {isParticipating
                                  ? "Відмовитися від участі"
                                  : isFull
                                    ? "Місць немає"
                                    : "Приєднатися до гри"}
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {errorMessage && (
                    <p role="alert" className="text-sm text-destructive">
                      {errorMessage}
                    </p>
                  )}

                  <Separator />

                  <p className="text-xs text-muted-foreground">
                    Локація #{selectedLocation.id} · Ваш профіль:{" "}
                    {currentUser?.name} (ID: {currentUser?.id})
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </APIProvider>
  );
}
