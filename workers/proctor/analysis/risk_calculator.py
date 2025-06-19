import logging
from typing import List, Dict, Any
import json

logger = logging.getLogger(__name__)


class ImprovedRiskCalculator:
    """
    Calculates an improved risk score with better context awareness based on
    proctoring events, test duration, and question count.
    """

    def __init__(self):
        # Revised risk weights based on actual exam behavior patterns
        self.risk_weights = {
            # Browser Navigation Events (High Priority - indicates external resource usage)
            'TAB_HIDDEN': 8.0,           # Major red flag - student left exam tab
            'WINDOW_BLUR': 6.0,          # High concern - focus moved away from exam
            'TAB_SWITCH': 10.0,          # Critical - actively switching between tabs
            'NEW_TAB_OPENED': 12.0,      # Critical - opening new resources
            'MOUSE_LEFT_WINDOW': 4.0,    # Moderate - could be accidental or intentional

            # Copy/Paste Behavior (Copy is the main concern)
            'COPY_DETECTED': 8.0,        # High - copying questions to search elsewhere
            'PASTE_DETECTED': 3.0,       # Lower - rare in MCQs, but still suspicious
            'SELECT_ALL_DETECTED': 6.0,  # Moderate-High - often precedes copying

            # Developer Tools (Tracked but not scored)
            'DEVTOOLS_DETECTED': 0.0,
            'DEVTOOLS_SHORTCUT': 0.0,
            'F12_PRESSED': 0.0,
            'CONTEXT_MENU_DETECTED': 2.0, # Low - often accidental right-clicks

            # Keyboard Shortcuts (Context-dependent)
            'CTRL_C': 8.0,               # High - explicit copy command
            'CTRL_V': 3.0,               # Low - paste less relevant for MCQs
            'CTRL_A': 5.0,               # Moderate - select all before copy
            'CTRL_TAB': 9.0,             # Very High - tab switching shortcut
            'ALT_TAB': 7.0,              # High - application switching
            'KEYBOARD_SHORTCUT': 2.0,    # Generic shortcuts, lower priority

            # Video Analysis Events (Physical behavior)
            'LOOK_AWAY': 3.0,            # Moderate - could be natural or suspicious
            'PHONE_DETECTED': 12.0,      # Critical - clear violation
            'MULTIPLE_PEOPLE': 15.0,     # Critical - clear violation
            'EYES_NOT_ON_SCREEN': 4.0,   # Moderate - natural movement vs suspicious

            # Audio Analysis Events
            'MULTIPLE_SPEAKERS_DETECTED': 10.0,  # High - collaboration
            'SUSPICIOUS_SILENCE': 1.0,           # Low - could be concentration
            'POSSIBLE_SPEAKER_CHANGE': 2.0,      # Low-Moderate
            'BACKGROUND_NOISE': 0.5,             # Very Low - environmental

            # Inactivity (Context-dependent)
            'INACTIVITY_DETECTED': 1.0,  # Low base - adjusted by duration
        }

        # Risk thresholds
        self.risk_thresholds = {
            'LOW': 0,
            'MEDIUM': 15,     # Raised threshold - focus on clear violations
            'HIGH': 35,       # Raised threshold
            'CRITICAL': 60    # Raised threshold
        }

        # Suspicious event combinations that amplify risk
        self.violation_patterns = {
            'COPY_SEARCH_PATTERN': ['COPY_DETECTED', 'TAB_HIDDEN', 'TAB_SWITCH'],
            'EXTERNAL_HELP_PATTERN': ['TAB_HIDDEN', 'WINDOW_BLUR', 'MOUSE_LEFT_WINDOW'],
            'COLLABORATION_PATTERN': ['MULTIPLE_PEOPLE', 'MULTIPLE_SPEAKERS_DETECTED'],
            'RESOURCE_ACCESS_PATTERN': ['NEW_TAB_OPENED', 'CTRL_TAB', 'TAB_SWITCH']
        }
        logger.info("ImprovedRiskCalculator initialized")


    def calculate_risk_score(self, events: List[Dict], test_duration_minutes: int = 60, total_questions: int = 30) -> Dict[str, Any]:
        """
        Calculate improved risk score with better context awareness
        Args:
            events: List of proctoring events
            test_duration_minutes: Total test duration
            total_questions: Total number of questions in the test
        """
        # Group events by type for analysis
        event_counts = {}
        event_details: Dict[str, List[Dict]] = {}

        for event in events:
            event_type = event.get('type', 'UNKNOWN')
            if event_type not in event_counts:
                event_counts[event_type] = 0
                event_details[event_type] = []

            event_counts[event_type] += 1
            event_details[event_type].append(event)

        # Calculate question-normalized base score
        base_score = self._calculate_enhanced_base_score(event_counts, event_details, total_questions)

        # Calculate pattern-based violations
        pattern_score = self._calculate_violation_patterns(events, total_questions)

        # Calculate temporal clustering penalties
        temporal_score = self._calculate_temporal_violations(events)

        # Apply context-based adjustments
        context_adjustment = self._calculate_context_adjustments(
            event_counts, event_details, test_duration_minutes, total_questions
        )

        # Calculate final score
        total_score = base_score + pattern_score + temporal_score + context_adjustment

        # Cap at 100
        final_score = min(total_score, 100.0)
        
        high_risk_event_types = ['COPY_DETECTED', 'TAB_HIDDEN', 'TAB_SWITCH', 'NEW_TAB_OPENED']
        high_risk_per_question = sum(
            event_counts.get(event_type, 0)
            for event_type in high_risk_event_types
        ) / max(total_questions, 1)


        return {
            'total_score': final_score,
            'base_score': base_score,
            'pattern_score': pattern_score,
            'temporal_score': temporal_score,
            'context_adjustment': context_adjustment,
            'risk_category': self._get_risk_category(final_score),
            'violation_details': self._get_violation_summary(event_counts, event_details),
            'question_context': {
                'total_questions': total_questions,
                'violations_per_question': round(sum(event_counts.values()) / max(total_questions, 1), 3),
                'high_risk_per_question': round(high_risk_per_question, 3)
            }
        }

    def _calculate_enhanced_base_score(self, event_counts: Dict, event_details: Dict, total_questions: int) -> float:
        """
        Calculate base score with progressive penalties and question normalization
        """
        total_score = 0.0

        # Question-based normalization factors
        question_factor = self._get_question_normalization_factor(total_questions)

        for event_type, count in event_counts.items():
            base_weight = self.risk_weights.get(event_type, 1.0)
            
            if base_weight == 0.0:
                continue

            # Calculate violation rate per question
            violation_rate = count / max(total_questions, 1)
            
            question_multiplier = 1.0
            critical_events = ['COPY_DETECTED', 'TAB_HIDDEN', 'TAB_SWITCH', 'NEW_TAB_OPENED']
            physical_violations = ['PHONE_DETECTED', 'MULTIPLE_PEOPLE']

            # Apply question-based multiplier for critical events
            if event_type in critical_events:
                # These events are particularly concerning relative to question count
                if violation_rate >= 0.5:  # 50%+ of questions involved violations
                    question_multiplier = 3.0
                elif violation_rate >= 0.3:  # 30%+ of questions
                    question_multiplier = 2.5
                elif violation_rate >= 0.1:  # 10%+ of questions
                    question_multiplier = 2.0
                elif violation_rate >= 0.05:  # 5%+ of questions
                    question_multiplier = 1.5

                # For very small tests, single violations are more significant
                if total_questions <= 5 and count >= 1:
                    question_multiplier = max(question_multiplier, 2.0)
                elif total_questions <= 10 and count >= 2:
                    question_multiplier = max(question_multiplier, 1.8)

            elif event_type in physical_violations:
                # Critical violations - less dependent on question count but still matters
                question_multiplier = 1.0 + (violation_rate * 2.0)

            else:
                # Other events - standard question normalization
                question_multiplier = 1.0 + (violation_rate * 1.0)

            # Progressive penalty system with question context
            frequency_multiplier = 1.0
            if event_type in critical_events:
                # Severe penalties for repeated navigation/copying
                if count == 1:
                    frequency_multiplier = 1.0
                elif count <= 3:
                    frequency_multiplier = 1.0 + (count - 1) * 0.8
                else:
                    frequency_multiplier = 1.0 + 2 * 0.8 + (count - 3) * 1.2
            elif event_type in physical_violations:
                # Critical violations - severe even on first occurrence
                frequency_multiplier = min(count * 1.5, 4.0)
            else:
                # Standard progression for other events
                frequency_multiplier = min(1.0 + (count - 1) * 0.4, 2.5)

            # Calculate final event score
            event_score = base_weight * frequency_multiplier * question_multiplier * question_factor

            # Apply event-specific context
            event_score = self._apply_enhanced_context(event_type, event_details.get(event_type, []), event_score)

            total_score += event_score

        return total_score

    def _apply_enhanced_context(self, event_type: str, event_list: List, base_score: float) -> float:
        """
        Apply enhanced contextual adjustments
        """
        if not event_list:
            return base_score

        adjusted_score = base_score

        # Enhanced context for specific events
        if event_type == 'COPY_DETECTED':
            # Higher penalty if copying large amounts of text
            for event in event_list:
                text_length = event.get('extra', {}).get('text_length', 0)
                if text_length > 100:  # Likely copying full questions
                    adjusted_score *= 1.5
                elif text_length > 50:
                    adjusted_score *= 1.2

        elif event_type == 'TAB_HIDDEN':
            # Longer duration away = higher penalty
            total_duration = sum(event.get('extra', {}).get('duration_seconds', 5) for event in event_list)
            if total_duration > 60:  # More than 1 minute total
                adjusted_score *= 2.0
            elif total_duration > 30:
                adjusted_score *= 1.5

        elif event_type == 'LOOK_AWAY':
            # Significant head movements are more suspicious
            for event in event_list:
                yaw = abs(event.get('extra', {}).get('yaw', 0))
                if yaw > 70:  # Looking away significantly
                    adjusted_score *= 1.8
                elif yaw > 45:
                    adjusted_score *= 1.3

        elif event_type == 'INACTIVITY_DETECTED':
            # Very long inactivity periods are suspicious
            for event in event_list:
                duration = event.get('extra', {}).get('inactiveSeconds', 60)
                if duration > 600:  # 10+ minutes
                    adjusted_score *= 3.0
                elif duration > 300:  # 5+ minutes
                    adjusted_score *= 2.0

        return adjusted_score

    def _get_question_normalization_factor(self, total_questions: int) -> float:
        """
        Calculate normalization factor based on total questions
        More questions = lower base factor (violations are less significant per question)
        Fewer questions = higher base factor (violations are more significant)
        """
        if total_questions <= 1:
            return 2.0  # Single question - any violation is very significant
        elif total_questions <= 5:
            return 1.5  # Very short test
        elif total_questions <= 10:
            return 1.2  # Short test
        elif total_questions <= 20:
            return 1.0  # Standard test
        elif total_questions <= 50:
            return 0.9  # Long test
        else:
            return 0.8  # Very long test

    def _calculate_violation_patterns(self, events: List[Dict], total_questions: int) -> float:
        """
        Detect and penalize suspicious patterns of behavior with question context
        """
        pattern_score = 0.0

        # Create timeline of events
        timeline = sorted(events, key=lambda x: x.get('timestamp', 0))

        # Question context for pattern severity
        question_severity_factor = 1.0
        if total_questions <= 5:
            question_severity_factor = 2.0
        elif total_questions <= 10:
            question_severity_factor = 1.5
        elif total_questions >= 50:
            question_severity_factor = 0.7

        # Check for copy-search patterns (copy followed by tab switch within short time)
        copy_search_patterns = 0
        for i, event in enumerate(timeline):
            if event.get('type') == 'COPY_DETECTED':
                # Look for tab activities within next 30 seconds
                event_time = event.get('timestamp', 0)
                for j in range(i + 1, min(i + 10, len(timeline))):
                    next_event = timeline[j]
                    if next_event.get('timestamp', 0) - event_time > 30:
                        break
                    if next_event.get('type') in ['TAB_HIDDEN', 'TAB_SWITCH', 'WINDOW_BLUR']:
                        copy_search_patterns += 1
                        break

        # Apply question-based penalty for copy-search patterns
        if copy_search_patterns > 0:
            # Calculate violation rate vs questions
            pattern_rate = copy_search_patterns / max(total_questions, 1)

            if pattern_rate >= 0.5:  # 50%+ questions involved copy-search
                pattern_score += copy_search_patterns * 25.0 * question_severity_factor
            elif pattern_rate >= 0.2:  # 20%+ questions
                pattern_score += copy_search_patterns * 20.0 * question_severity_factor
            elif pattern_rate >= 0.1:  # 10%+ questions
                pattern_score += copy_search_patterns * 15.0 * question_severity_factor
            else:
                pattern_score += copy_search_patterns * 10.0 * question_severity_factor

        # Check for rapid tab switching with question context
        tab_switches = [e for e in timeline if e.get('type') in ['TAB_SWITCH', 'TAB_HIDDEN']]
        if len(tab_switches) >= 3:
            switch_rate = len(tab_switches) / max(total_questions, 1)

            # Check if 3+ switches happened within 2 minutes
            for i in range(len(tab_switches) - 2):
                if (tab_switches[i + 2].get('timestamp', 0) -
                    tab_switches[i].get('timestamp', 0)) <= 120:

                    # Penalty based on switching rate relative to questions
                    if switch_rate >= 0.3:  # Switching on 30%+ of questions
                        pattern_score += 30.0 * question_severity_factor
                    elif switch_rate >= 0.1:  # Switching on 10%+ of questions
                        pattern_score += 20.0 * question_severity_factor
                    else:
                        pattern_score += 15.0 * question_severity_factor
                    break

        return pattern_score

    def _calculate_temporal_violations(self, events: List[Dict]) -> float:
        """
        Calculate penalties for temporal clustering of violations
        """
        temporal_score = 0.0

        # Group events by 60-second windows
        time_windows: Dict[int, List] = {}
        for event in events:
            # Assuming timestamp is a float (epoch time)
            timestamp = event.get('ts').timestamp() if hasattr(event.get('ts'), 'timestamp') else event.get('timestamp', 0)
            window = int(timestamp // 60) # 60-second windows

            if window not in time_windows:
                time_windows[window] = []
            time_windows[window].append(event)

        # Penalize windows with multiple high-risk events
        high_risk_events = ['COPY_DETECTED', 'TAB_HIDDEN', 'TAB_SWITCH', 'PHONE_DETECTED', 'MULTIPLE_PEOPLE']

        for window_events in time_windows.values():
            high_risk_count = sum(1 for e in window_events
                                if e.get('type') in high_risk_events)

            if high_risk_count >= 3:
                temporal_score += high_risk_count * 8.0  # Clustering penalty

        return temporal_score

    def _calculate_context_adjustments(self, event_counts: Dict, event_details: Dict, test_duration: int, total_questions: int) -> float:
        """
        Apply context-based adjustments for test duration and overall behavior
        """
        adjustment = 0.0

        # Adjustment for test duration
        if test_duration < 30:
            duration_multiplier = 1.3
        elif test_duration > 120:
            duration_multiplier = 0.9
        else:
            duration_multiplier = 1.0

        # Question-based violation frequency assessment
        total_high_risk_events = sum(
            event_counts.get(event_type, 0)
            for event_type in ['COPY_DETECTED', 'TAB_HIDDEN', 'TAB_SWITCH', 'NEW_TAB_OPENED']
        )

        # Calculate violation-to-question ratio
        violation_ratio = total_high_risk_events / max(total_questions, 1)

        # Apply penalties based on violation density
        if violation_ratio >= 1.0:  # More violations than questions - systematic cheating
            adjustment += 40.0
        elif violation_ratio >= 0.5:  # Violations on 50%+ questions
            adjustment += 25.0
        elif violation_ratio >= 0.3:  # Violations on 30%+ questions
            adjustment += 15.0
        elif violation_ratio >= 0.1:  # Violations on 10%+ questions
            adjustment += 5.0

        # Additional penalty for very high absolute numbers (even in long tests)
        if total_high_risk_events > 20:
            adjustment += 15.0
        elif total_high_risk_events > 10:
            adjustment += 8.0

        # Question count specific adjustments
        if total_questions <= 5 and total_high_risk_events >= 2:
            # Multiple violations in very short test
            adjustment += 20.0
        elif total_questions <= 10 and total_high_risk_events >= 5:
            # Many violations in short test
            adjustment += 15.0

        return adjustment * duration_multiplier

    def _get_risk_category(self, score: float) -> str:
        """
        Determine risk category based on score
        """
        if score >= self.risk_thresholds['CRITICAL']:
            return 'CRITICAL'
        elif score >= self.risk_thresholds['HIGH']:
            return 'HIGH'
        elif score >= self.risk_thresholds['MEDIUM']:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _get_violation_summary(self, event_counts: Dict, event_details: Dict) -> Dict:
        """
        Generate summary of key violations for review
        """
        summary = {
            'high_risk_violations': {},
            'pattern_violations': [],
            'total_violations': sum(event_counts.values())
        }

        # Highlight high-risk events
        high_risk_events = ['COPY_DETECTED', 'TAB_HIDDEN', 'TAB_SWITCH', 'PHONE_DETECTED', 'MULTIPLE_PEOPLE']
        for event_type in high_risk_events:
            if event_type in event_counts:
                summary['high_risk_violations'][event_type] = event_counts[event_type]

        return summary


class LegacyRiskCalculator:
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

        logger.info("LegacyRiskCalculator initialized")

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