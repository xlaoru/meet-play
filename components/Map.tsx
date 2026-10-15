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
  Pencil,
  Plus,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

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

type SportLocation = {
  id: string;
  name: string;
  address: string;
  openingHours: string;
  priceType: "free" | "paid";
  price: string;
  ownerName: string;
  phone: string;
  telegram: string;
  lat: number;
  lng: number;
  createdBy: string;
};

type SportEvent = {
  id: string;
  locationId: string;
  title: string;
  note: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  participantIds: string[];
  createdBy: string;
};

type LocationForm = Pick<
  SportLocation,
  | "name"
  | "address"
  | "openingHours"
  | "priceType"
  | "price"
  | "ownerName"
  | "phone"
  | "telegram"
>;

type EventForm = Pick<
  SportEvent,
  "title" | "note" | "date" | "startTime" | "endTime"
> & {
  maxParticipants: string;
};

type PanelMode = "details" | "edit-location" | null;

const CURRENT_USER_ID = "user-illia";
const MAP_ID = "DEMO_MAP_ID";

const MOCK_USERS: Record<string, string> = {
  "user-illia": "Ілля",
  "user-vania": "Ваня",
  "user-sasha": "Саша",
  "user-demo": "Демо-користувач",
};

const INITIAL_LOCATIONS: SportLocation[] = [
  {
    id: "location-1",
    name: "Резинка",
    address: "Парк Глоби, Дніпро",
    openingHours: "08:00–19:00",
    priceType: "free",
    price: "",
    ownerName: "Сторож",
    phone: "+380XXXXXXXXX",
    telegram: "@owner",
    lat: 48.4647,
    lng: 35.0462,
    createdBy: CURRENT_USER_ID,
  },
  {
    id: "location-2",
    name: "Стріт-майданчик",
    address: "Центральний район, Дніпро",
    openingHours: "08:00–21:00",
    priceType: "paid",
    price: "100 грн",
    ownerName: "Адміністратор",
    phone: "+380XXXXXXXXX",
    telegram: "@sports_admin",
    lat: 48.468,
    lng: 35.04,
    createdBy: "user-demo",
  },
];

const INITIAL_EVENTS: SportEvent[] = [
  {
    id: "event-1",
    locationId: "location-1",
    title: "Футбол",
    note: "Візьміть футбольний м’яч",
    date: "2027-06-21",
    startTime: "14:00",
    endTime: "15:30",
    maxParticipants: 10,
    participantIds: [
      CURRENT_USER_ID,
      "user-vania",
      "user-sasha",
    ],
    createdBy: CURRENT_USER_ID,
  },
  {
    id: "event-2",
    locationId: "location-1",
    title: "Стрітбол",
    note: "Візьміть воду",
    date: "2027-06-22",
    startTime: "17:00",
    endTime: "18:00",
    maxParticipants: 6,
    participantIds: ["user-vania"],
    createdBy: "user-demo",
  },
];

const EMPTY_LOCATION_FORM: LocationForm = {
  name: "",
  address: "",
  openingHours: "08:00–19:00",
  priceType: "free",
  price: "",
  ownerName: "",
  phone: "",
  telegram: "",
};

const EMPTY_EVENT_FORM: EventForm = {
  title: "",
  note: "",
  date: "",
  startTime: "14:00",
  endTime: "15:30",
  maxParticipants: "10",
};

function formatDate(date: string | undefined | null) {
  if (!date) {
    return "Дату не вказано";
  }

  const parsedDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Некоректна дата";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

function sortEvents(events: SportEvent[]) {
  return [...events].sort((a, b) =>
    `${a.date}T${a.startTime}`.localeCompare(
      `${b.date}T${b.startTime}`,
    ),
  );
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
          placeholder="Наприклад, Резинка"
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Адреса</Label>
        <Input
          value={form.address}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="Парк, вулиця, район"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Години роботи</Label>
        <Input
          value={form.openingHours}
          onChange={(event) =>
            onChange("openingHours", event.target.value)
          }
          placeholder="08:00–19:00"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Вартість відвідування</Label>
        <Select
          value={form.priceType}
          onValueChange={(value: "free" | "paid" | null) => {
            if (value !== null) onChange("priceType", value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Оберіть вартість" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Безкоштовно</SelectItem>
            <SelectItem value="paid">Платно</SelectItem>
          </SelectContent>
        </Select>

        {form.priceType === "paid" && (
          <Input
            value={form.price}
            onChange={(event) => onChange("price", event.target.value)}
            placeholder="Наприклад, 100 грн"
          />
        )}
      </div>

      <Separator />

      <p className="text-sm font-medium">Контакти власника</p>

      <div className="space-y-1.5">
        <Label>Ім’я або назва</Label>
        <Input
          value={form.ownerName}
          onChange={(event) => onChange("ownerName", event.target.value)}
          placeholder="Ім’я власника"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Номер телефону</Label>
        <Input
          value={form.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="+380..."
        />
      </div>

      <div className="space-y-1.5">
        <Label>Telegram</Label>
        <Input
          value={form.telegram}
          onChange={(event) => onChange("telegram", event.target.value)}
          placeholder="@username"
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

  const [selectedLocationId, setSelectedLocationId] =
    useState<string | null>(null);
  const [newCoordinates, setNewCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [locationForm, setLocationForm] =
    useState<LocationForm>(EMPTY_LOCATION_FORM);
  const [eventForm, setEventForm] =
    useState<EventForm>(EMPTY_EVENT_FORM);

  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

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
    setLocationForm((form) => ({ ...form, [field]: value }));
  };

  const updateEventField = <K extends keyof EventForm>(
    field: K,
    value: EventForm[K],
  ) => {
    setEventForm((form) => ({ ...form, [field]: value }));
  };

  const closePanel = () => {
    setSelectedLocationId(null);
    setPanelMode(null);
    setIsEventFormOpen(false);
    setEditingEventId(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    closePanel();
    setNewCoordinates({ lat, lng });
    setLocationForm(EMPTY_LOCATION_FORM);
    setIsCreatingLocation(true);
  };

  const handleSelectLocation = (location: SportLocation) => {
    setSelectedLocationId(location.id);
    setNewCoordinates(null);
    setIsCreatingLocation(false);
    setPanelMode("details");
    setIsEventFormOpen(false);
    setEditingEventId(null);
  };

  const handleSaveLocation = () => {
    if (!locationForm.name.trim() || !newCoordinates) return;

    const newLocation: SportLocation = {
      id: crypto.randomUUID(),
      ...locationForm,
      name: locationForm.name.trim(),
      address: locationForm.address.trim(),
      openingHours: locationForm.openingHours.trim(),
      price: locationForm.price.trim(),
      ownerName: locationForm.ownerName.trim(),
      phone: locationForm.phone.trim(),
      telegram: locationForm.telegram.trim(),
      ...newCoordinates,
      createdBy: CURRENT_USER_ID,
    };

    setLocations((previous) => [...previous, newLocation]);
    setSelectedLocationId(newLocation.id);
    setNewCoordinates(null);
    setIsCreatingLocation(false);
    setPanelMode("details");
  };

  const handleUpdateLocation = () => {
    if (!selectedLocation || !locationForm.name.trim()) return;

    setLocations((previous) =>
      previous.map((location) =>
        location.id === selectedLocation.id
          ? {
            ...location,
            ...locationForm,
            name: locationForm.name.trim(),
            address: locationForm.address.trim(),
            openingHours: locationForm.openingHours.trim(),
            price: locationForm.price.trim(),
            ownerName: locationForm.ownerName.trim(),
            phone: locationForm.phone.trim(),
            telegram: locationForm.telegram.trim(),
          }
          : location,
      ),
    );

    setPanelMode("details");
  };

  const handleDeleteLocation = (locationId: string) => {
    if (
      !window.confirm(
        "Видалити майданчик разом з усіма його подіями?",
      )
    ) {
      return;
    }

    setLocations((previous) =>
      previous.filter(({ id }) => id !== locationId),
    );
    setEvents((previous) =>
      previous.filter(({ locationId: id }) => id !== locationId),
    );

    closePanel();
  };

  const openCreateEvent = () => {
    setEventForm(EMPTY_EVENT_FORM);
    setEditingEventId(null);
    setIsEventFormOpen(true);
  };

  const handleSaveEvent = () => {
    if (!selectedLocation || !eventForm.title.trim() || !eventForm.date) {
      return;
    }

    const maxParticipants = Number(eventForm.maxParticipants);

    if (!Number.isInteger(maxParticipants) || maxParticipants < 1) {
      return;
    }

    if (editingEventId) {
      setEvents((previous) =>
        previous.map((event) =>
          event.id === editingEventId &&
            event.createdBy === CURRENT_USER_ID
            ? {
              ...event,
              title: eventForm.title.trim(),
              note: eventForm.note.trim(),
              date: eventForm.date,
              startTime: eventForm.startTime,
              endTime: eventForm.endTime,
              maxParticipants,
            }
            : event,
        ),
      );
    } else {
      const newEvent: SportEvent = {
        id: crypto.randomUUID(),
        locationId: selectedLocation.id,
        title: eventForm.title.trim(),
        note: eventForm.note.trim(),
        date: eventForm.date,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        maxParticipants,
        participantIds: [CURRENT_USER_ID],
        createdBy: CURRENT_USER_ID,
      };

      setEvents((previous) => [...previous, newEvent]);
    }

    setEventForm(EMPTY_EVENT_FORM);
    setEditingEventId(null);
    setIsEventFormOpen(false);
    setPanelMode("details");
  };

  const handleEditEvent = (event: SportEvent) => {
    if (event.createdBy !== CURRENT_USER_ID) return;

    setEventForm({
      title: event.title,
      note: event.note,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      maxParticipants: String(event.maxParticipants),
    });

    setEditingEventId(event.id);
    setIsEventFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((previous) =>
      previous.filter(
        (event) =>
          event.id !== eventId ||
          event.createdBy !== CURRENT_USER_ID,
      ),
    );
  };

  const handleToggleParticipation = (event: SportEvent) => {
    const isParticipating =
      event.participantIds.includes(CURRENT_USER_ID);

    if (
      !isParticipating &&
      event.participantIds.length >= event.maxParticipants
    ) {
      return;
    }

    setEvents((previous) =>
      previous.map((item) => {
        if (item.id !== event.id) return item;

        return {
          ...item,
          participantIds: isParticipating
            ? item.participantIds.filter(
              (id) => id !== CURRENT_USER_ID,
            )
            : [...item.participantIds, CURRENT_USER_ID],
        };
      }),
    );
  };

  const handleEditLocationClick = () => {
    if (!selectedLocation) return;

    setLocationForm({
      name: selectedLocation.name,
      address: selectedLocation.address,
      openingHours: selectedLocation.openingHours,
      priceType: selectedLocation.priceType,
      price: selectedLocation.price,
      ownerName: selectedLocation.ownerName,
      phone: selectedLocation.phone,
      telegram: selectedLocation.telegram,
    });

    setPanelMode("edit-location");
  };

  const isEditingLocation = panelMode === "edit-location";

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
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
          {locations.map((location) => (
            <AdvancedMarker
              key={location.id}
              position={{
                lat: location.lat,
                lng: location.lng,
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
          ))}

          {newCoordinates && (
            <AdvancedMarker
              position={newCoordinates}
              title="Нова локація"
            >
              <div className="flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-md">
                <MapPin className="size-5" />
              </div>
            </AdvancedMarker>
          )}
        </Map>

        {isCreatingLocation && newCoordinates && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[85%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px]">
            <CardHeader>
              <CardTitle>Нова спортивна локація</CardTitle>
              <CardDescription>
                Вкажіть дані майданчика. Координати вибрано на карті.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <LocationFields
                form={locationForm}
                onChange={updateLocationField}
              />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveLocation}
                  disabled={!locationForm.name.trim()}
                >
                  Створити майданчик
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingLocation(false);
                    setNewCoordinates(null);
                  }}
                >
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
                    {isEditingLocation
                      ? "Редагувати майданчик"
                      : editingEventId
                        ? "Редагувати гру"
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
              {isEditingLocation ? (
                <>
                  <LocationFields
                    form={locationForm}
                    onChange={updateLocationField}
                  />

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleUpdateLocation}
                      disabled={!locationForm.name.trim()}
                    >
                      Зберегти зміни
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setPanelMode("details")}
                    >
                      Скасувати
                    </Button>
                  </div>
                </>
              ) : isEventFormOpen ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Назва гри *</Label>
                    <Input
                      value={eventForm.title}
                      onChange={(event) =>
                        updateEventField("title", event.target.value)
                      }
                      placeholder="Наприклад, Гра у футбол"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Примітка</Label>
                    <Textarea
                      value={eventForm.note}
                      onChange={(event) =>
                        updateEventField("note", event.target.value)
                      }
                      placeholder="Візьміть футбольний м’яч"
                      rows={2}
                    />
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
                          updateEventField("startTime", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Завершення</Label>
                      <Input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(event) =>
                          updateEventField("endTime", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Максимум учасників</Label>
                    <Input
                      type="number"
                      min={1}
                      value={eventForm.maxParticipants}
                      onChange={(event) =>
                        updateEventField(
                          "maxParticipants",
                          event.target.value,
                        )
                      }
                    />
                  </div>

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
                      {editingEventId ? "Зберегти" : "Створити гру"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEventFormOpen(false);
                        setEditingEventId(null);
                        setEventForm(EMPTY_EVENT_FORM);
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
                      {selectedLocation.openingHours}
                    </p>

                    <p className="flex items-center gap-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      {selectedLocation.priceType === "free"
                        ? "Безкоштовно"
                        : selectedLocation.price || "Платно"}
                    </p>

                    {selectedLocation.ownerName && (
                      <p>Власник: {selectedLocation.ownerName}</p>
                    )}

                    {selectedLocation.phone && (
                      <p>Телефон: {selectedLocation.phone}</p>
                    )}

                    {selectedLocation.telegram && (
                      <p>Telegram: {selectedLocation.telegram}</p>
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
                        const isParticipating =
                          event.participantIds.includes(CURRENT_USER_ID);
                        const isFull =
                          event.participantIds.length >=
                          event.maxParticipants;

                        return (
                          <div
                            key={event.id}
                            className="space-y-3 rounded-lg border p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
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

                              {event.createdBy === CURRENT_USER_ID && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditEvent(event)}
                                    aria-label="Редагувати гру"
                                  >
                                    <Pencil className="size-4" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDeleteEvent(event.id)
                                    }
                                    aria-label="Видалити гру"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                <CalendarDays className="mr-1 size-3" />
                                {formatDate(event.date)}
                              </Badge>

                              <Badge variant="secondary">
                                <Clock className="mr-1 size-3" />
                                {event.startTime}–{event.endTime}
                              </Badge>

                              <Badge variant="secondary">
                                <Users className="mr-1 size-3" />
                                {event.participantIds.length}/
                                {event.maxParticipants}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              Учасники:{" "}
                              {event.participantIds.length
                                ? event.participantIds
                                  .map(
                                    (id) => MOCK_USERS[id] ?? "Учасник",
                                  )
                                  .join(", ")
                                : "Поки що немає"}
                            </p>

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
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedLocation.createdBy === CURRENT_USER_ID && (
                    <>
                      <Separator />

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleEditLocationClick}
                        >
                          <Pencil className="mr-2 size-4" />
                          Редагувати майданчик
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() =>
                            handleDeleteLocation(selectedLocation.id)
                          }
                          aria-label="Видалити майданчик"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </APIProvider>
  );
}