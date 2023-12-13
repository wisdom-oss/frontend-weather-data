import { Injectable } from "@angular/core";
import { HttpClient, HttpContext } from "@angular/common/http";
import { USE_API_URL, USE_LOADER, USE_ERROR_HANDLER, USE_CACHE } from "common";
import { Observable } from "rxjs";
import { Stations } from "./dwd-interfaces";


const API_PREFIX = "dwd";

/**
 * injects the service to be singleton throughout project. 
 * // NOTE: Discuss if necessary
 */
@Injectable({
  providedIn: 'root'
})

export class WeatherDataService {

  /**
   * http context for further information to the request.
   */
  ctx: HttpContext = new HttpContext()
    .set(USE_API_URL, true)
    .set(USE_LOADER, true)
    .set(USE_ERROR_HANDLER, 1)
    .set(USE_CACHE, true);

  constructor(private http: HttpClient) { }

  fetchStations(url: string, ctx?: HttpContext): Observable<Stations> {

    if (!url) {
      return this.handleError("No URL given!");
    }

    let finalUrl = API_PREFIX + url;

    return this.http.get<Stations>(finalUrl, {
      responseType: "json",
      context: ctx || this.ctx
    });

  }

  fetchWeatherDataByStation(url: string, ctx?: HttpContext): Observable<any> {

    if (!url) {
      return this.handleError("No URL given!");
    }

    return this.http.get<any>(API_PREFIX + url, {
      responseType: "json",
      context: ctx || this.ctx
    });

  }

  /**
     * creates an Observable with an error to subscribe to it and logs the information in the console.
     * @param msg error meesage
     * @returns observable with contained error.
     */
  handleError(msg: string): Observable<any> {

    return new Observable((observer) => {
      observer.error(new Error(msg));
    });
  }













}
