# Sheetmusic Database

This is a Flask-based web application for managing a database of musical pieces, composers, and arrangers.

## Features

- User authentication (login/logout)
- CRUD operations for musical pieces, composers, and arrangers

## Setup

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Create a virtual environment and activate it:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the dependencies:
    ```sh
    pip install -r requirements.txt
    ```

4. Create a `.env` file in the project root and add the following environment variables:
    ```
    DATABASE_URI=<your-database-uri>
    SECRET_KEY=<your-secret-key>
    ```

5. Initialize the database:
    ```sh
    flask db upgrade
    ```

6. Run the application:
    ```sh
    flask run
    ```

## Usage

- Access the application at `http://localhost:5000`
- Login with your credentials
- Use the provided routes to manage musical pieces, composers, and arrangers

## Routes

- `/api/stueck` - Manage musical pieces
- `/api/person` - Manage composers and arrangers
- `/api/komponiert` - Manage compositions
- `/api/arrangiert` - Manage arrangements

## License

This project is licensed under the MIT License.
