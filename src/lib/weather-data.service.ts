import { Injectable } from "@angular/core";
import { HttpClient, HttpContext } from "@angular/common/http";
import { Router } from "@angular/router";
import { USE_API_URL, USE_LOADER, USE_ERROR_HANDLER } from "common";
import { Observable, of } from "rxjs";
import { timeResolutions } from "./dwd-interfaces";


const API_PREFIX = "dwd-proxy";

/**
 * injects the service to be singleton throughout project. 
 * // NOTE: Discuss if necessary
 */
@Injectable({
  providedIn: 'root'
})

export class WeatherDataService {

  exampleData: timeResolutions = {
    "1_minute": [
      "precipitation"
    ],
    "5_minutes": [
    ],
    "10_minutes": [
      "air_temperature",
      "extreme_wind",
      "solar",
      "wind",
      "precipitation"
    ], "hourly": [
    ], "subdaily": [
    ], "daily": [
    ], "monthly": [
    ], "annual": [
    ], "multi-annual": [
    ]
  }

  /**
   * http context for further information to the request.
   */
  ctx: HttpContext = new HttpContext()
    .set(USE_API_URL, true)
    .set(USE_LOADER, false)
    .set(USE_ERROR_HANDLER, 1);

  constructor(private http: HttpClient, private router: Router) { }


  getResolutions<timeResolutions>(url: string, ctx?: HttpContext) {
    let finalUrl = this.router.parseUrl(API_PREFIX + url);
    let finalCtx = ctx || this.ctx;

    let requestOptions: any = {
      context: finalCtx,
      responseType: 'application/json',
    };

    let res = this.http.request<timeResolutions>('get', finalUrl.toString(), requestOptions) as Observable<timeResolutions>
    return of(this.exampleData);

  }














}
