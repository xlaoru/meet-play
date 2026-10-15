"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
} from "@vis.gl/react-google-maps";
import axios from "axios";
import {
  CalendarDays,
  Clock,
  Flag,
  Plus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  startTransition,
  useCallback,
  useEffect,
  useState,
} from "react";

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
import { Textarea } from "@/components/ui/textarea";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

const DEFAULT_CENTER = {
  lat: 48.4647,
  lng: 35.0462,
};

type User = {
  id: string;
  name: string;
  age: number;
  telegramUsername: string;
};

type SportLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  entryFee: number;
  contactInfo: string;
  sportType: string;
  creatorId?: string;
};

type SportEvent = {
  id: string;
  title: string;
  note: string;
  sportType: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number;
  participantsCount: number;
  locationId: string;
  locationName: string;
  organizerName: string;
  organizerTelegramUsername: string;
};

type LocationForm = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  openingTime: string;
  closingTime: string;
  entryFee: string;
  contactInfo: string;
  sportType: string;
};

type EventForm = {
  title: string;
  note: string;
  sportType: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: string;
};

type UserForm = {
  name: string;
  age: string;
  telegramUsername: string;
};

const EMPTY_LOCATION_FORM: LocationForm = {
  name: "",
  address: "",
  latitude: String(DEFAULT_CENTER.lat),
  longitude: String(DEFAULT_CENTER.lng),
  openingTime: "08:00",
  closingTime: "22:00",
  entryFee: "0",
  contactInfo: "",
  sportType: "FOOTBALL",
};

const EMPTY_EVENT_FORM: EventForm = {
  title: "",
  note: "",
  sportType: "FOOTBALL",
  startsAt: "",
  endsAt: "",
  maxParticipants: "10",
};

const EMPTY_USER_FORM: UserForm = {
  name: "",
  age: "18",
  telegramUsername: "",
};

const SPORTS = [
  { value: "FOOTBALL", label: "Футбол" },
  { value: "BASKETBALL", label: "Баскетбол" },
  { value: "VOLLEYBALL", label: "Волейбол" },
  { value: "OTHER", label: "Інше" },
];

const EVENT_SPORTS = [
  { value: "FOOTBALL", label: "Футбол" },
  { value: "BASKETBALL", label: "Баскетбол" },
  { value: "VOLLEYBALL", label: "Волейбол" },
  { value: "OTHER", label: "Інше" },
];

const inputClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    return error.message || "Не вдалося виконати запит до сервера.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Сталася невідома помилка.";
}

function isValidCoordinate(
  latitude: unknown,
  longitude: unknown,
): latitude is number {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function parseCoordinate(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Дату не вказано";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дату не вказано";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null | undefined): string {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toLocalDateTimeInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getInitialEventTimes() {
  const start = new Date();

  start.setHours(start.getHours() + 1);
  start.setMinutes(0, 0, 0);

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    startsAt: toLocalDateTimeInput(start),
    endsAt: toLocalDateTimeInput(end),
  };
}

function getSportLabel(value: string): string {
  return SPORTS.find((sport) => sport.value === value)?.label ?? value;
}

export default function EventsMap() {
  const [locations, setLocations] = useState<SportLocation[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);

  const [selectedLocationId, setSelectedLocationId] = useState<
    string | null
  >(null);

  const [locationForm, setLocationForm] =
    useState<LocationForm>(EMPTY_LOCATION_FORM);

  const [eventForm, setEventForm] =
    useState<EventForm>(EMPTY_EVENT_FORM);

  const [userForm, setUserForm] =
    useState<UserForm>(EMPTY_USER_FORM);

  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ??
    null;

  const locationEvents = events
    .filter((event) => event.locationId === selectedLocationId)
    .sort((a, b) => {
      const first = new Date(a.startsAt).getTime();
      const second = new Date(b.startsAt).getTime();

      if (!Number.isFinite(first)) return 1;
      if (!Number.isFinite(second)) return -1;

      return first - second;
    });

  const loadLocations = useCallback(async () => {
    setIsLoadingLocations(true);

    try {
      const response = await axios.get<SportLocation[]>(
        `${API_URL}/api/locations`,
      );

      const data = Array.isArray(response.data)
        ? response.data.filter((location) =>
          isValidCoordinate(
            location.latitude,
            location.longitude,
          ),
        )
        : [];

      startTransition(() => {
        setLocations(data);
        setError("");
      });
    } catch (requestError) {
      startTransition(() => {
        setError(getErrorMessage(requestError));
      });
    } finally {
      startTransition(() => {
        setIsLoadingLocations(false);
      });
    }
  }, []);

  const loadLocationEvents = useCallback(
    async (locationId: string) => {
      setIsLoadingEvents(true);

      try {
        const response = await axios.get<SportEvent[]>(
          `${API_URL}/api/locations/${locationId}/events`,
        );

        const list = Array.isArray(response.data)
          ? response.data
          : [];

        const enrichedEvents = await Promise.all(
          list.map(async (event) => {
            try {
              const detailResponse = await axios.get<SportEvent>(
                `${API_URL}/api/events/${event.id}`,
              );

              const details = detailResponse.data;

              return {
                ...event,
                ...details,
                locationId:
                  details.locationId ||
                  event.locationId ||
                  locationId,
                participantsCount:
                  Number(
                    details.participantsCount ??
                    event.participantsCount,
                  ) || 0,
                maxParticipants:
                  Number(
                    details.maxParticipants ??
                    event.maxParticipants,
                  ) || 0,
              };
            } catch {
              return {
                ...event,
                locationId: event.locationId || locationId,
                participantsCount:
                  Number(event.participantsCount) || 0,
                maxParticipants:
                  Number(event.maxParticipants) || 0,
              };
            }
          }),
        );

        startTransition(() => {
          setEvents((previous) => [
            ...previous.filter(
              (event) => event.locationId !== locationId,
            ),
            ...enrichedEvents,
          ]);
          setError("");
        });
      } catch (requestError) {
        startTransition(() => {
          setError(getErrorMessage(requestError));
        });
      } finally {
        startTransition(() => {
          setIsLoadingEvents(false);
        });
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const response = await axios.get<SportLocation[]>(
          `${API_URL}/api/locations`,
        );

        if (!active) return;

        const data = Array.isArray(response.data)
          ? response.data.filter((location) =>
            isValidCoordinate(
              location.latitude,
              location.longitude,
            ),
          )
          : [];

        startTransition(() => {
          setLocations(data);
          setError("");
          setIsLoadingLocations(false);
        });
      } catch (requestError) {
        if (!active) return;

        startTransition(() => {
          setError(getErrorMessage(requestError));
          setIsLoadingLocations(false);
        });
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const restoreData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const savedIds = localStorage.getItem("joinedEventIds");

        if (!active) return;

        if (userId) {
          startTransition(() => {
            setCurrentUser({
              id: userId,
              name: "Ваш профіль",
              age: 18,
              telegramUsername: "",
            });
          });
        }

        if (savedIds) {
          const parsed: unknown = JSON.parse(savedIds);

          if (Array.isArray(parsed)) {
            startTransition(() => {
              setJoinedEventIds(
                parsed.filter(
                  (id): id is string => typeof id === "string",
                ),
              );
            });
          }
        }
      } catch {
        // localStorage може бути недоступним або містити некоректні дані.
      }
    };

    void restoreData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedLocationId) return;

    let active = true;
    const locationId = selectedLocationId;

    const run = async () => {
      startTransition(() => {
        setIsLoadingEvents(true);
      });

      try {
        const response = await axios.get<SportEvent[]>(
          `${API_URL}/api/locations/${locationId}/events`,
        );

        const list = Array.isArray(response.data)
          ? response.data
          : [];

        const enrichedEvents = await Promise.all(
          list.map(async (event) => {
            try {
              const detailResponse = await axios.get<SportEvent>(
                `${API_URL}/api/events/${event.id}`,
              );

              const details = detailResponse.data;

              return {
                ...event,
                ...details,
                locationId:
                  details.locationId ||
                  event.locationId ||
                  locationId,
                participantsCount:
                  Number(
                    details.participantsCount ??
                    event.participantsCount,
                  ) || 0,
                maxParticipants:
                  Number(
                    details.maxParticipants ??
                    event.maxParticipants,
                  ) || 0,
              };
            } catch {
              return {
                ...event,
                locationId: event.locationId || locationId,
                participantsCount:
                  Number(event.participantsCount) || 0,
                maxParticipants:
                  Number(event.maxParticipants) || 0,
              };
            }
          }),
        );

        if (!active) return;

        startTransition(() => {
          setEvents((previous) => [
            ...previous.filter(
              (event) => event.locationId !== locationId,
            ),
            ...enrichedEvents,
          ]);
          setError("");
          setIsLoadingEvents(false);
        });
      } catch (requestError) {
        if (!active) return;

        startTransition(() => {
          setError(getErrorMessage(requestError));
          setIsLoadingEvents(false);
        });
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [selectedLocationId]);

  const closePanels = () => {
    setSelectedLocationId(null);
    setIsCreatingLocation(false);
    setIsCreatingEvent(false);
    setIsCreatingUser(false);
    setError("");
    setNotice("");
  };

  const handleMapClick = (event: {
    detail: {
      latLng: { lat: number; lng: number } | null;
    };
  }) => {
    const coordinates = event.detail.latLng;

    if (!coordinates) return;

    setSelectedLocationId(null);
    setIsCreatingEvent(false);
    setIsCreatingUser(false);
    setError("");
    setNotice("");

    setLocationForm({
      ...EMPTY_LOCATION_FORM,
      latitude: String(coordinates.lat),
      longitude: String(coordinates.lng),
    });

    setIsCreatingLocation(true);
  };

  const handleOpenCreateLocation = () => {
    setLocationForm({
      ...EMPTY_LOCATION_FORM,
      latitude: String(DEFAULT_CENTER.lat),
      longitude: String(DEFAULT_CENTER.lng),
    });

    setSelectedLocationId(null);
    setIsCreatingEvent(false);
    setIsCreatingUser(false);
    setIsCreatingLocation(true);
    setError("");
    setNotice("");
  };

  const handleSaveLocation = async () => {
    if (!currentUser) {
      setError("Спочатку створіть профіль користувача.");
      setIsCreatingUser(true);
      return;
    }

    const latitude = parseCoordinate(locationForm.latitude);
    const longitude = parseCoordinate(locationForm.longitude);
    const entryFee = Number(locationForm.entryFee);

    if (!locationForm.name.trim()) {
      setError("Вкажіть назву спортивного майданчика.");
      return;
    }

    if (
      latitude === null ||
      longitude === null ||
      !isValidCoordinate(latitude, longitude)
    ) {
      setError("Вкажіть коректні координати майданчика.");
      return;
    }

    if (!Number.isFinite(entryFee) || entryFee < 0) {
      setError("Вартість відвідування не може бути від’ємною.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await axios.post<SportLocation>(
        `${API_URL}/api/locations`,
        {
          name: locationForm.name.trim(),
          address: locationForm.address.trim(),
          latitude,
          longitude,
          openingTime: locationForm.openingTime,
          closingTime: locationForm.closingTime,
          entryFee,
          contactInfo: locationForm.contactInfo.trim(),
          creatorId: currentUser.id,
          sportType: locationForm.sportType,
        },
      );

      const createdLocation = response.data;

      if (
        createdLocation?.id &&
        isValidCoordinate(
          createdLocation.latitude,
          createdLocation.longitude,
        )
      ) {
        setLocations((previous) => [
          ...previous,
          createdLocation,
        ]);
        setSelectedLocationId(createdLocation.id);
      } else {
        await loadLocations();
      }

      setIsCreatingLocation(false);
      setNotice("Спортивний майданчик створено.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateEvent = () => {
    if (!currentUser) {
      setError("Спочатку створіть профіль користувача.");
      setIsCreatingUser(true);
      return;
    }

    setEventForm({
      ...EMPTY_EVENT_FORM,
      ...getInitialEventTimes(),
      sportType: selectedLocation?.sportType || "FOOTBALL",
    });

    setIsCreatingEvent(true);
    setError("");
    setNotice("");
  };

  const handleSaveEvent = async () => {
    if (!selectedLocation) {
      setError("Спочатку виберіть спортивний майданчик.");
      return;
    }

    if (!currentUser) {
      setError("Спочатку створіть профіль користувача.");
      setIsCreatingUser(true);
      return;
    }

    if (!eventForm.title.trim()) {
      setError("Вкажіть назву події.");
      return;
    }

    if (!eventForm.startsAt || !eventForm.endsAt) {
      setError("Вкажіть дату та час початку й завершення.");
      return;
    }

    const startsAt = new Date(eventForm.startsAt);
    const endsAt = new Date(eventForm.endsAt);
    const maxParticipants = Number(eventForm.maxParticipants);

    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime())
    ) {
      setError("Вкажіть коректну дату та час.");
      return;
    }

    if (endsAt <= startsAt) {
      setError("Час завершення має бути пізніше часу початку.");
      return;
    }

    if (
      !Number.isInteger(maxParticipants) ||
      maxParticipants < 1
    ) {
      setError("Кількість учасників має бути щонайменше 1.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await axios.post(`${API_URL}/api/events`, {
        title: eventForm.title.trim(),
        note: eventForm.note.trim(),
        sportType: eventForm.sportType,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        maxParticipants,
        locationId: selectedLocation.id,
        organizerId: currentUser.id,
      });

      setIsCreatingEvent(false);
      await loadLocationEvents(selectedLocation.id);
      setNotice("Подію створено.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    const age = Number(userForm.age);

    if (!userForm.name.trim()) {
      setError("Вкажіть своє ім’я.");
      return;
    }

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("Вкажіть коректний вік.");
      return;
    }

    const telegramUsername = userForm.telegramUsername
      .trim()
      .replace(/^@/, "");

    setIsSaving(true);
    setError("");

    try {
      const response = await axios.post<User>(
        `${API_URL}/api/users`,
        {
          name: userForm.name.trim(),
          age,
          telegramUsername,
        },
      );

      const user = response.data;

      if (!user?.id) {
        throw new Error("Сервер не повернув ID користувача.");
      }

      localStorage.setItem("userId", user.id);
      setCurrentUser(user);
      setIsCreatingUser(false);
      setUserForm(EMPTY_USER_FORM);
      setNotice("Профіль створено.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoinEvent = async (event: SportEvent) => {
    if (!currentUser) {
      setError("Спочатку створіть профіль користувача.");
      setIsCreatingUser(true);
      return;
    }

    if (joinedEventIds.includes(event.id)) {
      setNotice("Ви вже приєдналися до цієї події.");
      return;
    }

    if (event.participantsCount >= event.maxParticipants) {
      setError("У цій події вже немає вільних місць.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await axios.post(
        `${API_URL}/api/events/${event.id}/participants`,
        { userId: currentUser.id },
      );

      const nextIds = Array.from(
        new Set([...joinedEventIds, event.id]),
      );

      localStorage.setItem(
        "joinedEventIds",
        JSON.stringify(nextIds),
      );

      setJoinedEventIds(nextIds);

      await loadLocationEvents(event.locationId);
      setNotice("Ви приєдналися до події.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveEvent = async (event: SportEvent) => {
    if (!currentUser) {
      setError("Спочатку створіть профіль користувача.");
      return;
    }

    if (!joinedEventIds.includes(event.id)) {
      setNotice("Ви не позначені як учасник цієї події.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await axios.delete(
        `${API_URL}/api/events/${event.id}/participants/${currentUser.id}`,
      );

      const nextIds = joinedEventIds.filter(
        (id) => id !== event.id,
      );

      localStorage.setItem(
        "joinedEventIds",
        JSON.stringify(nextIds),
      );

      setJoinedEventIds(nextIds);

      await loadLocationEvents(event.locationId);
      setNotice("Ви залишили подію.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    >
      <div className="relative h-[700px] min-h-[500px] w-full overflow-hidden rounded-xl border">
        <Map
          mapId={MAP_ID}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={13}
          gestureHandling="greedy"
          className="h-full w-full"
          onClick={handleMapClick}
        >
          {locations.map((location) => {
            if (
              !isValidCoordinate(
                location.latitude,
                location.longitude,
              )
            ) {
              return null;
            }

            return (
              <AdvancedMarker
                key={location.id}
                position={{
                  lat: location.latitude,
                  lng: location.longitude,
                }}
                title={location.name}
                onClick={() => {
                  setSelectedLocationId(location.id);
                  setIsCreatingLocation(false);
                  setIsCreatingEvent(false);
                  setIsCreatingUser(false);
                  setError("");
                  setNotice("");
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background">
                    <Flag className="size-5" />
                  </div>

                  <div className="whitespace-nowrap rounded-md border bg-background px-2 py-1 text-xs font-medium shadow-sm">
                    {location.name}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>

        {!selectedLocation &&
          !isCreatingLocation &&
          !isCreatingUser && (
            <Card className="absolute left-3 top-3 z-10 max-w-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Спортивні майданчики
                </CardTitle>
                <CardDescription>
                  Виберіть майданчик на карті або створіть профіль.
                  Щоб додати майданчик, натисніть на карту.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsCreatingUser(true);
                    setError("");
                    setNotice("");
                  }}
                >
                  {currentUser ? "Створити інший профіль" : "Створити профіль"}
                </Button>

                {isLoadingLocations && (
                  <p className="text-sm text-muted-foreground">
                    Завантаження майданчиків...
                  </p>
                )}

                {!isLoadingLocations && locations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Майданчиків поки немає.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

        {(error || notice) && (
          <div className="absolute left-3 right-3 top-3 z-40 sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2">
            <div
              className={`rounded-lg border bg-background p-3 text-sm shadow-lg ${error ? "border-destructive text-destructive" : ""
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p>{error || notice}</p>
                <button
                  type="button"
                  aria-label="Закрити повідомлення"
                  onClick={() => {
                    setError("");
                    setNotice("");
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isCreatingLocation && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[85%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Новий майданчик</CardTitle>
                  <CardDescription>
                    Інформація про спортивну локацію.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePanels}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Назва *</Label>
                <Input
                  value={locationForm.name}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Футбольний майданчик"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Адреса</Label>
                <Input
                  value={locationForm.address}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      address: event.target.value,
                    }))
                  }
                  placeholder="Вулиця, парк, район"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Широта</Label>
                  <Input
                    type="number"
                    value={locationForm.latitude}
                    onChange={(event) =>
                      setLocationForm((form) => ({
                        ...form,
                        latitude: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Довгота</Label>
                  <Input
                    type="number"
                    value={locationForm.longitude}
                    onChange={(event) =>
                      setLocationForm((form) => ({
                        ...form,
                        longitude: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Вид спорту</Label>
                <select
                  className={inputClassName}
                  value={locationForm.sportType}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      sportType: event.target.value,
                    }))
                  }
                >
                  {SPORTS.map((sport) => (
                    <option key={sport.value} value={sport.value}>
                      {sport.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Відкриття</Label>
                  <Input
                    type="time"
                    value={locationForm.openingTime}
                    onChange={(event) =>
                      setLocationForm((form) => ({
                        ...form,
                        openingTime: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Закриття</Label>
                  <Input
                    type="time"
                    value={locationForm.closingTime}
                    onChange={(event) =>
                      setLocationForm((form) => ({
                        ...form,
                        closingTime: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Вартість відвідування, грн</Label>
                <Input
                  type="number"
                  min={0}
                  value={locationForm.entryFee}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      entryFee: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Telegram для зв’язку</Label>
                <Input
                  value={locationForm.contactInfo}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      contactInfo: event.target.value,
                    }))
                  }
                  placeholder="@username"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveLocation}
                  disabled={isSaving || !locationForm.name.trim()}
                >
                  {isSaving ? "Збереження..." : "Створити майданчик"}
                </Button>

                <Button variant="outline" onClick={closePanels}>
                  Скасувати
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isCreatingUser && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[85%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Профіль користувача</CardTitle>
                  <CardDescription>
                    Створіть профіль для участі в подіях.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePanels}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Ім’я *</Label>
                <Input
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ваше ім’я"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Вік *</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={userForm.age}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      age: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Telegram username *</Label>
                <Input
                  value={userForm.telegramUsername}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      telegramUsername: event.target.value,
                    }))
                  }
                  placeholder="@username"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleCreateUser}
                  disabled={isSaving}
                >
                  {isSaving ? "Збереження..." : "Зберегти профіль"}
                </Button>

                <Button variant="outline" onClick={closePanels}>
                  Скасувати
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedLocation && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[75%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[420px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{selectedLocation.name}</CardTitle>
                  <CardDescription>
                    {selectedLocation.address || "Адресу не вказано"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePanels}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Clock className="mr-1 size-3" />
                  {selectedLocation.openingTime || "--:--"}–
                  {selectedLocation.closingTime || "--:--"}
                </Badge>

                <Badge variant="secondary">
                  <Wallet className="mr-1 size-3" />
                  {Number(selectedLocation.entryFee) === 0
                    ? "Безкоштовно"
                    : `${selectedLocation.entryFee} грн`}
                </Badge>

                <Badge variant="secondary">
                  {getSportLabel(selectedLocation.sportType)}
                </Badge>
              </div>

              {selectedLocation.contactInfo && (
                <p className="text-sm text-muted-foreground">
                  Telegram: {selectedLocation.contactInfo}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Події на майданчику</h3>

                <Button
                  size="sm"
                  onClick={handleOpenCreateEvent}
                  disabled={isSaving}
                >
                  <Plus className="mr-1 size-4" />
                  Створити подію
                </Button>
              </div>

              {isLoadingEvents && (
                <p className="text-sm text-muted-foreground">
                  Завантаження подій...
                </p>
              )}

              {!isLoadingEvents && locationEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  На цьому майданчику поки немає подій.
                </p>
              )}

              <div className="space-y-3">
                {locationEvents.map((event) => (
                  <div
                    key={event.id}
                    className="space-y-3 rounded-lg border p-3"
                  >
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>

                      {event.note && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {event.note}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                        {event.participantsCount}/{event.maxParticipants}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Спорт: {getSportLabel(event.sportType)}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Організатор: {event.organizerName || "Не вказано"}
                      {event.organizerTelegramUsername
                        ? ` · @${event.organizerTelegramUsername.replace(/^@/, "")}`
                        : ""}
                    </p>

                    {currentUser && (
                      <div className="flex gap-2">
                        {joinedEventIds.includes(event.id) ? (
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => handleLeaveEvent(event)}
                            disabled={isSaving}
                          >
                            Вийти
                          </Button>
                        ) : (
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => handleJoinEvent(event)}
                            disabled={
                              isSaving ||
                              event.participantsCount >=
                              event.maxParticipants
                            }
                          >
                            {event.participantsCount >=
                              event.maxParticipants
                              ? "Місць немає"
                              : "Приєднатися"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isCreatingEvent && selectedLocation && (
          <Card className="absolute inset-x-3 bottom-3 z-30 max-h-[85%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:left-4 sm:right-auto sm:w-[380px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Створення події</CardTitle>
                  <CardDescription>
                    Майданчик: {selectedLocation.name}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreatingEvent(false)}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Назва події *</Label>
                <Input
                  value={eventForm.title}
                  onChange={(event) =>
                    setEventForm((form) => ({
                      ...form,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Наприклад, Гра у футбол"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Опис</Label>
                <Textarea
                  value={eventForm.note}
                  onChange={(event) =>
                    setEventForm((form) => ({
                      ...form,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Додаткова інформація про подію"
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Вид спорту</Label>
                <select
                  className={inputClassName}
                  value={eventForm.sportType}
                  onChange={(event) =>
                    setEventForm((form) => ({
                      ...form,
                      sportType: event.target.value,
                    }))
                  }
                >
                  {EVENT_SPORTS.map((sport) => (
                    <option key={sport.value} value={sport.value}>
                      {sport.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Початок *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.startsAt}
                  onChange={(event) =>
                    setEventForm((form) => ({
                      ...form,
                      startsAt: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Завершення *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.endsAt}
                  onChange={(event) =>
                    setEventForm((form) => ({
                      ...form,
                      endsAt: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Максимум учасників *</Label>
                <Input
                  type="number"
                  min={1}
                  value={eventForm.maxParticipants}
                  onChange={(event) =>
                    setEventForm((form) => ({
                      ...form,
                      maxParticipants: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveEvent}
                  disabled={isSaving || !eventForm.title.trim()}
                >
                  {isSaving ? "Збереження..." : "Створити подію"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsCreatingEvent(false)}
                >
                  Скасувати
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </APIProvider>
  );
}