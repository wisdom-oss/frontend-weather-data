import { Injectable } from "@angular/core";
import { HttpClient, HttpContext } from "@angular/common/http";
import { Router } from "@angular/router";
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

  constructor(private http: HttpClient, private router: Router) { }

  getStations(url: string, ctx?: HttpContext): Observable<Stations> {
    let finalUrl = API_PREFIX + url;

    return this.http.get<Stations>(finalUrl, {
      responseType: "json",
      context: ctx || this.ctx
    });

  }

  getResolutions(url: string, ctx?: HttpContext): Observable<any> {

    let requestOptions: any = {
      context: ctx || this.ctx,
      responseType: 'json',
    };

    return this.http.request<any>('get', API_PREFIX + url, requestOptions);

  }

  getWeatherDataByStation(url: string, ctx?: HttpContext): Observable<any> {

    return this.http.get<any>(API_PREFIX + url, {
      responseType: "json",
      context: ctx || this.ctx
    });

  }














}
