import { Component, OnInit } from "@angular/core";
import { Marker } from "common";
import { dwdStationIcon } from "./map-icons";
import { WeatherDataService } from "./weather-data.service";
import { Stations, Station } from "./dwd-interfaces";

@Component({
  selector: 'lib-weather-data',
  templateUrl: "weather-data.component.html",
  styles: [
  ]
})

export class WeatherDataComponent implements OnInit {

  heightWeatherBox: string = "75vh";
  heightWeatherMap: string = (70 / 100 * parseFloat(this.heightWeatherBox)).toString() + "vh";

  stations: Stations = [];
  stationMarkers: Marker[] = [];

  // temporary list of shown capabilities
  capability_filters: Array<string> = ["air_temperature", "precipitation", "solar"];

  weatherData: any;

  constructor(public weatherService: WeatherDataService) { }

  ngOnInit(): void {
    this.getStations();
  }

  /**
   * get all stations from dwd. 
   * safe them in stations and add additional info in stationMarkers
   * Used in map to display stations
   */
  getStations(): void {
    this.weatherService.fetchStations("/").subscribe(stationData => {
      this.stations = stationData;
      this.createStationMarkers(this.stations);
      console.log(this.stations);
    });
  }

  /**
   * help function to create markers on map of dwd component
   */
  createStationMarkers(stations: Stations): void {
    this.stationMarkers = stations.map(station => {
      return {
        coordinates: station.location.coordinates,
        tooltip: station.name,
        icon: dwdStationIcon,
        onClick: () => console.log("works")
      }
    })
  }

  createMarkerTooltip(station: Station): string {

    let capabilities_string: string = "";

    //this.capability_filters.forEach(element => {
    //  let temp: string = `${element}: ${(station.capabilities)[element]} <br>`;
    // capabilities_string += temp;
    //})

    //TODO center station.name (list with heading)
    let tooltip_base: string = `${station.name} <br> ${capabilities_string}`;




    return tooltip_base;
  }

  //------------------------------------------------------------------------------ Filter Stations on Map -------------------------------------------

  /**
   * onClick Event, to push a filter param to an array or remove from it
   * @param param the param to add/remove
   */
  toggleCapability(param: string): void {

    if (this.capability_filters.includes(param)) {
      this.capability_filters.splice(this.capability_filters.indexOf(param), 1);
    } else {
      this.capability_filters.push(param);
    }

    console.log(this.capability_filters);
  }

  getStationFilter(): void {

    let filteredList = this.stations.filter(s => {
      const stationKeys = Object.keys(s.capabilities);
      return this.capability_filters.every(key => stationKeys.includes(key));
    });


    if (filteredList.length) {
      this.createStationMarkers(filteredList);
    } else {
      this.createStationMarkers(this.stations);
    }


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


