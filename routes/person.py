from flask import Blueprint, request, jsonify
from extensions import db
from models import Person, Komponiert, Arrangiert

person_bp = Blueprint('person_bp', __name__)

@person_bp.route("/", methods=["GET", "POST", "PUT", "DELETE"])
def handle_person():
    if request.method == "GET":
        # Fetch all Person records
        person_list = Person.query.all()
        return jsonify([{
            "pid": p.pid,
            "vorname": p.vorname,
            "name": p.name,
            "appearances": Komponiert.query.filter_by(pid=p.pid).count() + Arrangiert.query.filter_by(pid=p.pid).count()
        } for p in person_list])

    elif request.method == "POST":
        # Add a new Person record
        data = request.get_json()
        new_person = Person(
            vorname=data["vorname"],
            name=data["name"]
        )
        db.session.add(new_person)
        db.session.commit()
        return jsonify({"message": "Person added!", "pid": new_person.pid}), 201

    elif request.method == "PUT":
        # Update an existing Person record
        data = request.get_json()
        person = Person.query.get(data["pid"])
        if not person:
            return jsonify({"message": "Person not found!"}), 404

        person.vorname = data.get("vorname", person.vorname)
        person.name = data.get("name", person.name)

        db.session.commit()
        return jsonify({"message": "Person updated!"}), 200

    elif request.method == "DELETE":
        # Delete an existing Person record
        data = request.get_json()
        person = Person.query.get(data["pid"])
        if not person:
            return jsonify({"message": "Person not found!"}), 404

        # Check if the person is used in Komponiert or Arrangiert tables
        if Komponiert.query.filter_by(pid=person.pid).count() > 0 or Arrangiert.query.filter_by(pid=person.pid).count() > 0:
            return jsonify({"message": "Cannot delete person, they are still used in another table."}), 400

        db.session.delete(person)
        db.session.commit()
        return jsonify({"message": "Person deleted!"}), 200

@person_bp.route("/<int:pid>", methods=["GET"])
def get_person(pid):
    # Fetch a single Person record by ID
    person = Person.query.get(pid)
    if not person:
        return jsonify({"message": "Person not found!"}), 404

    return jsonify({
        "pid": person.pid,
        "vorname": person.vorname,
        "name": person.name,
        "appearances": Komponiert.query.filter_by(pid=person.pid).count() + Arrangiert.query.filter_by(pid=person.pid).count()
    })
