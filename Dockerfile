FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev

COPY src/ ./src/

ENTRYPOINT ["poetry", "run", "ff-tool"]
