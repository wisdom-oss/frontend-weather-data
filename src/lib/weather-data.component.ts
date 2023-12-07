import { Component, OnInit } from "@angular/core";
import { Marker } from "common";
import { dwdStationIcon } from "./map-icons";
import { WeatherDataService } from "./weather-data.service";
import { Stations } from "./dwd-interfaces";

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

  possibleResolutions!: any;

  constructor(public weatherService: WeatherDataService) { }

  ngOnInit(): void {
    this.getStations();
  }

  getStations(): void {
    this.weatherService.getStations("/").subscribe(discovery => {
      this.stations = discovery;
      this.stationMarkers = Array.from(this.stations.map(station => {
        return {
          coordinates: station.location.coordinates,
          tooltip: station.name,
          icon: dwdStationIcon
        }
      }));
    });
  }

  showStations(): void {
    console.log(this.stations);
  }

  getWeatherDataByStation(): void {
    this.weatherService.getWeatherDataByStation("/00044/air_temperature/10_minutes").subscribe(test => {
      this.weatherData = test;
      console.log(test);
    })
  }

  getWeatherDataByStations(): void {
    this.weatherService.getWeatherDataByStation("/00044/air_temperature/10_minutes").subscribe({
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
    });

  }


  testWeatherData(): void {
    this.processApiParams("00044", "air_temperature", "10_minutes")
  }

  processApiParams(stationId: string, dataPoint: string, timeResolution: string, from?: string, until?: string): void {
    if (!stationId) {
      //TODO raise Error here
      console.log("No valid ID");
      return;
    }

    let base_endpoint: string = `/${stationId}/${dataPoint}/${timeResolution}`
    let final_endpoint = base_endpoint;

    if (from && until) {
      final_endpoint = base_endpoint + "?" + "from=" + from + "&" + "until=" + until;
    } else {
      console.log("No period given, request can take longer!");
    }

    this.weatherService.getWeatherDataByStation(final_endpoint.toString()).subscribe(data => {
      this.weatherData = data;
      console.log(data);
    })
  }

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


