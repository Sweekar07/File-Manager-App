// src/service.tsx

import TrackPlayer, { Event } from 'react-native-track-player';

export async function PlayBackService() {
  try {
    // Event Listeners for Remote Control
    const remotePlayListener = TrackPlayer.addEventListener(
      Event.RemotePlay, 
      () => TrackPlayer.play()
    );
    
    const remotePauseListener = TrackPlayer.addEventListener(
      Event.RemotePause, 
      () => TrackPlayer.pause()
    );
    
    const remoteNextListener = TrackPlayer.addEventListener(
      Event.RemoteNext, 
      async () => await TrackPlayer.skipToNext()
    );
    
    const remotePreviousListener = TrackPlayer.addEventListener(
      Event.RemotePrevious, 
      async () => await TrackPlayer.skipToPrevious()
    );

    const remoteStopListener = TrackPlayer.addEventListener(
      Event.RemoteStop, 
      () => TrackPlayer.stop()
    );

    const remoteSeekListener = TrackPlayer.addEventListener(
      Event.RemoteSeek, 
      async (event) => await TrackPlayer.seekTo(event.position)
    );

    // Return a cleanup function to remove listeners if needed
    return () => {
      remotePlayListener.remove();
      remotePauseListener.remove();
      remoteNextListener.remove();
      remotePreviousListener.remove();
      remoteStopListener.remove();
      remoteSeekListener.remove();
    };
  } catch (error) {
    console.error('Error in PlayBackService:', error);
  }
}