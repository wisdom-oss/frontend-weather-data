export interface timeResolutions {
    "1_minute": string[];
    "5_minutes": string[];
    "10_minutes": string[];
    "hourly": string[];
    "subdaily": string[];
    "daily": string[];
    "monthly": string[];
    "annual": string[];
    "multi-annual": string[];
};

export type Stations = Station[];

export interface Station {
    id: string,
    name: string,
    state: string,
    location: {
        type: "Point",
        coordinates: [number, number]
    },
    // TODO: use better type
    capabilities: any
}