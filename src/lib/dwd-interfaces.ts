/**
 * station object
 */
export interface Station {
    id: string;
    name: string;
    state: string;
    location: {
        type: "Point";
        coordinates: [number, number];
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
 * possible data types
 */
export enum DataCapability {
    Temperature = "air_temperature",
    Precipitation = "precipitation",
    Moisture = "moisture",
    Pressure = "pressure",
    DewPoint = "dew_point",
    Soil = "soil",
    SoilTemperature = "soil_temperature",
    Solar = "solar",
    Sun = "sun",
    Visibility = "visibility",
    Wind = "wind",
    ExtremeWind = "extreme_wind",
    TestWind = "wind_test",
    CloudType = "cloud_type",
    Cloudiness = "cloudiness",
    MorePrecipitation = "more_precip",
    KL = "kl",
    WeatherPhenomena = "weather_phenomena",
    MoreWeatherPhenomena = "more_weather_phenomena",
    WaterEquivalent = "water_equiv",
    WindSynop = "wind_synop",
    ClimateIndices = "climate_indices", // not working
    ExtremeTemperature = "extreme_temperatures", // not working
}

/**
 * array of active filters
 * for every element a switch will be created filtering 
 * weather map based on the element
 */
export const ActiveFilters: DataCapability[] = [
    DataCapability.Temperature,
    DataCapability.Precipitation,
    DataCapability.Solar,
    DataCapability.Moisture,
    DataCapability.Pressure,
    DataCapability.DewPoint,
    DataCapability.Visibility,
    DataCapability.Soil
];
