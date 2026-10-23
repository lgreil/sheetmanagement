/**
 * Asks the layout's tour to start again, from the profile's "Tour noch einmal machen".
 * Only changed in the browser; on the server it stays at rest.
 */
export const tour = $state({ requested: 0 });

export function startTour() {
	tour.requested++;
}
