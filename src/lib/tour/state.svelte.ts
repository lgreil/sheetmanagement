/**
 * Asks the layout's tour to start again, from the profile's "Tour noch einmal machen", and
 * says whether its card is on screen, so the start page's dock can make room for it.
 * Only changed in the browser; on the server it stays at rest.
 */
export const tour = $state({ requested: 0, showing: false });

export function startTour() {
	tour.requested++;
}
