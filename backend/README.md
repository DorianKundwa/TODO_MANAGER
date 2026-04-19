# Rwanda Holidays API 🇷🇼

A FastAPI-based backend for managing and retrieving Rwanda's national holidays, observances, and cultural events.

## Features

- **Rwanda-Specific Holidays**: Includes all national holidays with accurate dates (fixed and movable).
- **Movable Holidays**: Logic for calculating Easter-related holidays and Islamic holidays.
- **FastAPI Backend**: High-performance RESTful API endpoints.
- **Normalized DB**: SQLite database with SQLAlchemy ORM.
- **Pydantic Models**: Strict type validation and schema enforcement.
- **Documentation**: Automatic OpenAPI (Swagger) and Redoc generation.
- **Configuration Management**: Support for different environments (Development, Staging, Production).
- **Migration Scripts**: Database versioning with Alembic.
- **Testing**: Unit and integration tests with pytest achieving high code coverage.

## Architecture

The project follows a standard FastAPI structure:
- `app/api`: API endpoints and routers.
- `app/core`: Configuration, settings, and constants.
- `app/models`: Database models (SQLAlchemy).
- `app/schemas`: Data validation and serialization (Pydantic).
- `app/services`: Business logic (holiday calculation).
- `tests`: Unit and integration tests.
- `migrations`: Alembic migration scripts.

### Prerequisites

- Python 3.9 or newer
- pip

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the API

1. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

2. Access the API documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

### Testing

Run the test suite:
```bash
pytest tests
```

### Seeding Data

You can seed holidays for a specific year using the following endpoint:
`POST /api/v1/holidays/seed/{year}`

## API Endpoints

- `GET /api/v1/holidays/`: List all holidays with filtering by year, month, or date range.
- `POST /api/v1/holidays/seed/{year}`: Seed holidays for a given year.
- `GET /`: Health check and version info.
