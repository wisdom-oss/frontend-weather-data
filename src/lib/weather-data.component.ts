import { Component } from "@angular/core";
import { WeatherDataService } from "./weather-data.service";
import { timeResolutions } from "./dwd-interfaces";
import { OnInit } from "@angular/core";

@Component({
  selector: 'lib-weather-data',
  templateUrl: "weather-data.component.html",
  styles: [
  ]
})
export class WeatherDataComponent implements OnInit {

  heightOuterBox: string = "20vh";

  possibleResolutions!: timeResolutions;

  constructor(public weatherService: WeatherDataService) { }

  ngOnInit(): void {
    this.getResolutions();
  }

  /**
  * calls bws service to retrieve all physical meter information
  */
  getResolutions(): void {
    this.weatherService.getResolutions('/discover').subscribe({
      next: (response) => {
        // extracts the meters content immediately, 
        // so you dont have to do it all the time
        this.possibleResolutions = response as timeResolutions;
        console.log(this.possibleResolutions);
      },
      error: (error) => {
        console.log(error);
      },
    })
  }


}


