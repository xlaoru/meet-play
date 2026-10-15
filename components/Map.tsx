"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map
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

type LocationForm = {
  name: string;
  address: string;
  openingHours: string;
  priceType: "free" | "paid";
  price: string;
  ownerName: string;
  phone: string;
  telegram: string;
};

type EventForm = {
  title: string;
  note: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: string;
};

const CURRENT_USER_ID = "user-illia";

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
    createdBy: "user-illia",
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
    participantIds: ["user-illia", "user-vania", "user-sasha"],
    createdBy: "user-illia",
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

const MAP_ID = "DEMO_MAP_ID";

function formatDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function EventsMap() {
  const [locations, setLocations] =
    useState<SportLocation[]>(INITIAL_LOCATIONS);
  const [events, setEvents] = useState<SportEvent[]>(INITIAL_EVENTS);
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
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ?? null;

  const locationEvents = selectedLocation
    ? events
      .filter((event) => event.locationId === selectedLocation.id)
      .sort((a, b) =>
        `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
      )
    : [];

  const closeLocationPanel = () => {
    setSelectedLocationId(null);
    setIsCreatingEvent(false);
    setIsEventFormOpen(false);
    setEditingEventId(null);
    setIsEditingLocation(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocationId(null);
    setNewCoordinates({ lat, lng });
    setLocationForm(EMPTY_LOCATION_FORM);
    setIsCreatingLocation(true);
    setIsEditingLocation(false);
    setIsCreatingEvent(false);
    setEditingEventId(null);
  };

  const handleSaveLocation = () => {
    if (!locationForm.name.trim() || !newCoordinates) return;

    const newLocation: SportLocation = {
      id: crypto.randomUUID(),
      name: locationForm.name.trim(),
      address: locationForm.address.trim(),
      openingHours: locationForm.openingHours.trim(),
      priceType: locationForm.priceType,
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
            price: locationForm.price.trim(),
            ownerName: locationForm.ownerName.trim(),
            phone: locationForm.phone.trim(),
            telegram: locationForm.telegram.trim(),
          }
          : location,
      ),
    );
    setIsEditingLocation(false);
  };

  const handleDeleteLocation = (locationId: string) => {
    const confirmed = window.confirm(
      "Видалити майданчик разом з усіма його подіями?",
    );
    if (!confirmed) return;

    setLocations((previous) =>
      previous.filter((location) => location.id !== locationId),
    );
    setEvents((previous) =>
      previous.filter((event) => event.locationId !== locationId),
    );
    closeLocationPanel();
  };

  const openCreateEvent = () => {
    setEventForm(EMPTY_EVENT_FORM);
    setEditingEventId(null);
    setIsCreatingEvent(true);
    setIsEventFormOpen(true);
  };

  const handleSaveEvent = () => {
    if (!selectedLocation || !eventForm.title.trim() || !eventForm.date) {
      return;
    }

    const maxParticipants = Number(eventForm.maxParticipants);
    if (!Number.isInteger(maxParticipants) || maxParticipants < 1) return;

    if (editingEventId) {
      setEvents((previous) =>
        previous.map((event) =>
          event.id === editingEventId && event.createdBy === CURRENT_USER_ID
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

    setIsCreatingEvent(true);
    setIsEventFormOpen(false);
    setEditingEventId(null);
    setEventForm(EMPTY_EVENT_FORM);
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
    setIsCreatingEvent(true);
    setIsEventFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((previous) =>
      previous.filter(
        (event) =>
          event.id !== eventId || event.createdBy !== CURRENT_USER_ID,
      ),
    );
  };

  const handleToggleParticipation = (event: SportEvent) => {
    const isParticipating = event.participantIds.includes(CURRENT_USER_ID);
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
            ? item.participantIds.filter((id) => id !== CURRENT_USER_ID)
            : [...item.participantIds, CURRENT_USER_ID],
        };
      }),
    );
  };

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
              position={{ lat: location.lat, lng: location.lng }}
              title={location.name}
              onClick={() => {
                setSelectedLocationId(location.id);
                setNewCoordinates(null);
                setIsCreatingLocation(false);
                setIsCreatingEvent(true);
                setIsEventFormOpen(false);
                setIsEditingLocation(false);
                setEditingEventId(null);
              }}
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
            <AdvancedMarker position={newCoordinates} title="Нова локація">
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
              <div className="space-y-1.5">
                <Label>Назва майданчика *</Label>
                <Input
                  value={locationForm.name}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Наприклад, Резинка"
                  maxLength={100}
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
                  placeholder="Парк, вулиця, район"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Години роботи</Label>
                <Input
                  value={locationForm.openingHours}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      openingHours: event.target.value,
                    }))
                  }
                  placeholder="08:00–19:00"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Вартість відвідування</Label>
                <Select
                  value={locationForm.priceType}
                  onValueChange={(value: "free" | "paid" | null) => {
                    if (value === null) return;

                    setLocationForm((form) => ({
                      ...form,
                      priceType: value,
                    }));
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
                {locationForm.priceType === "paid" && (
                  <Input
                    value={locationForm.price}
                    onChange={(event) =>
                      setLocationForm((form) => ({
                        ...form,
                        price: event.target.value,
                      }))
                    }
                    placeholder="Наприклад, 100 грн"
                  />
                )}
              </div>

              <Separator />

              <p className="text-sm font-medium">Контакти власника</p>

              <div className="space-y-1.5">
                <Label>Ім’я або назва</Label>
                <Input
                  value={locationForm.ownerName}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      ownerName: event.target.value,
                    }))
                  }
                  placeholder="Ім’я власника"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Номер телефону</Label>
                <Input
                  value={locationForm.phone}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+380..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Telegram</Label>
                <Input
                  value={locationForm.telegram}
                  onChange={(event) =>
                    setLocationForm((form) => ({
                      ...form,
                      telegram: event.target.value,
                    }))
                  }
                  placeholder="@username"
                />
              </div>

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

        {selectedLocation && (isEditingLocation || isCreatingEvent) && (
          <Card className="absolute inset-x-3 bottom-3 z-20 max-h-[90%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[420px]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    {isEditingLocation
                      ? "Редагувати майданчик"
                      : isCreatingEvent
                        ? editingEventId
                          ? "Редагувати гру"
                          : `Ігри: ${selectedLocation.name}`
                        : selectedLocation.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedLocation.address || "Адресу не вказано"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditingLocation(false);
                    setIsCreatingEvent(false);
                    setEditingEventId(null);
                  }}
                  aria-label="Закрити"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {isEditingLocation ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Назва майданчика *</Label>
                    <Input
                      value={locationForm.name}
                      onChange={(event) =>
                        setLocationForm((form) => ({
                          ...form,
                          name: event.target.value,
                        }))
                      }
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
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Години роботи</Label>
                    <Input
                      value={locationForm.openingHours}
                      onChange={(event) =>
                        setLocationForm((form) => ({
                          ...form,
                          openingHours: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Вартість</Label>
                    <Select
                      value={locationForm.priceType}
                      onValueChange={(value: "free" | "paid" | null) => {
                        if (value === null) return;

                        setLocationForm((form) => ({
                          ...form,
                          priceType: value,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Безкоштовно</SelectItem>
                        <SelectItem value="paid">Платно</SelectItem>
                      </SelectContent>
                    </Select>
                    {locationForm.priceType === "paid" && (
                      <Input
                        value={locationForm.price}
                        onChange={(event) =>
                          setLocationForm((form) => ({
                            ...form,
                            price: event.target.value,
                          }))
                        }
                        placeholder="Наприклад, 100 грн"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Контакт власника</Label>
                    <Input
                      value={locationForm.ownerName}
                      onChange={(event) =>
                        setLocationForm((form) => ({
                          ...form,
                          ownerName: event.target.value,
                        }))
                      }
                      placeholder="Ім’я власника"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Номер телефону</Label>
                    <Input
                      value={locationForm.phone}
                      onChange={(event) =>
                        setLocationForm((form) => ({
                          ...form,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="+380..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telegram</Label>
                    <Input
                      value={locationForm.telegram}
                      onChange={(event) =>
                        setLocationForm((form) => ({
                          ...form,
                          telegram: event.target.value,
                        }))
                      }
                      placeholder="@username"
                    />
                  </div>
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
                      onClick={() => setIsEditingLocation(false)}
                    >
                      Скасувати
                    </Button>
                  </div>
                </>
              ) : isCreatingEvent ? (
                <>
                  {!isEventFormOpen && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Заплановані ігри</p>
                    </div>
                  )}

                  {isEventFormOpen && (
                    <div className="space-y-3 rounded-lg border p-3">
                      <div className="space-y-1.5">
                        <Label>Назва гри *</Label>
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
                        <Label>Примітка</Label>
                        <Textarea
                          value={eventForm.note}
                          onChange={(event) =>
                            setEventForm((form) => ({
                              ...form,
                              note: event.target.value,
                            }))
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
                            setEventForm((form) => ({
                              ...form,
                              date: event.target.value,
                            }))
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
                              setEventForm((form) => ({
                                ...form,
                                startTime: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Завершення</Label>
                          <Input
                            type="time"
                            value={eventForm.endTime}
                            onChange={(event) =>
                              setEventForm((form) => ({
                                ...form,
                                endTime: event.target.value,
                              }))
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
                          disabled={
                            !eventForm.title.trim() ||
                            !eventForm.date ||
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
                          }}
                        >
                          Скасувати
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isEventFormOpen && (
                    <div className="space-y-3">
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
                                  <h3 className="font-semibold">
                                    {event.title}
                                  </h3>
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

                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
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

                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Учасники
                                </p>
                                <p className="text-sm">
                                  {event.participantIds.length
                                    ? event.participantIds
                                      .map((id) => MOCK_USERS[id] ?? "Учасник")
                                      .join(", ")
                                    : "Поки що ніхто не приєднався"}
                                </p>
                              </div>

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
                  )}
                  <Button size="sm" onClick={openCreateEvent}>
                    <Plus className="mr-1 size-4" />
                    Нова гра
                  </Button>
                </>
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

                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setIsCreatingEvent(true);
                        setIsEventFormOpen(false);
                      }}
                    >
                      <CalendarDays className="mr-2 size-4" />
                      Переглянути ігри
                    </Button>
                    {selectedLocation.createdBy === CURRENT_USER_ID && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
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
                            setIsEditingLocation(true);
                          }}
                          aria-label="Редагувати майданчик"
                        >
                          <Pencil className="size-4" />
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
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </APIProvider>
  );
}
