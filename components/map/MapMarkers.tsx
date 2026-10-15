
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { Flag, MapPin } from "lucide-react";

import type { Coordinates, SportLocation } from "./types";
import { normalizeCoordinates } from "./utils";

type MapMarkersProps = {
    locations: SportLocation[];
    newCoordinates: Coordinates | null;
    onSelectLocation: (location: SportLocation) => void;
};

export function MapMarkers({
    locations,
    newCoordinates,
    onSelectLocation,
}: MapMarkersProps) {
    return (
        <>
            {locations.map((location) => {
                const coordinates = normalizeCoordinates(
                    location.latitude,
                    location.longitude,
                );

                if (!coordinates) return null;

                return (
                    <AdvancedMarker
                        key={location.id}
                        position={{
                            lat: coordinates.latitude,
                            lng: coordinates.longitude,
                        }}
                        title={location.name}
                        onClick={() => onSelectLocation(location)}
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
        </>
    );
}
