Collecting workspace information

Notendatenbank
Notendatenbank is a web application for managing musical scores, composers, arrangers, and related information. The application allows users to add, edit, delete, and view records of musical pieces and associated persons. It also includes user authentication to restrict access to authorized users.

Table of Contents
Features
Project Structure
Setup
Usage
API Endpoints
Contributing
License
Features
Add, edit, delete, and view musical pieces (Stueck)
Add, edit, delete, and view persons (composers and arrangers)
User authentication and authorization
Import musical pieces from JSON files
Search and sort functionality for tables
Project Structure
Setup
Prerequisites
Python 3.8+
PostgreSQL
Node.js and npm (for frontend dependencies)
Installation
Clone the repository:
Create a virtual environment and activate it:
Install the required Python packages:
Set up the PostgreSQL database and update the .env file with your database URI and secret key:
Initialize the database:
Install frontend dependencies:
Usage
Running the Application
Start the Flask application:
Open your web browser and navigate to http://localhost:5000.
Creating User Accounts
As an admin, you can create user accounts using the create_user.py script:

Importing Musical Pieces
You can import musical pieces from a JSON file using the import functionality in the web interface.

API Endpoints
Stueck
GET /api/stueck: Fetch all musical pieces
POST /api/stueck: Add a new musical piece
PUT /api/stueck: Update an existing musical piece
DELETE /api/stueck: Delete a musical piece
GET /api/stueck/<int:stid>: Fetch a single musical piece by ID
Person
GET /api/person: Fetch all persons
POST /api/person: Add a new person
PUT /api/person: Update an existing person
DELETE /api/person: Delete a person
GET /api/person/<int:pid>: Fetch a single person by ID
Komponiert
GET /api/komponiert: Fetch all composer records
POST /api/komponiert: Add a new composer record
PUT /api/komponiert: Update an existing composer record
DELETE /api/komponiert: Delete a composer record
Arrangiert
GET /api/arrangiert: Fetch all arranger records
POST /api/arrangiert: Add a new arranger record
PUT /api/arrangiert: Update an existing arranger record
DELETE /api/arrangiert: Delete an arranger record
Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

License
This project is licensed under the GPL Public License. See the LICENSE file for details.
