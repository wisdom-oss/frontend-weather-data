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
  heightWeatherMap: string = (85 / 100 * parseFloat(this.heightWeatherBox)).toString() + "vh";

  stations: Stations = [];
  stationMarkers: Marker[] = [];

  weatherData: any;

  possibleResolutions!: any;

  constructor(public weatherService: WeatherDataService) { }

  ngOnInit(): void {
    this.getStationsforMap();
  }

  getStationsforMap(): void {
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

  getWeatherDataByStation(): void {
    this.weatherService.getWeatherDataByStation("/daily/qn/Oldenburg").subscribe(test => {
      this.weatherData = test;
      console.log(test);
    })
  }


  /**
  * get resolution data from dwd
  */
  getResolutions(): void {
    this.weatherService.getResolutions('/').subscribe({
      next: (response) => {
        // extracts the meters content immediately, 
        // so you dont have to do it all the time
        this.possibleResolutions = response;
        console.log(this.possibleResolutions);
      },
      error: (error) => {
        console.log(error);
      },
    })
  }


}


