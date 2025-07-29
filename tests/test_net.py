from unittest.mock import MagicMock, patch

from ff_tool.net import get


@patch('ff_tool.net.session')
def test_get_cache(mock_session):
    """
    Tests that the get function caches responses.
    """
    mock_session.get.side_effect = [
        MagicMock(status_code=200, json=lambda: {"foo": "bar"}, from_cache=False, raise_for_status=lambda: None),
        MagicMock(status_code=200, json=lambda: {"foo": "bar"}, from_cache=True, raise_for_status=lambda: None)
    ]

    # First call should not be from cache
    response1 = get("http://test.com")
    assert not response1.from_cache

    # Second call should be from cache
    response2 = get("http://test.com")
    assert response2.from_cache

    assert mock_session.get.call_count == 2
