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
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Import analysis modules
from analysis.video_analysis import VideoAnalyzer
from analysis.audio_analysis import AudioAnalyzer
from analysis.risk_calculator import ImprovedRiskCalculator as RiskCalculator

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
    
    def __init__(self, db_params):
        self.db_params = db_params
        self.db_connection = psycopg2.connect(**self.db_params)
        
        # Analysis components
        self.video_analyzer = VideoAnalyzer()
        self.audio_analyzer = AudioAnalyzer()
        self.risk_calculator = RiskCalculator()
        
        logger.info("ProctorWorker initialized")
    
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
    
    def update_risk_score_and_breakdown(self, attempt_id: str, is_public: bool, risk_data: Dict[str, Any]):
        """Update the risk score and breakdown for a test attempt"""
        table_name = "PublicTestAttempt" if is_public else "TestAttempt"
        sql = f"""
            UPDATE "{table_name}"
            SET "riskScore" = %s, "riskScoreBreakdown" = %s, "updatedAt" = NOW()
            WHERE id = %s
        """
        
        try:
            with self.db_connection.cursor() as cursor:
                risk_score = risk_data.get('total_score')
                risk_breakdown_json = json.dumps(risk_data)
                
                cursor.execute(sql, (risk_score, risk_breakdown_json, attempt_id))
                self.db_connection.commit()
                
                logger.info(f"Updated risk score for attempt {attempt_id}: {risk_score}")
                logger.info(f"Saved risk breakdown for attempt {attempt_id}")
                return True

        except Exception as e:
            logger.error(f"Failed to update risk score and breakdown: {e}")
            self.db_connection.rollback()
            return False

    def get_test_details(self, attempt_id: str) -> Dict[str, Any]:
        """Fetch test details like question count and duration for risk analysis."""
        details = {'total_questions': 30, 'duration_minutes': 60, 'is_public': False} # Defaults

        try:
            with self.db_connection.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                # First, check TestAttempt
                cursor.execute("""
                    SELECT T.id as "testId", TA."startedAt", TA."completedAt",
                           (SELECT COUNT(*) FROM "Question" WHERE "testId" = T.id) as "questionCount"
                    FROM "TestAttempt" TA
                    JOIN "Test" T ON TA."testId" = T.id
                    WHERE TA.id = %s
                """, (attempt_id,))
                attempt = cursor.fetchone()

                if attempt:
                    details['is_public'] = False
                else:
                    # If not found, check PublicTestAttempt
                    cursor.execute("""
                        SELECT T.id as "testId", PTA."startedAt", PTA."completedAt",
                               (SELECT COUNT(*) FROM "Question" WHERE "testId" = T.id) as "questionCount"
                        FROM "PublicTestAttempt" PTA
                        JOIN "PublicTestLink" PTL ON PTA."publicLinkId" = PTL.id
                        JOIN "Test" T ON PTL."testId" = T.id
                        WHERE PTA.id = %s
                    """, (attempt_id,))
                    attempt = cursor.fetchone()
                    if attempt:
                        details['is_public'] = True

                if attempt and attempt['questionCount'] > 0:
                    details['total_questions'] = attempt['questionCount']

                if attempt and attempt['startedAt'] and attempt['completedAt']:
                    duration = attempt['completedAt'] - attempt['startedAt']
                    details['duration_minutes'] = max(1, duration.total_seconds() // 60)

        except Exception as e:
            logger.error(f"Failed to get test details for attempt {attempt_id}: {e}")
            # Return defaults on error

        return details
    
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
                
                # Get test context for the risk calculator
                test_details = self.get_test_details(attempt_id)

                # Calculate risk score
                risk_data = self.risk_calculator.calculate_risk_score(
                    all_events,
                    test_duration_minutes=test_details['duration_minutes'],
                    total_questions=test_details['total_questions']
                )

                # Save events to database
                if all_events:
                    self.save_proctor_events(attempt_id, all_events)

                # Update risk score and breakdown
                self.update_risk_score_and_breakdown(attempt_id, test_details['is_public'], risk_data)

                risk_score = risk_data.get('total_score', 0)
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