
"use client";

import {
  APIProvider,
  Map,
} from "@vis.gl/react-google-maps";
import {
  CalendarDays,
  Clock,
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

import {
  EMPTY_EVENT_FORM,
  EMPTY_LOCATION_FORM,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_ID,
  SPORT_LABELS,
  USER_STORAGE_KEY,
} from "./constants";
import { MapMarkers } from "./MapMarkers";
import {
  INITIAL_EVENTS,
  INITIAL_LOCATIONS,
  MOCK_USERS,
} from "./mock-data";
import type {
  EventFormData,
  FieldChange,
  LocationFormData,
  PanelMode,
  SportEvent,
  SportLocation,
  SportType,
  UserProfile,
} from "./types";
import {
  formatDate,
  formatTime,
  getNextId,
  isFutureDateTime,
  normalizeCoordinates,
  sortEvents,
  toLocalDateTime,
} from "./utils";

export default function EventsMap() {
  const [locations, setLocations] =
    useState<SportLocation[]>(INITIAL_LOCATIONS);

  const [events, setEvents] =
    useState<SportEvent[]>(INITIAL_EVENTS);

  const [users] = useState<UserProfile[]>(MOCK_USERS);

  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  const [selectedLocationId, setSelectedLocationId] =
    useState<number | null>(null);

  const [newCoordinates, setNewCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationForm, setLocationForm] =
    useState<LocationFormData>(EMPTY_LOCATION_FORM);

  const [eventForm, setEventForm] =
    useState<EventFormData>(EMPTY_EVENT_FORM);

  const [panelMode, setPanelMode] = useState<PanelMode>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedUserId = localStorage.getItem(USER_STORAGE_KEY);

        let user = savedUserId
          ? MOCK_USERS.find(
            (item) => item.id === Number(savedUserId),
          )
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

  const updateLocationField: FieldChange<LocationFormData> = (
    field,
    value,
  ) => {
    setLocationForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateEventField: FieldChange<EventFormData> = (
    field,
    value,
  ) => {
    setEventForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const closePanel = () => {
    setSelectedLocationId(null);
    setNewCoordinates(null);
    setPanelMode(null);
    setErrorMessage(null);
  };

  const handleMapClick = (
    latitude: number,
    longitude: number,
  ) => {
    const coordinates = normalizeCoordinates(latitude, longitude);

    if (!coordinates) {
      setErrorMessage("Не вдалося визначити координати на карті.");
      return;
    }

    setSelectedLocationId(null);
    setNewCoordinates(coordinates);
    setLocationForm({ ...EMPTY_LOCATION_FORM });
    setEventForm({ ...EMPTY_EVENT_FORM });
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
      setErrorMessage(
        "Кількість учасників має бути цілим числом від 1.",
      );
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
    const isParticipating = event.participantIds.includes(
      currentUser.id,
    );

    if (isOrganizer) {
      setErrorMessage("Організатор не може вийти з власної гри.");
      return;
    }

    if (
      !isParticipating &&
      event.participantIds.length >= event.maxParticipants
    ) {
      setErrorMessage(
        "Вільні місця закінчилися. Виберіть іншу подію.",
      );
      return;
    }

    setErrorMessage(null);

    setEvents((previous) =>
      previous.map((item) => {
        if (item.id !== event.id) return item;

        if (item.participantIds.includes(currentUser.id)) {
          return {
            ...item,
            participantIds: item.participantIds.filter(
              (id) => id !== currentUser.id,
            ),
          };
        }

        if (
          item.participantIds.length >= item.maxParticipants
        ) {
          return item;
        }

        return {
          ...item,
          participantIds: [
            ...item.participantIds,
            currentUser.id,
          ],
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
          defaultCenter={MAP_DEFAULT_CENTER}
          defaultZoom={MAP_DEFAULT_ZOOM}
          gestureHandling="greedy"
          onClick={(event) => {
            const coordinates = event.detail.latLng;

            if (coordinates) {
              handleMapClick(
                coordinates.lat,
                coordinates.lng,
              );
            }
          }}
          className="h-full w-full"
        >
          <MapMarkers
            locations={locations}
            newCoordinates={newCoordinates}
            onSelectLocation={handleSelectLocation}
          />
        </Map>

        {panelMode === "create-location" && newCoordinates && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[90%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    Нова спортивна локація
                  </CardTitle>
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
                  disabled={
                    !locationForm.name.trim() || !currentUser
                  }
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
                    {selectedLocation.address ||
                      "Адресу не вказано"}
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
                <EventFields
                  form={eventForm}
                  onChange={updateEventField}
                  errorMessage={errorMessage}
                  onSave={handleSaveEvent}
                  onCancel={() => {
                    setPanelMode("details");
                    setErrorMessage(null);
                  }}
                />
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
                      <p>
                        Контакти: {selectedLocation.contactInfo}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">
                        Заплановані ігри ({locationEvents.length})
                      </h3>

                      <Button
                        size="sm"
                        onClick={openCreateEvent}
                      >
                        <Plus className="mr-1 size-4" />
                        Створити гру
                      </Button>
                    </div>

                    {locationEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        На цій локації ще немає запланованих ігор.
                      </p>
                    ) : (
                      locationEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          users={users}
                          currentUser={currentUser}
                          onToggleParticipation={
                            handleToggleParticipation
                          }
                        />
                      ))
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

function LocationFields({
  form,
  onChange,
}: {
  form: LocationFormData;
  onChange: FieldChange<LocationFormData>;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Назва майданчика *</Label>
        <Input
          value={form.name}
          onChange={(event) =>
            onChange("name", event.target.value)
          }
          placeholder="Наприклад, Баскетбольний майданчик"
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Адреса</Label>
        <Input
          value={form.address}
          onChange={(event) =>
            onChange("address", event.target.value)
          }
          placeholder="Вулиця, парк, район"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Вид спорту</Label>
        <SportSelect
          value={form.sportType}
          onChange={(value) => onChange("sportType", value)}
        />
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
          onChange={(event) =>
            onChange("entryFee", event.target.value)
          }
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

function EventFields({
  form,
  onChange,
  errorMessage,
  onSave,
  onCancel,
}: {
  form: EventFormData;
  onChange: FieldChange<EventFormData>;
  errorMessage: string | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Назва гри *</Label>
        <Input
          value={form.title}
          onChange={(event) =>
            onChange("title", event.target.value)
          }
          placeholder="Наприклад, Вечірній баскетбол"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Примітка</Label>
        <Textarea
          value={form.note}
          onChange={(event) =>
            onChange("note", event.target.value)
          }
          placeholder="Візьміть воду та спортивне взуття"
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Вид спорту</Label>
        <SportSelect
          value={form.sportType}
          onChange={(value) => onChange("sportType", value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Дата гри *</Label>
        <Input
          type="date"
          value={form.date}
          onChange={(event) =>
            onChange("date", event.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Початок</Label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              onChange("startTime", event.target.value)
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Завершення</Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(event) =>
              onChange("endTime", event.target.value)
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
          value={form.maxParticipants}
          onChange={(event) =>
            onChange("maxParticipants", event.target.value)
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
          onClick={onSave}
          disabled={
            !form.title.trim() ||
            !form.date ||
            !Number.isInteger(Number(form.maxParticipants)) ||
            Number(form.maxParticipants) < 1
          }
        >
          Створити гру
        </Button>

        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
      </div>
    </div>
  );
}

function SportSelect({
  value,
  onChange,
}: {
  value: SportType;
  onChange: (value: SportType) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) onChange(nextValue as SportType);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Оберіть вид спорту" />
      </SelectTrigger>

      <SelectContent>
        {Object.entries(SPORT_LABELS).map(([sport, label]) => (
          <SelectItem key={sport} value={sport}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EventCard({
  event,
  users,
  currentUser,
  onToggleParticipation,
}: {
  event: SportEvent;
  users: UserProfile[];
  currentUser: UserProfile | null;
  onToggleParticipation: (event: SportEvent) => void;
}) {
  const participantsCount = event.participantIds.length;

  const isParticipating =
    currentUser !== null &&
    event.participantIds.includes(currentUser.id);

  const isOrganizer =
    currentUser !== null &&
    event.organizerId === currentUser.id;

  const isFull = participantsCount >= event.maxParticipants;

  const organizer =
    users.find((user) => user.id === event.organizerId) ??
    (currentUser?.id === event.organizerId
      ? currentUser
      : undefined);

  const participantNames = event.participantIds.map(
    (id) =>
      users.find((user) => user.id === id)?.name ??
      (currentUser?.id === id ? currentUser.name : "Учасник"),
  );

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <h4 className="font-semibold">{event.title}</h4>

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
        {participantNames.length > 0
          ? participantNames.join(", ")
          : "Поки що немає"}
      </p>

      {isOrganizer ? (
        <p className="text-sm text-muted-foreground">
          Ви організатор цієї гри.
        </p>
      ) : (
        <Button
          className="w-full"
          variant={isParticipating ? "outline" : "default"}
          disabled={!isParticipating && isFull}
          onClick={() => onToggleParticipation(event)}
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
}
