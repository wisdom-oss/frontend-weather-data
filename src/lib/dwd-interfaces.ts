/**
 * station object
 */
export interface Station {
    id: string;
    name: string;
    state: string;
    location: {
        type: "Point",
        coordinates: [number, number]
    };
    historical: boolean;
    capabilities: {
        dataType: string;
        resolution: TimeResolution;
        availableFrom: string; // Assuming ISO 8601 date-time format, example: "2023-01-01T00:00:00Z"
        availableUntil: string; // Assuming ISO 8601 date-time format, example: "2023-02-01T00:00:00Z"
    }[];
}

/**
 * possible time resolutions
 */
export enum TimeResolution {
    OneMinute = "1_minute",
    FiveMinutes = "5_minutes",
    TenMinutes = "10_minutes",
    Hourly = "hourly",
    Subdaily = "subdaily",
    Daily = "daily",
    Monthly = "monthly",
    Annual = "annual",
    MultiAnnual = "multi_annual",
}

/**
 * possible time resolutions
 */
export enum DataCapability {
    Temperature = "air_temperature",
    Precipitation = "precipitation",
    Solar = "solar",
    SoilTemperature = "soil_temperature",
    Wind = "wind",
    Sun = "sun",
    Moisture = "moisture",
    Cloudiness = "cloudiness",
    Pressure = "pressure",
    ExtremeTemperature = "extreme_temperatures", // not working
    ExtremeWind = "extreme_wind",
    TestWind = "wind_test",
    ClimateIndices = "climate_indices", // not working
    KL = "kl",
    MorePrecipitation = "more_precip",
    WeatherPhenomena = "weather_phenomena",
    MoreWeatherPhenomena = "more_weather_phenomena",
    WaterEquivalent = "water_equiv",
    CloudType = "cloud_type",
    DewPoint = "dew_point",
    Visibility = "visibility",
    WindSynop = "wind_synop",
    Soil = "soil"
}

export const ActiveFilters: DataCapability[] = [
    DataCapability.Temperature,
    DataCapability.Precipitation,
    DataCapability.Solar,
    DataCapability.Soil,
    DataCapability.Pressure,
    DataCapability.Moisture,
    DataCapability.Cloudiness,
    DataCapability.Wind
]