# os2display/screen CHANGELOG

## 5.0.4

* Added favicon.
* Removed Offline. Added fake service instead.
* Removed stacktrace.
* Added caching of ajax requests, to avoid getting the same js from the backend multiple times.

## 5.0.3

* Moved cookie to localstorage.
* Fixed issue where slide js was run before it was fully loaded.

## 5.0.2

* Fixed cookie expire issue. Moved expire date to year 2038.
* Bumped up versions for files in index.html.
* Added ngSanitize.
* Upgraded angular to 1.6.6.
* Added uniquie id to slide dom element.
* Fixed z-index for progress-box.
