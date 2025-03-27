/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import TrackPlayer from 'react-native-track-player';
import { PlayBackService } from './src/service';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => PlayBackService);