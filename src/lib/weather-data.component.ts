import { Component, OnInit } from "@angular/core";
import { Marker, BulmaCalendarMode } from "common";
import { dwdStationIcon } from "./map-icons";
import { WeatherDataService } from "./weather-data.service";
import { Station, DataCapability, ActiveFilters } from "./dwd-interfaces";
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: "lib-weather-data",
    templateUrl: "weather-data.component.html",
    styles: [],
})
export class WeatherDataComponent implements OnInit {
    BulmaCalendarMode = BulmaCalendarMode;
    calendarOptions = {
        isRange: true,
        showHeader: false,
        dateFormat: "dd.MM.yyyy",
        showFooter: false
    }

    // dynmic height of components
    heightWeatherBox: string = "85vh";
    heightInfoBox: string = "88vh";
    heightDiffInfoBox: string = "8vh";

    // save all stations from dwd
    stations: Station[] = [];

    // save all markers from stations
    stationMarkers: Marker[] = [];

    // flag if historical stations should be filtered
    historicalFiltered: boolean = true;

    // Array of DataCapabilities to show as Switches
    activatedFilters: DataCapability[] = ActiveFilters;

    // Key: DataType Attribute (Temperature) Value: True | False (Filter on/off)
    filterStates: Map<DataCapability, boolean> = new Map<DataCapability, boolean>();

    //------------------------------------------------------------------------------ Single Station Object ----------------------------------------

    // single station object to show information
    station: Station | undefined;

    // chosen DataCapability
    usedDataType: string | undefined;
    // chosen Resolution
    usedResolution: string | undefined;

    // Map of available Resolutions per DataCapability
    availableResolutions: Map<string, string[]> = new Map<string, string[]>();

    //------------------------------------------------------------------------------ New Timestamp Format ------------------------------------------

    // ISO 8601 Format from Bulma Calendar
    selectedCalendarDatetimeFrom: string | undefined;
    selectedCalendarDatetimeUntil: string | undefined;

    // ISO 8601 Format from Bulma Calendar
    availableDatetimeFrom: string | undefined;
    availableDatetimeUntil: string | undefined;

    // Represent Datetime as Date in the html
    dateRangeRepresentationFrom: string | undefined;
    dateRangeRepresentationUntil: string | undefined;


    //------------------------------------------------------------------------------ Weather Object ------------------------------------------------

    // saved weather data regarding a station
    weatherData: any;

    // flag to (de)activate the download function
    downloadAvailable: boolean = true;

    constructor(public weatherService: WeatherDataService, private translate: TranslateService) { }

    //------------------------------------------------------------------------------ Create Initial View -------------------------------------------

    ngOnInit(): void {
        this.setFilterMap();
        this.getAllStations();
    }

    /**
     * populates the filterMap
     * (which determines the switches to appear for map)
     * using the activatedFilters array
     */
    setFilterMap(): void {
        this.activatedFilters.forEach((item) => {
            this.filterStates.set(item, true);
        });
    }

    /**
     * get all station data from dwd.
     * safe them in stations
     */
    getAllStations(): void {
        this.weatherService.fetchStations("/").subscribe((stationData) => {
            this.stations = stationData;
            this.showStations();
        });
    }

    //------------------------------------------------------------------------------ Filter Stations on Map -------------------------------------------

    /**
     * filter list of stations to fit criteria and initiate marker creation
     */
    showStations(): void {
        let filteredStations: Station[] = this.stations;

        // show only stations which have recent data (until today)
        if (this.historicalFiltered) {
            filteredStations = filteredStations.filter((station) => {
                return !station.historical;
            });
        }
        // show only stations which don't have recent data
        else {
            filteredStations = filteredStations.filter((station) => {
                return station.historical;
            });
        }

        this.filterStates.forEach((filterValue, filterKey) => {
            if (filterValue) {
                filteredStations = this.filterStationsByDataType(filteredStations, filterKey);
            }
        });

        this.createStationMarkers(filteredStations);
    }

    /**
     * switches filterOption in filterStates map to reflect which filters are active
     * @param filterOption dataCapability to switch state of filtering
     */
    switchFilterOption(filterOption: DataCapability): void {
        let bool = this.filterStates.get(filterOption);
        this.filterStates.set(filterOption, !bool);
    }

    /**
     * searches an array of stations for every station which holds a certain datatype in their
     * capabilities attribute
     * @param stations array to search in
     * @param dataTypeToFilter to search for
     * @returns array of stations with the searched datatype
     */
    filterStationsByDataType(stations: Station[], dataTypeToFilter: string): Station[] {
        return stations.filter((station) =>
            station.capabilities.some((capability) => capability.dataType === dataTypeToFilter)
        );
    }

    /**
     * set historical filter flag
     */
    filterHistorical(): void {
        this.historicalFiltered = !this.historicalFiltered;
    }

    //------------------------------------------------------------------------------ Markers and Tooltips ---------------------------------------------

    /**
     * create map markers based on stations
     * @param stations array of stations for marker creation
     */
    createStationMarkers(stations: Station[]): void {
        this.stationMarkers = stations.map((station) => {
            return {
                coordinates: station.location.coordinates,
                tooltip: station.name,
                icon: dwdStationIcon,
                onClick: () => this.prepareStationInformation(station),
            };
        });
    }

    //------------------------------------------------------------------------------ Show Station Information -----------------------------------------

    /**
     * when clicking a station, extracs vital information for html template.
     * Resets usedDataType and usedResolution to not show outdated information
     * @param station object clicked
     */
    prepareStationInformation(station: Station): void {
        this.station = station;

        this.activatedFilters.forEach((filter) => {
            let a = station.capabilities
                .filter((element) => element.dataType === filter)
                .map((element) => element.resolution)
                .sort((a, b) => a.localeCompare(b));

            this.availableResolutions.set(filter, a);
            this.clearStationData();
        });
    }

    setTypeAndResolution(dataType: string, resolution: string): void {
        this.usedDataType = dataType
        this.usedResolution = resolution
    }

    /**
    * clear all station information to not
    * confuse them with new information
    */
    clearStationData(): void {
        this.usedDataType = undefined;
        this.usedResolution = undefined;

        this.selectedCalendarDatetimeFrom = undefined;
        this.selectedCalendarDatetimeUntil = undefined;

        this.availableDatetimeFrom = undefined;
        this.availableDatetimeUntil = undefined;

        this.dateRangeRepresentationFrom = undefined;
        this.dateRangeRepresentationUntil = undefined;

    }

    /**
     * finds the lower and upper bound of time range
     * of specified dataType and saves them to array in the ISO 8601 format
     * @param dataType DataCapability to use
     * @param resolution TimeResolution to use
     */
    createRangeOfTime(dataType: string, resolution: string): void {
        if (this.station) {
            this.station?.capabilities.find((element) => {
                if (element.dataType === dataType && element.resolution === resolution) {
                    this.availableDatetimeFrom = element.availableFrom;
                    this.availableDatetimeUntil = element.availableUntil;
                    this.dateRangeRepresentationFrom = this.convertDatetimetoDate(element.availableFrom);
                    this.dateRangeRepresentationUntil = this.convertDatetimetoDate(element.availableUntil);

                }
            });
        }


    }

    //------------------------------------------------------------------------------ DatePicker Functions --------------------------------------------

    /**
     *handle event emitted by datepicker and extract the start and end date
     * @param event emitted when both dates are selected in GUI
     */
    handleDatePickEvent(event: any) {

        this.selectedCalendarDatetimeFrom = (event.data.startDate).toISOString()
        this.selectedCalendarDatetimeUntil = event.data.endDate.toISOString()
    }




    //------------------------------------------------------------------------------ Formatting Functions --------------------------------------------

    /**
     * Converts the timestamp being selected into seconds for request
     * Disregards the Timezone because the dwd-service doesnt take that into account
     * @param timestamp to be converted
     * @returns time in seconds (unix timestamp)
     */
    convertDatetimeToUnixTime(datetimeString: string): number {
        const date = new Date(datetimeString);

        return Math.floor(date.getTime() / 1000)
    }

    /**
     * checks if the selected timestamps are inside the range of available data of the source
     * @returns true if they are, else not
     */
    checkRangeOfTime(): boolean {
        if (this.selectedCalendarDatetimeFrom && this.selectedCalendarDatetimeUntil && this.availableDatetimeFrom && this.availableDatetimeUntil) {
            const start_ts = this.convertDatetimeToUnixTime(this.selectedCalendarDatetimeFrom);
            const end_ts = this.convertDatetimeToUnixTime(this.selectedCalendarDatetimeUntil);

            const lower_bound = this.convertDatetimeToUnixTime(this.availableDatetimeFrom);
            const upper_bound = this.convertDatetimeToUnixTime(this.availableDatetimeUntil);

            if (lower_bound > start_ts || start_ts > upper_bound) {
                alert(
                    `Starting timestamp: ${this.convertDatetimetoDate(this.selectedCalendarDatetimeFrom)} is not between \n ${this.convertDatetimetoDate(this.availableDatetimeFrom)} and ${this.convertDatetimetoDate(this.availableDatetimeUntil)}`
                );
                return false;
            }

            if (lower_bound > end_ts || end_ts > upper_bound) {
                alert(
                    `Ending timestamp: ${this.convertDatetimetoDate(this.selectedCalendarDatetimeUntil)} is not between \n ${this.convertDatetimetoDate(this.availableDatetimeFrom)} and ${this.convertDatetimetoDate(this.availableDatetimeUntil)}`
                );
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * convert iso 8601 datetime format into only date
     * @param timeslot the string representaiton of the datetime
     * @returns a date string
     */
    convertDatetimetoDate(timeslot: string): string {
        let date = new Date(timeslot); // Parse the ISO 8601 date string

        // Extract day, month, and year
        let day = String(date.getDate()).padStart(2, '0'); // Get day and pad with zero if necessary
        let month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-11) and pad with zero
        let year = date.getFullYear(); // Get full year

        // Return formatted date in dd.mm.yyyy format
        return `${day}.${month}.${year}`;
    }


    //------------------------------------------------------------------------------ Service Functions  --------------------------------------------

    /**
     * instructions for downloading the selected data.
     * Uses global variables, thus it does not need parameters
     * @returns if a global variable is not set -> the url can't be build
     */
    startWeatherDataDownload() {
        if (!this.station) {
            console.error("No Station Object initialized!");
            return;
        }

        if (!this.usedDataType) {
            console.error("No Data Type initialized!");
            return;
        }

        if (!this.usedResolution) {
            console.error("No Resolution initialized!");
            return;
        }

        if (!this.selectedCalendarDatetimeFrom) {
            alert(`No Start Time selected.`);
            console.error(`Start Time not initialized`);
            return;
        }

        if (!this.selectedCalendarDatetimeUntil) {

            alert(`No end time selected.`);
            console.error(`End Time not initialized`);
            return;
        }

        if (this.checkRangeOfTime()) {
            let unixStart = this.convertDatetimeToUnixTime(this.selectedCalendarDatetimeFrom);
            let unixEnd = this.convertDatetimeToUnixTime(this.selectedCalendarDatetimeUntil);

            let url = this.buildUrl(this.station.id, this.usedDataType, this.usedResolution, unixStart, unixEnd);

            this.getWeatherData(url);
        }
    }

    /**
     * help function, not to be called directly
     * standardized processing function to build the url to retrieve stationary data
     * @param stationId to find a unique station
     * @param dataPoint kind of data to retrieve (precipitation etc.)
     * @param timeResolution timely resolution (1 min, 5 min) to find the correct data
     * @param from timestamp from when data shall be requested
     * @param until timestamp until data is requested
     * @returns if no stationID is used to safe resources
     */
    buildUrl(stationId: string, dataPoint: string, timeResolution: string, from?: number, until?: number): string {
        let endpoint: string = `/${stationId}/${dataPoint}/${timeResolution}`;

        if (from && until) {
            endpoint += `?from=${from}&until=${until}`;
        } else {
            console.info("No period specified, request can take longer!");
        }

        return endpoint;
    }

    /**
     * help function not to be called directly
     * request the weather service for a station, time resolution and data point
     * @param url the finished url to request from
     */
    getWeatherData(url: string) {
        console.info("Start downloading!");

        this.weatherService.fetchWeatherDataByStation(url.toString()).subscribe({
            next: (data) => {
                this.weatherData = data;
                console.log(this.weatherData);
            },
            error: (error) => {
                console.log(error);
            },
            complete: () => {
                console.info("Download finished");
                // let user download file
                this.createFile();
            },
        });
    }

    /**
     * create file which user can download
     * creates a function to bind to download button
     * @this.downloadAvailable Flag to control if download is authorized
     */
    createFile(): void {
        if (!this.downloadAvailable) {
            console.log("Download of File deactivated!");
            return;
        }

        const dataString = JSON.stringify(this.weatherData, null, 2); // Convert object to string

        const blob = new Blob([dataString], { type: "application/json" }); // Specify correct MIME type

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        if (this.station) {
            a.href = url;
            a.download = `WISdoM_Weather_Data_${this.station.name}_${this.usedDataType}_${this.usedResolution}_${this.selectedCalendarDatetimeFrom}_${this.selectedCalendarDatetimeUntil}`; // Replace with your desired file name
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    }

}
