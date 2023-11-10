import { Injectable } from "@angular/core";
import { HttpClient, HttpContext } from "@angular/common/http";
import { Router } from "@angular/router";
import { USE_API_URL, USE_LOADER, USE_ERROR_HANDLER } from "common";


@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {

  /**
   * http context for further information to the request.
   */
  ctx: HttpContext = new HttpContext()
    .set(USE_API_URL, true)
    .set(USE_LOADER, false)
    .set(USE_ERROR_HANDLER, 1);

  constructor(private http: HttpClient, private router: Router) { }
}
