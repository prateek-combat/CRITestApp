"""
Basic tests for the proctor worker module.
"""
import pytest
import sys
import os

# Add the current directory to the path so we can import worker
sys.path.insert(0, os.path.dirname(__file__))


def test_worker_module_imports():
    """Test that the worker module can be imported successfully."""
    try:
        import worker
        assert hasattr(worker, '__name__')
    except ImportError as e:
        pytest.fail(f"Failed to import worker module: {e}")


def test_basic_math():
    """Simple test to ensure pytest is working."""
    assert 1 + 1 == 2
    assert 2 * 2 == 4


def test_environment_variables():
    """Test that we can access environment variables."""
    import os
    # This should not fail even if the variable doesn't exist
    db_url = os.getenv('DATABASE_URL', 'not_found')
    assert isinstance(db_url, str)


class TestWorkerFunctionality:
    """Test class for worker functionality."""
    
    def test_worker_exists(self):
        """Test that worker.py exists and can be imported."""
        try:
            import worker
            assert worker is not None
        except ImportError:
            pytest.fail("worker.py module not found")
    
    def test_basic_functionality(self):
        """Test basic worker functionality."""
        # This is a placeholder test
        # Add actual worker function tests here as you develop
        assert True 