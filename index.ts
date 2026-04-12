import { createElement } from 'react';
import { registerRootComponent } from 'expo';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * Root component wrapping App with an ErrorBoundary.
 * Any uncaught React error will show a graceful fallback screen
 * instead of a blank crash — required by Apple & Google store review.
 */
function Root() {
  return createElement(ErrorBoundary, null, createElement(App));
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
registerRootComponent(Root);
