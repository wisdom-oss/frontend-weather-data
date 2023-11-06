import {WisdomInterface} from "common";

import {WeatherDataComponent} from "./lib/weather-data.component";

export const wisdomInterface: WisdomInterface = {
  route: {
    path: "weather-data",
    component: WeatherDataComponent,
  },
  scopes: [],
  translations: {
    de_DE: {},
    en_US: {},
  },
};