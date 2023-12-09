import { Component, OnInit } from "@angular/core";
import { Marker } from "common";
import { dwdStationIcon } from "./map-icons";
import { WeatherDataService } from "./weather-data.service";
import { Stations } from "./dwd-interfaces";
import { Chart } from "chart.js/auto";

@Component({
  selector: 'lib-weather-data',
  templateUrl: "weather-data.component.html",
  styles: [
  ]
})

export class WeatherDataComponent implements OnInit {

  heightWeatherBox: string = "75vh";
  heightWeatherMap: string = (80 / 100 * parseFloat(this.heightWeatherBox)).toString() + "vh";

  stations: Stations = [];
  stationMarkers: Marker[] = [];

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
    this.weatherService.getStations("/").subscribe(discovery => {
      this.stations = discovery;
      this.stationMarkers = Array.from(this.stations.map(station => {
        return {
          coordinates: station.location.coordinates,
          tooltip: station.id,
          icon: dwdStationIcon
        }
      }));
    });
  }

  /**
   * test function with valid values to check api
   */
  testWeatherData(): void {
    this.buildUrl("00044", "air_temperature", "10_minutes","1701965435", "1701967435")
  }

  /**
   * function to request weather data from station
   * @param stationId id of station
   * @param dataPoint kind of data
   * @param timeResolution timely resolution
   * @param from first timestamp
   * @param until last timestamp
   */
  requestDataforStation(stationId: string, dataPoint: string, timeResolution: string, from?: string, until?: string): void {
    let url = this.buildUrl(stationId, dataPoint, timeResolution, from, until);

    if(url) {
      this.getWeatherDataByStation(url);
    } else {
      console.log("Failed");
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
  buildUrl(stationId: string, dataPoint: string, timeResolution: string, from?: string, until?: string): string | undefined{
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
    this.weatherService.getWeatherDataByStation(url.toString()).subscribe({
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

  createBasicBarChart(): void {

    const data = [
      { year: 2010, count: 10 },
      { year: 2011, count: 20 },
      { year: 2012, count: 15 },
      { year: 2013, count: 25 },
      { year: 2014, count: 22 },
      { year: 2015, count: 30 },
      { year: 2016, count: 28 },
    ];
  
    new Chart(
      document.getElementById('weather') as HTMLCanvasElement,
      {
        type: 'bar',
        data: {
          labels: data.map(column => column.year),
          datasets: [
            {
              label: 'Acquisitions by year',
              data: data.map(column => column.count)
            }
          ]
        }
      }
    );

  }

}


