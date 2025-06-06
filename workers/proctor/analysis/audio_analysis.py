import os
import ffmpeg
import webrtcvad
import wave
import numpy as np
import logging
from typing import List, Dict, Optional
from pyannote.audio import Pipeline

logger = logging.getLogger(__name__)

class AudioAnalyzer:
    """Analyzes audio for proctoring violations"""
    
    def __init__(self):
        # Initialize VAD
        self.vad = webrtcvad.Vad(2)  # Aggressiveness level 0-3 (higher = more aggressive)
        
        # Initialize speaker diarization pipeline
        try:
            # This requires a HuggingFace token for pyannote models
            # For now, we'll implement a simple approach
            self.diarization_pipeline = None
            logger.info("AudioAnalyzer initialized (basic mode)")
        except Exception as e:
            logger.warning(f"Could not initialize speaker diarization: {e}")
            self.diarization_pipeline = None
    
    def extract_audio(self, video_path: str, audio_path: str) -> bool:
        """Extract audio from video file"""
        try:
            (
                ffmpeg
                .input(video_path)
                .output(audio_path, acodec='pcm_s16le', ac=1, ar=16000)
                .overwrite_output()
                .run(quiet=True)
            )
            
            logger.info(f"Audio extracted: {audio_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to extract audio: {e}")
            return False
    
    def detect_voice_activity(self, audio_path: str) -> List[Dict]:
        """Detect voice activity segments using WebRTC VAD"""
        events = []
        
        try:
            with wave.open(audio_path, 'rb') as wav_file:
                sample_rate = wav_file.getframerate()
                
                # Check if sample rate is supported by VAD
                if sample_rate not in [8000, 16000, 32000, 48000]:
                    logger.warning(f"Unsupported sample rate: {sample_rate}")
                    return events
                
                frame_duration = 30  # ms
                frame_size = int(sample_rate * frame_duration / 1000)
                
                silent_periods = []
                current_silent_start = None
                time_ms = 0
                
                while True:
                    frame = wav_file.readframes(frame_size)
                    if len(frame) < frame_size * 2:  # 2 bytes per sample
                        break
                    
                    # Check if frame contains speech
                    is_speech = self.vad.is_speech(frame, sample_rate)
                    
                    if not is_speech:
                        if current_silent_start is None:
                            current_silent_start = time_ms
                    else:
                        if current_silent_start is not None:
                            silent_duration = time_ms - current_silent_start
                            # Report suspicious silence (longer than 30 seconds)
                            if silent_duration > 30000:
                                events.append({
                                    'type': 'SUSPICIOUS_SILENCE',
                                    'timestamp': current_silent_start / 1000.0,
                                    'extra': {
                                        'duration_seconds': silent_duration / 1000.0,
                                        'start_time': current_silent_start / 1000.0,
                                        'end_time': time_ms / 1000.0
                                    }
                                })
                            current_silent_start = None
                    
                    time_ms += frame_duration
                
                # Handle final silent period
                if current_silent_start is not None:
                    silent_duration = time_ms - current_silent_start
                    if silent_duration > 30000:
                        events.append({
                            'type': 'SUSPICIOUS_SILENCE',
                            'timestamp': current_silent_start / 1000.0,
                            'extra': {
                                'duration_seconds': silent_duration / 1000.0,
                                'start_time': current_silent_start / 1000.0,
                                'end_time': time_ms / 1000.0
                            }
                        })
                
        except Exception as e:
            logger.error(f"Error in voice activity detection: {e}")
        
        return events
    
    def detect_multiple_speakers(self, audio_path: str) -> List[Dict]:
        """Detect multiple speakers (simplified implementation)"""
        events = []
        
        try:
            # Simple energy-based analysis for multiple speakers
            # This is a basic implementation - for production, use pyannote or similar
            
            with wave.open(audio_path, 'rb') as wav_file:
                sample_rate = wav_file.getframerate()
                frames = wav_file.readframes(-1)
                audio_data = np.frombuffer(frames, dtype=np.int16)
                
                # Split audio into 5-second segments
                segment_length = sample_rate * 5
                num_segments = len(audio_data) // segment_length
                
                speaker_change_threshold = 0.3  # Threshold for detecting speaker changes
                
                for i in range(1, num_segments):
                    # Calculate energy difference between consecutive segments
                    prev_segment = audio_data[(i-1)*segment_length:i*segment_length]
                    curr_segment = audio_data[i*segment_length:(i+1)*segment_length]
                    
                    prev_energy = np.mean(np.abs(prev_segment))
                    curr_energy = np.mean(np.abs(curr_segment))
                    
                    if prev_energy > 0:
                        energy_ratio = abs(curr_energy - prev_energy) / prev_energy
                        
                        # If energy changes significantly, might indicate speaker change
                        if energy_ratio > speaker_change_threshold and curr_energy > 1000:
                            events.append({
                                'type': 'POSSIBLE_SPEAKER_CHANGE',
                                'timestamp': i * 5.0,
                                'extra': {
                                    'energy_ratio': energy_ratio,
                                    'segment_start': i * 5.0,
                                    'prev_energy': float(prev_energy),
                                    'curr_energy': float(curr_energy)
                                }
                            })
                
                # If we detect multiple speaker changes, flag as multiple speakers
                if len(events) > 3:  # More than 3 speaker changes suggests multiple people
                    events.append({
                        'type': 'MULTIPLE_SPEAKERS_DETECTED',
                        'timestamp': 0.0,
                        'extra': {
                            'speaker_changes': len(events),
                            'confidence': min(len(events) / 10.0, 1.0)
                        }
                    })
                
        except Exception as e:
            logger.error(f"Error in multiple speaker detection: {e}")
        
        return events
    
    def detect_background_noise(self, audio_path: str) -> List[Dict]:
        """Detect suspicious background noises"""
        events = []
        
        try:
            with wave.open(audio_path, 'rb') as wav_file:
                sample_rate = wav_file.getframerate()
                frames = wav_file.readframes(-1)
                audio_data = np.frombuffer(frames, dtype=np.int16)
                
                # Calculate RMS energy in 2-second windows
                window_size = sample_rate * 2
                noise_threshold = 5000  # Threshold for background noise
                
                for i in range(0, len(audio_data) - window_size, window_size):
                    window = audio_data[i:i + window_size]
                    rms_energy = np.sqrt(np.mean(window**2))
                    
                    # Detect sudden spikes in background noise
                    if rms_energy > noise_threshold:
                        events.append({
                            'type': 'BACKGROUND_NOISE',
                            'timestamp': i / sample_rate,
                            'extra': {
                                'rms_energy': float(rms_energy),
                                'duration': 2.0
                            }
                        })
                
        except Exception as e:
            logger.error(f"Error in background noise detection: {e}")
        
        return events
    
    def analyze_audio(self, video_path: str, audio_path: str) -> List[Dict]:
        """Main audio analysis pipeline"""
        logger.info(f"Starting audio analysis: {video_path}")
        
        all_events = []
        
        # Extract audio from video
        if not self.extract_audio(video_path, audio_path):
            logger.error("Failed to extract audio")
            return all_events
        
        # Perform various audio analyses
        try:
            # Voice activity detection
            vad_events = self.detect_voice_activity(audio_path)
            all_events.extend(vad_events)
            
            # Multiple speaker detection
            speaker_events = self.detect_multiple_speakers(audio_path)
            all_events.extend(speaker_events)
            
            # Background noise detection
            noise_events = self.detect_background_noise(audio_path)
            all_events.extend(noise_events)
            
        except Exception as e:
            logger.error(f"Error during audio analysis: {e}")
        
        logger.info(f"Audio analysis complete. Found {len(all_events)} events")
        return all_events 