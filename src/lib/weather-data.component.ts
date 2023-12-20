import { Component, OnInit } from "@angular/core";
import { Marker } from "common";
import { dwdStationIcon } from "./map-icons";
import { WeatherDataService } from "./weather-data.service";
import { Station, DataCapability, ActiveFilters, TimeResolution } from "./dwd-interfaces";

@Component({
  selector: 'lib-weather-data',
  templateUrl: "weather-data.component.html",
  styles: [
  ]
})

export class WeatherDataComponent implements OnInit {

  heightWeatherBox: string = "80vh";
  heightWeatherMap: string = (75 / 100 * parseFloat(this.heightWeatherBox)).toString() + "vh";

  // save all stations from dwd
  stations: Station[] = [];

  // save all markers from stations
  stationMarkers: Marker[] = [];

  weatherData: any;

  historicalFiltered: boolean = false;

  // Key: DataType Attribute (Temperature) Value: True | False (Filter on/off)
  filterStates: Map<DataCapability, boolean> = new Map<DataCapability, boolean>();

  activatedFilters: DataCapability[] = ActiveFilters;

  possibleResolutions = Object.values(TimeResolution);

  station: Station | undefined;

  resolutionsPerDataType: String[] = [];

  availableResolutions: Map<DataCapability, String[]> = new Map<DataCapability, String[]>();

  constructor(public weatherService: WeatherDataService) { }

  //------------------------------------------------------------------------------ Create Initial View -------------------------------------------

  ngOnInit(): void {
    this.setFilterMap();
    this.getAllStations();
    this.getResolutionByDataType("air_temperature");
  }

  /**
   * populates the filterMap (which determines the switches to appear for map) using the activatedFilters array
   */
  setFilterMap(): void {
    this.activatedFilters.forEach(item => {
      this.filterStates.set(item, false);
    })
  }

  /**
   * get all station data from dwd. 
   * safe them in stations
   */
  getAllStations(): void {
    this.weatherService.fetchStations("/").subscribe(stationData => {
      this.stations = stationData;
      this.createStationMarkers(this.stations);
      //TODO Delete at end of session
      this.station = this.stations[0];
    });
  }

  //------------------------------------------------------------------------------ Markers and Tooltips ---------------------------------------------

  /**
   * create map markers based on stations
   */
  createStationMarkers(stations: Station[]): void {
    this.stationMarkers = stations.map(station => {
      return {
        coordinates: station.location.coordinates,
        tooltip: this.createMarkerTooltip(station),
        icon: dwdStationIcon,
        onClick: () => this.station = station
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

    this.filterStates.forEach((filterActive, filterOption) => {
      if (filterActive) {
        tooltip_base += this.filterTooltip(station, filterOption);
      }
    })

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

  showStations(): void {
    let filteredStations: Station[] = this.stations;
    if (this.historicalFiltered) {
      filteredStations = filteredStations.filter(station => {
        return !station.historical
      })
    }

    this.filterStates.forEach((filterValue, filterKey) => {
      if (filterValue) {
        filteredStations = this.filterStationsByDataType(filteredStations, filterKey);
      }
    });
    this.createStationMarkers(filteredStations);

  }

  /**
   * switches filterOption in filterStates map to reflect which filters are active
   * @param filterOption dataCapability to switch state of filtering
   */
  switchFilterOption(filterOption: DataCapability): void {
    let bool = this.filterStates.get(filterOption);
    this.filterStates.set(filterOption, !bool);
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

  filterHistorical(): void {
    this.historicalFiltered = !this.historicalFiltered;
  }

  //------------------------------------------------------------------------------ Show Station Information -----------------------------------------

  safeAvailableResolutions(): void {
    let arr: string[] = [];
    let temp: string = "";


    if (this.station) {
      this.station.capabilities.forEach(element => {
        if (element.dataType in this.activatedFilters) {
          arr.push(element.resolution);
          temp = element.dataType;
        }
      })

    }
  }

  getResolutionByDataType(type: string): void {
    let arr: TimeResolution[] = [];

    if (this.station) {
      if (type in this.activatedFilters) {
        this.station.capabilities.forEach(element => {
          if (element.dataType === type) {
            arr.push(element.resolution);
          }
        })
      }
    }

    this.resolutionsPerDataType = arr;
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


