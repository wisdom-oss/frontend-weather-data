import { Component, OnInit } from "@angular/core";
import { Marker } from "common";
import { dwdStationIcon } from "./map-icons";
import { WeatherDataService } from "./weather-data.service";
import { Station, DataCapability } from "./dwd-interfaces";
import { filter } from "rxjs";
import { Data } from "web-ifc-three/IFC/components/sequence/Data";

@Component({
  selector: 'lib-weather-data',
  templateUrl: "weather-data.component.html",
  styles: [
  ]
})

export class WeatherDataComponent implements OnInit {

  heightWeatherBox: string = "75vh";
  heightWeatherMap: string = (70 / 100 * parseFloat(this.heightWeatherBox)).toString() + "vh";

  // save all stations from dwd
  stations: Station[] = [];

  // save all markers from stations
  stationMarkers: Marker[] = [];

  // Kind of capabilities to use in the dwd
  capability: string[] = [DataCapability.Temperature, DataCapability.Precipitation, DataCapability.Solar];

  weatherData: any;

  historicalFiltered: boolean = false;
  temperatureFiltered: boolean = false;
  precipitationFiltered: boolean = false;
  solarHoursFiltered: boolean = false;

  object = {
    name: "Test3",
    description: "here are some information",
    otherInfo: "useless other stuff"
  }

  constructor(public weatherService: WeatherDataService) { }

  ngOnInit(): void {
    this.getAllStations();
  }

  /**
   * get all station data from dwd. 
   * safe them in stations
   */
  getAllStations(): void {
    this.weatherService.fetchStations("/").subscribe(stationData => {
      this.stations = stationData;
      this.createStationMarkers(this.stations);
      console.log(this.stations);
    });
  }

  /**
   * create map markers based on stations
   */
  createStationMarkers(stations: Station[]): void {
    this.stationMarkers = stations.map(station => {
      return {
        coordinates: station.location.coordinates,
        tooltip: this.createMarkerTooltip(station),
        icon: dwdStationIcon,
        onClick: () => this.showSingleStation(station)
      }
    })
  }

  /**
   * create a new tooltip for every station on map
   * @param station to create new tooltip from
   * @returns the tooltip as string
   */
  createMarkerTooltip(station: Station): string {

    let tooltip_base: string = `<div class="has-text-centered has-text-weight-bold">${station.name}</div>`;

    if (this.temperatureFiltered) {
      tooltip_base += this.filterTooltip(station, DataCapability.Temperature);
    }

    if (this.precipitationFiltered) {
      tooltip_base += this.filterTooltip(station, DataCapability.Precipitation);
    }

    if (this.solarHoursFiltered) {
      tooltip_base += this.filterTooltip(station, DataCapability.Solar);
    }

    return tooltip_base;
  }

  filterTooltip(station: Station, dataType: string): string {
    let res = station.capabilities
      .filter(element => element.dataType === dataType)
      .map(element => element.resolution).join("<br>");

    return `<div class="has-text-centered">
            <span class="has-text-weight-bold">${dataType}:</span> <br>
            <span class="has-text-weight-normal">${res}</span> <br>
            </div>`;
  }

  //------------------------------------------------------------------------------ Filter Stations on Map -------------------------------------------

  /**
   * filter the array of stations to accomodate the filters used
   * in last step create new station markers to make them visible.
   * filters can be activated interchangeably
   */
  showStations(): void {
    let filteredStations: Station[] = this.stations;

    if (this.historicalFiltered) {
      filteredStations = filteredStations.filter(station => {
        return !station.historical
      })
    }

    if (this.temperatureFiltered) {
      filteredStations = this.filterStationsByDataType(filteredStations, DataCapability.Temperature);
    }

    if (this.precipitationFiltered) {
      filteredStations = this.filterStationsByDataType(filteredStations, DataCapability.Precipitation);
    }

    if (this.solarHoursFiltered) {
      filteredStations = this.filterStationsByDataType(filteredStations, DataCapability.Solar);
    }

    this.createStationMarkers(filteredStations);
  }

  /**
   * searches an array of stations for every station, which holds a certain datatype in their
   * capabilities attribute
   * @param stations array to search in
   * @param dataTypeToFilter to search for
   * @returns array of stations with the searched datatype
   */
  filterStationsByDataType(stations: Station[], dataTypeToFilter: string): Station[] {
    return stations.filter((station) =>
      station.capabilities.some((capability) => capability.dataType === dataTypeToFilter)
    );
  }

  switchFilter(filterType: "historical" | DataCapability): void {

    switch (filterType) {
      case DataCapability.Temperature: {
        this.temperatureFiltered = !this.temperatureFiltered;
        break;
      }
      case DataCapability.Precipitation: {
        this.precipitationFiltered = !this.precipitationFiltered;
        console.log(this.precipitationFiltered);
        break;
      }
      case DataCapability.Solar: {
        this.solarHoursFiltered = !this.solarHoursFiltered;
        console.log(this.solarHoursFiltered);

        break;
      }
      default: {
        if (filterType === "historical") {
          this.historicalFiltered = !this.historicalFiltered;
          return;
        }
      }
    }
  }

  filterHistorical(): void {
    this.historicalFiltered = !this.historicalFiltered;
  }

  filterTemperature(): void {
    this.temperatureFiltered = !this.temperatureFiltered;
  }

  filterPrecipitation(): void {
    this.precipitationFiltered = !this.precipitationFiltered;
  }

  filterSolarHours(): void {
    this.solarHoursFiltered = !this.solarHoursFiltered;
  }

  //------------------------------------------------------------------------------ Station Tooltip and Download    ----------------------------------

  showSingleStation(station: Station): void {
    this.object.name = station.name;
    this.object.description = station.id;
    this.object.otherInfo = station.historical.toString();
  }


  //------------------------------------------------------------------------------ Request weather data by station ----------------------------------


  /**
     * test function with valid values to check api
     */
  testWeatherData(): void {
    console.log(this.stations);
    this.requestDataforStation("Oldenburg (A)", "Niedersachsen", "air_temperature", "subdaily")
    // ,"1601065435", "1701967435"
  }

  /**
   * function to request weather data from station
   * @param stationId id of station
   * @param dataPoint kind of data
   * @param timeResolution timely resolution
   * @param from first timestamp
   * @param until last timestamp
   */
  requestDataforStation(stationName: string, stationState: string, dataPoint: string, timeResolution: string, from?: string, until?: string): void {

    let id = this.searchIdFromNameAndState(stationName, stationState);

    if (id) {
      let url = this.buildUrl(id, dataPoint, timeResolution, from, until);
      console.log(url);

      if (url) {
        this.getWeatherDataByStation(url);
      } else {
        console.log("Given URL is not valid");
      }
    } else {
      console.log(`The combination of ${stationName} and ${stationState} has no ID`);
    }
  }

  /**
   * help function, not to be called directly
   * standardized processing function to build the url to retrieve stationary data
   * @param stationId to find a unique station
   * @param dataPoint kind of data to retrieve (precipitation etc.)
   * @param timeResolution timely resolution (1 min, 5 min) to find the correct data
   * @param from timestamp from when data shall be requested
   * @param until timestamp until data is requested
   * @returns if no stationID is used to safe resources
   */
  buildUrl(stationId: string, dataPoint: string, timeResolution: string, from?: string, until?: string): string | undefined {
    if (!stationId) {
      //TODO raise Error here
      console.log("No valid ID");
      return undefined;
    }

    let endpoint: string = `/${stationId}/${dataPoint}/${timeResolution}`

    if (from && until) {
      endpoint += `?from=${from}&until=${until}`;
      //TODO activate from and until
    } else {
      console.log("No period specified, request can take longer!");
    }

    return endpoint;
  }

  /**
   * help function not to be called directly
   * request the weather service for a station, time resolution and data point
   * @param url the finished url to request from
   */
  getWeatherDataByStation(url: string) {
    this.weatherService.fetchWeatherDataByStation(url.toString()).subscribe({
      //TODO Discuss with Tim
      next: (data) => {
        this.weatherData = data;
        console.log(this.weatherData);
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        console.log("Data retrieval complete");
      }
    })
  }

  /**
   * help function to find the id from a name and state
   * @param name name of the location
   * @param state of the location
   * @returns dwd id from station
   */
  searchIdFromNameAndState(name: string, state: string): string | undefined {
    let station: any;
    if (this.stations) {
      station = this.stations.find((element) => element.name === name && element.state === state);
    }
    if (station === undefined) {
      console.log("ID of: " + name + ", " + state + " not found!");
      return undefined;
    }
    return station.id;

  }

}


