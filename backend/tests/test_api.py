from fastapi.testclient import TestClient
from datetime import date

def test_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

def test_seed_and_get_holidays(client: TestClient):
    # Seed holidays for 2024
    response = client.post("/api/v1/holidays/seed/2024")
    assert response.status_code == 200
    assert "Seeded" in response.json()["message"]
    
    # Get holidays for 2024
    response = client.get("/api/v1/holidays/?year=2024")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 13 # At least 13 holidays in Rwanda
    
    # Check for specific holiday
    holidays = data["items"]
    new_year = next(h for h in holidays if h["name"] == "New Year's Day")
    assert new_year["date"] == "2024-01-01"

def test_get_holidays_with_range(client: TestClient):
    # Seed 2024
    client.post("/api/v1/holidays/seed/2024")
    
    # Get holidays in July
    response = client.get("/api/v1/holidays/?start_date=2024-07-01&end_date=2024-07-31")
    assert response.status_code == 200
    data = response.json()
    # July 1 and July 4
    assert data["total"] == 2
