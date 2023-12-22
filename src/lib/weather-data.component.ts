import { Component, ComponentFactoryResolver, OnInit } from "@angular/core";
import { Marker } from "common";
import { dwdStationIcon } from "./map-icons";
import { WeatherDataService } from "./weather-data.service";
import { Station, DataCapability, ActiveFilters } from "./dwd-interfaces";

@Component({
  selector: 'lib-weather-data',
  templateUrl: "weather-data.component.html",
  styles: [
  ]
})

export class WeatherDataComponent implements OnInit {

  //height of the component box
  heightWeatherBox: string = "90vh";
  heightWeatherMap: string = (75 / 100 * parseFloat(this.heightWeatherBox)).toString() + "vh";

  // save all stations from dwd
  stations: Station[] = [];

  // save all markers from stations
  stationMarkers: Marker[] = [];

  // single station object to show information
  station: Station | undefined;

  // Array of DataCapabilities to show as Switches
  activatedFilters: DataCapability[] = ActiveFilters;

  // saved weather data regarding a station
  weatherData: any;

  // Map of available Resolutions per DataCapability
  availableResolutions: Map<string, string[]> = new Map<string, string[]>();
  // save range of which data is available
  availableTimeSlots: string[] = [];
  // chosen DataCapability 
  usedDataType: string | undefined;
  // chosen Resolution
  usedResolution: string | undefined;
  // chosen starting timestamp
  usedFrom: string = "2023-12-20T00:00:00Z"
  // chosen end timestamp
  usedUntil: string = "2023-12-22T00:00:00Z"

  // flag if historical stations should be filtered
  historicalFiltered: boolean = false;

  // Key: DataType Attribute (Temperature) Value: True | False (Filter on/off)
  filterStates: Map<DataCapability, boolean> = new Map<DataCapability, boolean>();

  constructor(public weatherService: WeatherDataService) { }

  //------------------------------------------------------------------------------ Create Initial View -------------------------------------------

  ngOnInit(): void {
    this.setFilterMap();
    this.getAllStations();
  }

  /**
   * populates the filterMap 
   * (which determines the switches to appear for map) 
   * using the activatedFilters array
   */
  setFilterMap(): void {
    this.activatedFilters.forEach(item => {
      this.filterStates.set(item, true);
    })
  }

  /**
   * get all station data from dwd. 
   * safe them in stations
   */
  getAllStations(): void {
    this.weatherService.fetchStations("/").subscribe(stationData => {
      this.stations = stationData;
      this.showStations();
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
        tooltip: station.name,
        icon: dwdStationIcon,
        onClick: () => this.prepareStationInformation(station)
      }
    })
  }

  //------------------------------------------------------------------------------ Filter Stations on Map -------------------------------------------

  /**
   * filter list of stations to fit criteria and initiate marker creation
   */
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

  /**
   * set historical filter flag
   */
  filterHistorical(): void {
    this.historicalFiltered = !this.historicalFiltered;
  }

  //------------------------------------------------------------------------------ Show Station Information -----------------------------------------

  /**
   * when clicking a station, extracs vital information for html template.
   * Resets usedDataType and usedResolution to not show outdated information
   * @param station object clicked
   */
  prepareStationInformation(station: Station): void {
    this.station = station;

    this.activatedFilters.forEach(filter => {
      let a = station.capabilities
        .filter(element => element.dataType === filter)
        .map(element => element.resolution).sort();

      this.availableResolutions.set(filter, a);
      this.usedDataType = undefined;
      this.usedResolution = undefined;
    })
  }

  /**
   * finds the lower and upper bound of time range 
   * of specified dataType and saves them to array
   * @param dataType DataCapability to use
   * @param resolution TimeResolution to use
   */
  createRangeOfTime(dataType: string, resolution: string): void {
    if (this.station) {
      this.station?.capabilities.find(element => {
        if (element.dataType === dataType && element.resolution === resolution) {
          this.availableTimeSlots[0] = element.availableFrom;
          this.availableTimeSlots[1] = element.availableUntil;
        }
      })
    }
  }

  //------------------------------------------------------------------------------ Request weather data by station ----------------------------------

  chooseDataCapability(dataType: string): void {
    this.usedDataType = dataType;
  }

  chooseTimeResolution(resolution: string): void {
    this.usedResolution = resolution;
  }

  /**
   * function to request weather data from station.
   * uses checkUrlData to verify parameters
   * uses buildUrl to build the url-string
   * @param stationId id of station
   * @param dataPoint kind of data
   * @param timeResolution timely resolution
   * @param from first timestamp
   * @param until last timestamp
   */
  requestDataforStation(stationID: string, dataPoint?: string, timeResolution?: string, from?: string, until?: string): void {

    if (dataPoint && timeResolution) {
      if (!this.checkUrlData(stationID, dataPoint, timeResolution, from, until)) {
        return;
      }

      let url = this.buildUrl(stationID, dataPoint, timeResolution, from, until);

      if (url) {
        this.getWeatherDataByStation(url);
      } else {
        console.log("Given URL is not valid");
      }
    }


  }

  /**
   * checks if all parameters are available
   * @param stationID id of the requested station
   * @param dataPoint chosen DataCapabality
   * @param timeResolution chosen timeResolution
   * @param from chosen starting date
   * @param until chosen end date
   * @returns true if all parameter are legit, otherwise false
   */
  checkUrlData(stationID: string, dataPoint: string, timeResolution: string, from?: string, until?: string): boolean {
    if (!stationID) {
      console.log("There is no valid station id");
      return false;
    }

    if (!dataPoint) {
      console.log("No valid DataCapability chosen.");
      return false;
    }

    if (!timeResolution) {
      console.log("chosen resolution not available");
      return false;
    }

    if (from && until) {
      if (!this.checkTimeRange(from)) {
        return false;
      }
      if (!this.checkTimeRange(until)) {
        return false;
      }
    }

    return true;
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

  //------------------------------------------------------------------------------ Request weather data by station ----------------------------------

  /**
   * transform the used time format to readable one
   * @param timestamp point in time to reformat
   * @returns a classical timestamp format
   */
  formatTimestamp(timestamp: string): string {
    let date = new Date(timestamp);

    let hours = String(date.getUTCHours()).padStart(2, '0');
    let minutes = String(date.getUTCMinutes()).padStart(2, '0');
    let seconds = String(date.getUTCSeconds()).padStart(2, '0');
    let day = String(date.getUTCDate()).padStart(2, '0');
    let month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
    let year = date.getUTCFullYear();

    //
    return `${hours}:${minutes}:${seconds} ${day}.${month}.${year}`;
  }

  /**
   * 
   * @param timestamp to be converted
   * @returns time in seconds (unix timestamp)
   */
  convertTimestampToUnix(timestamp: string): string {
    let date = new Date(timestamp);
    return Math.floor(date.getTime() / 1000).toString();
  }

  /**
   * Checks if the chosen time is in the bounds of the available data
   * @param chosenTime time to check
   * @returns true when yes, otherwise false
   */
  checkTimeRange(chosenTime: string): boolean {

    //BUG lowerBound not correct

    let chosenUnix = this.convertTimestampToUnix(chosenTime);
    let lowerBound = this.convertTimestampToUnix(this.availableTimeSlots[0]);
    let upperBound = this.convertTimestampToUnix(this.availableTimeSlots[1]);


    if (chosenUnix < lowerBound) {
      console.log(`${chosenTime} is earlier in the past then: ${this.availableTimeSlots[0]}`);
      return false;
    }

    if (chosenUnix > upperBound) {
      console.log(`${chosenTime} is farther into the future then: ${this.availableTimeSlots[1]}`);
      return false;
    }

    return true;
  }


























  //------------------------------------------------------------------------------ DEPRECATED FUNCTIONS ----------------------------------

  //TODO DEPRECATED
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

  //TODO DEPRECATED
  /**
     * test function with valid values to check api
     */
  testWeatherData(): void {
    console.log(this.stations);
    this.requestDataforStation("Oldenburg (A)", "Niedersachsen", "air_temperature", "subdaily")
    // ,"1601065435", "1701967435"
  }

  //TODO DEPRECATED
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

  //TODO DEPRECATED
  filterTooltip(station: Station, dataType: string): string {
    let res = station.capabilities
      .filter(element => element.dataType === dataType)
      .map(element => element.resolution).join("<br>");

    return `<div class="has-text-centered">
            <span class="has-text-weight-bold">${dataType}:</span> <br>
            <span class="has-text-weight-normal">${res}</span> <br>
            </div>`;
  }

}


