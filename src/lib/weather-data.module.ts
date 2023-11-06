import {NgModule} from "@angular/core";
import {TranslateModule} from "@ngx-translate/core";
import {WisdomModule} from "common";

import {WeatherDataComponent} from "./weather-data.component";



@NgModule({
  declarations: [
    WeatherDataComponent
  ],
  imports: [
    WisdomModule,
    TranslateModule
  ],
  exports: [
    WeatherDataComponent
  ]
})
export class WeatherDataModule { }
