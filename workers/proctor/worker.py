#!/usr/bin/env python3
"""
Proctoring Analysis Worker

This worker processes uploaded proctoring videos to detect suspicious behaviors:
- Head pose analysis (looking away)
- Object detection (phones, multiple people)
- Audio analysis (multiple speakers, voice activity)
- Risk score calculation

Uses PostgreSQL for job queue management (pg-boss schema)
"""

import os
import sys
import json
import tempfile
import shutil
import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Import analysis modules
from analysis.video_analysis import VideoAnalyzer
from analysis.audio_analysis import AudioAnalyzer
from analysis.risk_calculator import RiskCalculator

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ProctorWorker:
    """Main worker class for proctoring analysis"""
    
    def __init__(self):
        # Database connection
        self.db_connection = psycopg2.connect(
            os.getenv('DATABASE_URL'),
            cursor_factory=psycopg2.extras.RealDictCursor
        )
        
        # Analysis components
        self.video_analyzer = VideoAnalyzer()
        self.audio_analyzer = AudioAnalyzer()
        self.risk_calculator = RiskCalculator()
        
        logger.info("ProctorWorker initialized successfully")
    
    def download_video_from_database(self, asset_id: str, output_path: str) -> bool:
        """Download video data from database and save to file"""
        try:
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    SELECT data FROM "ProctorAsset" WHERE id = %s
                """, (asset_id,))
                
                result = cursor.fetchone()
                if not result or not result['data']:
                    logger.error(f"No video data found for asset {asset_id}")
                    return False
                
                # Write binary data to file
                with open(output_path, 'wb') as f:
                    f.write(result['data'])
                
                logger.info(f"Downloaded video from database: {asset_id} -> {output_path}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to download video from database: {e}")
            return False
    
    def get_next_job(self) -> Optional[Dict]:
        """Fetch the next job from pg-boss queue"""
        try:
            with self.db_connection.cursor() as cursor:
                # Fetch and claim a job from pgboss.job table
                cursor.execute("""
                    UPDATE pgboss.job 
                    SET state = 'active', 
                        startedOn = NOW(),
                        retryCount = retryCount + 1
                    WHERE id = (
                        SELECT id FROM pgboss.job 
                        WHERE name = 'proctor.analyse' 
                        AND state = 'created' 
                        AND (startAfter IS NULL OR startAfter <= NOW())
                        ORDER BY createdOn ASC 
                        LIMIT 1
                        FOR UPDATE SKIP LOCKED
                    )
                    RETURNING id, data;
                """)
                
                result = cursor.fetchone()
                if not result:
                    return None
                
                self.db_connection.commit()
                
                job_data = {
                    'id': result['id'],
                    'data': result['data'] if isinstance(result['data'], dict) else json.loads(result['data'])
                }
                
                logger.info(f"Claimed job: {job_data['id']}")
                return job_data
                
        except Exception as e:
            logger.error(f"Failed to fetch job: {e}")
            self.db_connection.rollback()
            return None
    
    def complete_job(self, job_id: str, success: bool = True) -> bool:
        """Mark job as completed or failed"""
        try:
            with self.db_connection.cursor() as cursor:
                if success:
                    cursor.execute("""
                        UPDATE pgboss.job 
                        SET state = 'completed', completedOn = NOW()
                        WHERE id = %s
                    """, (job_id,))
                else:
                    cursor.execute("""
                        UPDATE pgboss.job 
                        SET state = 'failed', completedOn = NOW()
                        WHERE id = %s
                    """, (job_id,))
                
                self.db_connection.commit()
                logger.info(f"Job {job_id} marked as {'completed' if success else 'failed'}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update job status: {e}")
            self.db_connection.rollback()
            return False
    
    def save_proctor_events(self, attempt_id: str, events: List[Dict]) -> bool:
        """Save detected proctor events to database"""
        try:
            with self.db_connection.cursor() as cursor:
                for event in events:
                    cursor.execute("""
                        INSERT INTO "ProctorEvent" (id, "attemptId", type, ts, extra)
                        VALUES (gen_random_uuid(), %s, %s, %s, %s)
                    """, (
                        attempt_id,
                        event['type'],
                        datetime.fromtimestamp(event['timestamp']),
                        json.dumps(event.get('extra', {}))
                    ))
                
                self.db_connection.commit()
                logger.info(f"Saved {len(events)} proctor events for attempt {attempt_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to save proctor events: {e}")
            self.db_connection.rollback()
            return False
    
    def update_risk_score(self, attempt_id: str, risk_score: float) -> bool:
        """Update the risk score for a test attempt"""
        try:
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE "TestAttempt" 
                    SET "riskScore" = %s, "updatedAt" = NOW()
                    WHERE id = %s
                """, (risk_score, attempt_id))
                
                self.db_connection.commit()
                logger.info(f"Updated risk score for attempt {attempt_id}: {risk_score}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update risk score: {e}")
            self.db_connection.rollback()
            return False
    
    def process_video(self, job_data: Dict) -> bool:
        """Main video processing pipeline"""
        data = job_data['data']
        asset_id = data['assetId']
        attempt_id = data['attemptId']
        database_stored = data.get('databaseStored', True)  # Default to database storage
        
        logger.info(f"Processing video for attempt {attempt_id}, asset {asset_id}")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory(prefix='proctor_') as temp_dir:
            video_path = os.path.join(temp_dir, 'video.webm')
            
            # Download video from database
            if not self.download_video_from_database(asset_id, video_path):
                logger.error(f"Failed to download video from database")
                return False
            
            # Extract frames and audio
            frames_dir = os.path.join(temp_dir, 'frames')
            audio_path = os.path.join(temp_dir, 'audio.wav')
            
            os.makedirs(frames_dir, exist_ok=True)
            
            # Process video
            try:
                video_events = self.video_analyzer.analyze_video(video_path, frames_dir)
                audio_events = self.audio_analyzer.analyze_audio(video_path, audio_path)
                
                # Combine all events
                all_events = video_events + audio_events
                
                # Calculate risk score
                risk_score = self.risk_calculator.calculate_risk_score(all_events)
                
                # Save events to database
                if all_events:
                    self.save_proctor_events(attempt_id, all_events)
                
                # Update risk score
                self.update_risk_score(attempt_id, risk_score)
                
                logger.info(f"Analysis complete for attempt {attempt_id}. Risk Score: {risk_score:.2f}")
                return True
                
            except Exception as e:
                logger.error(f"Error during video analysis: {e}")
                return False
    
    def run(self):
        """Main worker loop"""
        logger.info("Starting ProctorWorker (PostgreSQL mode)...")
        
        while True:
            try:
                # Check for new jobs
                job = self.get_next_job()
                
                if job is None:
                    # No jobs available, wait a bit
                    time.sleep(5)
                    continue
                
                logger.info(f"Processing job: {job['id']}")
                
                # Process the video
                success = self.process_video(job)
                
                # Mark job as completed or failed
                self.complete_job(job['id'], success)
                
                if success:
                    logger.info(f"Job completed successfully: {job['id']}")
                else:
                    logger.error(f"Job failed: {job['id']}")
                    
            except KeyboardInterrupt:
                logger.info("Received interrupt signal, shutting down...")
                break
            except Exception as e:
                logger.error(f"Unexpected error in worker loop: {e}")
                time.sleep(10)  # Wait before retrying
                continue
        
        # Cleanup
        self.db_connection.close()
        logger.info("ProctorWorker shutdown complete")

if __name__ == '__main__':
    worker = ProctorWorker()
    worker.run() 