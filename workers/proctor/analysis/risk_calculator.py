import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class RiskCalculator:
    """Calculates risk scores based on detected proctoring violations"""
    
    def __init__(self):
        # Risk weights for different event types
        self.risk_weights = {
            # Browser behavior events
            'TAB_HIDDEN': 2.0,
            'WINDOW_BLUR': 1.5,
            'DEVTOOLS_DETECTED': 5.0,
            'DEVTOOLS_SHORTCUT': 3.0,
            'F12_PRESSED': 2.0,
            'COPY_DETECTED': 3.0,
            'PASTE_DETECTED': 4.0,
            'CONTEXT_MENU_DETECTED': 1.0,
            'KEYBOARD_SHORTCUT': 2.0,
            'MOUSE_LEFT_WINDOW': 1.0,
            'INACTIVITY_DETECTED': 2.0,
            
            # Video analysis events
            'LOOK_AWAY': 2.5,
            'PHONE_DETECTED': 8.0,
            'MULTIPLE_PEOPLE': 10.0,
            
            # Audio analysis events
            'SUSPICIOUS_SILENCE': 1.5,
            'MULTIPLE_SPEAKERS_DETECTED': 8.0,
            'POSSIBLE_SPEAKER_CHANGE': 1.0,
            'BACKGROUND_NOISE': 0.5,
        }
        
        # Risk thresholds
        self.low_risk_threshold = 10.0
        self.medium_risk_threshold = 25.0
        self.high_risk_threshold = 50.0
        
        logger.info("RiskCalculator initialized")
    
    def calculate_base_score(self, events: List[Dict]) -> float:
        """Calculate base risk score from events"""
        total_score = 0.0
        event_counts = {}
        
        for event in events:
            event_type = event.get('type', 'UNKNOWN')
            weight = self.risk_weights.get(event_type, 1.0)
            
            # Count occurrences
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
            
            # Apply diminishing returns for repeated events
            occurrence_multiplier = min(1.0 + (event_counts[event_type] - 1) * 0.3, 2.0)
            
            # Calculate score for this event
            event_score = weight * occurrence_multiplier
            
            # Apply context-based adjustments
            event_score = self._apply_context_adjustments(event, event_score)
            
            total_score += event_score
        
        return total_score
    
    def _apply_context_adjustments(self, event: Dict, base_score: float) -> float:
        """Apply context-based adjustments to event scores"""
        event_type = event.get('type', '')
        extra = event.get('extra', {})
        adjusted_score = base_score
        
        # Adjust based on specific event details
        if event_type == 'LOOK_AWAY':
            yaw = abs(extra.get('yaw', 0))
            if yaw > 60:  # Very significant head turn
                adjusted_score *= 1.5
            elif yaw > 45:  # Significant head turn
                adjusted_score *= 1.2
        
        elif event_type == 'PHONE_DETECTED':
            confidence = extra.get('confidence', 0.5)
            if confidence > 0.8:  # High confidence detection
                adjusted_score *= 1.3
        
        elif event_type == 'MULTIPLE_PEOPLE':
            person_count = extra.get('person_count', 2)
            # More people = higher risk
            adjusted_score *= min(person_count / 2.0, 3.0)
        
        elif event_type == 'SUSPICIOUS_SILENCE':
            duration = extra.get('duration_seconds', 30)
            if duration > 120:  # Very long silence
                adjusted_score *= 2.0
            elif duration > 60:  # Long silence
                adjusted_score *= 1.5
        
        elif event_type == 'MULTIPLE_SPEAKERS_DETECTED':
            confidence = extra.get('confidence', 0.5)
            adjusted_score *= (0.5 + confidence)
        
        elif event_type == 'INACTIVITY_DETECTED':
            inactive_seconds = extra.get('inactiveSeconds', 30)
            if inactive_seconds > 300:  # More than 5 minutes
                adjusted_score *= 2.0
            elif inactive_seconds > 120:  # More than 2 minutes
                adjusted_score *= 1.5
        
        return adjusted_score
    
    def calculate_temporal_patterns(self, events: List[Dict]) -> float:
        """Calculate additional risk based on temporal patterns"""
        if len(events) < 2:
            return 0.0
        
        pattern_score = 0.0
        
        # Sort events by timestamp
        sorted_events = sorted(events, key=lambda x: x.get('timestamp', 0))
        
        # Check for clustering of suspicious events
        suspicious_clusters = []
        current_cluster = []
        cluster_window = 60.0  # 60 seconds
        
        for event in sorted_events:
            if event.get('type') in ['PHONE_DETECTED', 'MULTIPLE_PEOPLE', 'DEVTOOLS_DETECTED']:
                if not current_cluster:
                    current_cluster = [event]
                else:
                    time_diff = event.get('timestamp', 0) - current_cluster[-1].get('timestamp', 0)
                    if time_diff <= cluster_window:
                        current_cluster.append(event)
                    else:
                        if len(current_cluster) > 1:
                            suspicious_clusters.append(current_cluster)
                        current_cluster = [event]
        
        # Add final cluster if it exists
        if len(current_cluster) > 1:
            suspicious_clusters.append(current_cluster)
        
        # Score clusters
        for cluster in suspicious_clusters:
            cluster_score = len(cluster) * 2.0  # 2 points per event in cluster
            pattern_score += cluster_score
        
        # Check for repetitive behavior patterns
        tab_switches = [e for e in sorted_events if e.get('type') == 'TAB_HIDDEN']
        if len(tab_switches) > 5:
            pattern_score += min(len(tab_switches) * 0.5, 10.0)
        
        return pattern_score
    
    def calculate_duration_adjustment(self, events: List[Dict], test_duration_minutes: float = 30.0) -> float:
        """Calculate adjustment based on test duration"""
        if not events:
            return 1.0
        
        # Normalize risk based on test duration
        # Longer tests should have slightly lower risk per event
        duration_factor = max(0.7, 1.0 - (test_duration_minutes - 30) / 120.0)
        
        return duration_factor
    
    def get_risk_category(self, risk_score: float) -> str:
        """Get risk category based on score"""
        if risk_score < self.low_risk_threshold:
            return 'LOW'
        elif risk_score < self.medium_risk_threshold:
            return 'MEDIUM'
        elif risk_score < self.high_risk_threshold:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    def calculate_risk_score(self, events: List[Dict], test_duration_minutes: float = 30.0) -> float:
        """Calculate overall risk score from events"""
        if not events:
            return 0.0
        
        # Calculate base score from individual events
        base_score = self.calculate_base_score(events)
        
        # Add temporal pattern analysis
        pattern_score = self.calculate_temporal_patterns(events)
        
        # Apply duration adjustment
        duration_factor = self.calculate_duration_adjustment(events, test_duration_minutes)
        
        # Calculate final score
        total_score = (base_score + pattern_score) * duration_factor
        
        # Cap the score at 100
        final_score = min(total_score, 100.0)
        
        risk_category = self.get_risk_category(final_score)
        
        logger.info(f"Risk calculation complete:")
        logger.info(f"  Base score: {base_score:.2f}")
        logger.info(f"  Pattern score: {pattern_score:.2f}")
        logger.info(f"  Duration factor: {duration_factor:.2f}")
        logger.info(f"  Final score: {final_score:.2f} ({risk_category})")
        
        return final_score
    
    def get_score_breakdown(self, events: List[Dict]) -> Dict:
        """Get detailed breakdown of risk score calculation"""
        breakdown = {
            'event_counts': {},
            'event_scores': {},
            'total_base_score': 0.0,
            'pattern_score': 0.0,
            'final_score': 0.0,
            'risk_category': 'LOW'
        }
        
        # Count and score events
        for event in events:
            event_type = event.get('type', 'UNKNOWN')
            breakdown['event_counts'][event_type] = breakdown['event_counts'].get(event_type, 0) + 1
            
            weight = self.risk_weights.get(event_type, 1.0)
            if event_type not in breakdown['event_scores']:
                breakdown['event_scores'][event_type] = 0.0
            breakdown['event_scores'][event_type] += weight
        
        breakdown['total_base_score'] = self.calculate_base_score(events)
        breakdown['pattern_score'] = self.calculate_temporal_patterns(events)
        breakdown['final_score'] = self.calculate_risk_score(events)
        breakdown['risk_category'] = self.get_risk_category(breakdown['final_score'])
        
        return breakdown 