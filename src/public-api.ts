import { WisdomInterface } from "common";

import { WeatherDataComponent } from "./lib/weather-data.component";
import de_DE from "./lib/i18n/de_DE";
import en_US from "./lib/i18n/en_US";

export const wisdomInterface: WisdomInterface = {
  route: {
    path: "weather-data",
    component: WeatherDataComponent,
  },
  scopes: [],
  translations: {
    de_DE,
    en_US,
  },
};

export * from './lib/weather-data.service';
export * from './lib/weather-data.component';
export * from './lib/weather-data.module';
