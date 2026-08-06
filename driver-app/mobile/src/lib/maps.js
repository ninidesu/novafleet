import { Linking } from 'react-native';

// Open Google Maps turn-by-turn navigation to the trip destination. On a phone
// this launches the Google Maps app and starts navigating from the driver's
// current location; on web it opens Google Maps directions in a new tab.
// Pass destination coordinates when known; otherwise the destination text is
// geocoded by Google.
export function openGoogleMapsNavigation({ destinationCoord, destinationText }) {
  const base = 'https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate';
  let dest = '';
  if (Array.isArray(destinationCoord) && destinationCoord.length === 2) {
    dest = `${destinationCoord[0]},${destinationCoord[1]}`;
  } else if (destinationText) {
    dest = encodeURIComponent(destinationText);
  }
  const url = dest ? `${base}&destination=${dest}` : base;
  return Linking.openURL(url);
}
