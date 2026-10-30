# E1: Discovery of Parking Locations While Users are on the Move

Users will be able to find parking spaces that are free, refresh the parking indicators, and improve the results by narrowing down the options in accordance with their needs.

**Derived From:** (FR1) - Bugs and Errors, (FR3) - Refreshing.

**Supporting Requirements:** (NFR1) - Refreshing Statuses, (NFR4) - Delay of Queries, and (NFR5) - Consequences of Network Failure.

## US1: View Available Parking

As a driver, I would like to know the total number of available parking slots in the specified area, so I am able to better understand the parking slots in the area.

**Traceability:** FR1, NFR4.

### Acceptance Criteria

- It should be shown on the map the total number of available parking slots in the specified area.
- The number of vacancies would be updated on the map in case of a map move or zooming in/out.
- The displayed number would reflect the most recent availability information that was successfully retrieved.
- Under the network and system load conditions as specified in NFR4, the location query response will be delivered within five seconds at the 95th percentile.

## US2: Refresh of Parking Information Done Manually

As a driver, I wish to manually refresh information about parking so that I can find out about any changes in the availability of parking places before making my final decision on where to park.

**Traceability:** FR3.

### Acceptance Criteria

- The refresh control appears on the mapping of the parking area.
- Once a user taps on the refresh control, relevant information is requested from the backend system.
- While the refresh request is processed, a loading indicator is made visible.
- On successful completion of the request, the status of parking places, as well as the total number of vacant places, show the updated information output.
- Once the refresh request is completed, the loading indicator disappears.

## US3: Refresh Parking Statuses Automatically

As a driver, I would like to have my parking statuses updated automatically while using the app, so I don’t have to refresh the map myself.

**Traceability:** NFR1.

### Acceptance Criteria

- While the app is running on the phone and the internet is available, parking statuses will be refreshed automatically every five minutes.
- Automatic refreshing will obtain the parking status from the application server each time.
- Automatic refreshing will be stopped once the app is inactive.
- The time between calls can be measured to check whether the frequency requirement was fulfilled.

## US4: Price Filtering for Parking

As a driver, I expect to filter parking places by their prices to select free spots only or only spots that correspond to my budget while parking my car.

**Traceability:** FR5.

### Acceptance Criteria

- Customers are able to set a price range for parking.
- In the case of the selection of the option of free parking only, the search results will be only free parking spots.
- In the case of the choice of any other paid price range, only parking places with prices included in that range will be displayed.
- The application of the filter does not limit the usage of other operating filters.
- The selected range remains active till the moment of its clear up by the user.
- As indicated in NFR4, the filtered output is provided within five seconds at the 95th percentile.

## US5: Parking Filter Based on Its Category

As a driver, I hope to filter my parking lot based on the parking type, which enables me to find a conveniently located parking spot.

**Traceability:** FR5.

### Acceptance Criteria

- Having the ability to choose one or more types of parking spots, such as on-street, garage, and mentioned respectively, users receive only the spots matching selected type(s).
- The parking categories that were not chosen will not be displayed among the filtered results.
- The results obtained are not affected by applying the parking filter.
- The filter remains active until the moment it is turned off by the user himself.
- As for NFR4 demands, any filtered available parking spot is displayed within five seconds at the 95th percentile.

## US6: Offline Parking Data Retrieval

As a driver, I would like to have access to the parking information which I accessed recently even if there is no connectivity of the device so that I can refer to it when there is no internet traffic.

**Traceability:** FR1, NFR5.

### Acceptance Criteria

- When there is no communication line with the device, the application will continue to show the latest information available in its memory.
- The lookup system will have the sign “Offline” to indicate that the application operates without any connectivity.
- The application will show the timestamp of the last successful lookup.
- The information stored in memory can be accessed for 24 hours after the last successful application usage, as per NFR5.
- As soon as the device is reconnected to the communications channel, the application will be able to get the latest parking information again.

## US8: Filter Parking Based on Time Frame for Parking

As a driver, I want to filter parking options by the needed time frame for availability so that I can see parking spots according to when I will arrive at the place where I want to park.

**Traceability:** FR5.

### Acceptance Criteria

- A person can set the needed time frame for parking.
- The results show only the parking space available during the specified time frame based on information received from the system.
- Changing the time frame leads to changing the results.
- Using the filter for the time frame does not affect the other filters being used.
- The filter will remain in action until cleared by the user.
- Filtering according to the given conditions from NFR4 will allow getting the results in five seconds for 95% of cases.

## US9: Filter Parking by Vehicle Height Clearance

As a driver, I want to filter parking locations by minimum vehicle height clearance so that I can avoid locations that cannot accommodate my vehicle.

**Traceability:** FR5.

### Acceptance Criteria

- The user is able to provide a minimum vehicle height clearance requirement.
- The results provide parking locations that meet or exceed the required clearance.
- Parking locations that do not meet the required clearance are excluded from the results.
- The application of the clearance filter does not affect the other filters being applied.
- The selected filter remains applied until it is removed by the user.
- According to NFR4, the vacancy results should be rendered within five seconds at the 95th percentile.

# E2: Customizing the Parking Experience and Favorite Spaces

Users will be able to register their favorite parking spots, look at their list of favorites, organize the saved parking spots, and keep their preferences constant.

**Derived From:** (FR6) - Favorites.

**Supporting Requirement:** (NFR6) - Protection of Data Privacy.

## US7: Viewing the Saved Area

As a driver, I wish to see the precise places I have saved for parking in an exclusive area of favorites.

**Traceability:** FR6.

### Acceptance Criteria

- The application must include a distinct screen for viewing saved favorites.
- The viewed area must display the information related to saved car parks and their locations.
- Each location shown on the favorites screen must have the possibility to be distinguished as a parking spot or the area itself.
- The information shown on this page must reflect any other modifications made by the user.

## US10: Changing the Sequence of Saved Preferences

A driver would like to be able to put the places relevant to him/her first in the favorites list.

**Traceability:** FR6.

### Acceptance Criteria

- The individual can change the sequence of his/her saved preferences.
- The application will illustrate the newly established sequence once the user changes its preferences.
- Rearranging his/her preferences will not add new or remove any previously saved locations.
- The individual’s selected sequence of preferences should be saved even after he/she leaves the application.
