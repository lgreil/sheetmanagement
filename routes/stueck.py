from flask import Blueprint, request, jsonify
from extensions import db
from models import Stueck, Komponiert, Arrangiert, Person
import logging

logging.basicConfig(level=logging.ERROR)
stueck_bp = Blueprint('stueck_bp', __name__)

@stueck_bp.route("/", methods=["GET", "POST", "PUT", "DELETE"])
def handle_stueck():
    if request.method == "GET":
        # Fetch all Stueck records
        stueck_list = Stueck.query.all()
        return jsonify([{
            "stid": s.stid,
            "name": s.name,
            "genre": s.genre,
            "jahr": s.jahr,
            "schwierigkeit": s.schwierigkeit,
            "isdigitalisiert": s.isdigitalisiert,
            "composers": [f"{c.person.vorname} {c.person.name}" for c in s.composers],
            "arrangers": [f"{a.person.vorname} {a.person.name}" for a in s.arrangers]
        } for s in stueck_list])

    elif request.method == "POST":
        data = request.get_json()
    
        try:
            new_stueck = Stueck(
                name=data['name'],
                genre=data['genre'],
                jahr=data['jahr'],
                schwierigkeit=data['schwierigkeit'],
                isdigitalisiert=data['isdigitalisiert']
            )
            db.session.add(new_stueck)
            db.session.commit()

            # Handle composers
            if 'composer_ids' in data:
                for composer_id in data['composer_ids']:
                    new_komponiert = Komponiert(stid=new_stueck.stid, pid=composer_id)
                    db.session.add(new_komponiert)

            # Handle arrangers
            if 'arranger_ids' in data:
                for arranger_id in data['arranger_ids']:
                    new_arrangiert = Arrangiert(stid=new_stueck.stid, pid=arranger_id)
                    db.session.add(new_arrangiert)

            db.session.commit()
            return jsonify({'message': 'Stueck added successfully!'}), 201
        except Exception as e:
            logging.error("Error occurred while adding Stueck: %s", str(e))
            return jsonify({'error': 'An internal error has occurred!'}), 400

    elif request.method == "PUT":
        # Update an existing Stueck record
        data = request.get_json()
        stueck = Stueck.query.get(data["stid"])
        if not stueck:
            return jsonify({"message": "Stueck not found!"}), 404

        stueck.name = data["name"]
        stueck.genre = data["genre"]
        stueck.jahr = data["jahr"]
        stueck.schwierigkeit = data["schwierigkeit"]
        stueck.isdigitalisiert = data["isdigitalisiert"]

        db.session.commit()

        # Update Komponiert and Arrangiert tables
        Komponiert.query.filter_by(stid=stueck.stid).delete()
        Arrangiert.query.filter_by(stid=stueck.stid).delete()

        if 'composer_ids' in data:
            for composer_id in data['composer_ids']:
                new_komponiert = Komponiert(stid=stueck.stid, pid=composer_id)
                db.session.add(new_komponiert)

        if 'arranger_ids' in data:
            for arranger_id in data['arranger_ids']:
                new_arrangiert = Arrangiert(stid=stueck.stid, pid=arranger_id)
                db.session.add(new_arrangiert)

        db.session.commit()
        return jsonify({"message": "Stueck updated!"}), 200

    elif request.method == "DELETE":
        # Delete an existing Stueck record
        data = request.get_json()
        stueck = Stueck.query.get(data["stid"])
        if not stueck:
            return jsonify({"message": "Stueck not found!"}), 404

        # Delete associated Komponiert and Arrangiert records
        Komponiert.query.filter_by(stid=stueck.stid).delete()
        Arrangiert.query.filter_by(stid=stueck.stid).delete()

        db.session.delete(stueck)
        db.session.commit()
        return jsonify({"message": "Stueck deleted!"}), 200

@stueck_bp.route("/<int:stid>", methods=["GET"])
def get_stueck(stid):
    # Fetch a single Stueck record by ID
    stueck = Stueck.query.get(stid)
    if not stueck:
        return jsonify({"message": "Stueck not found!"}), 404

    return jsonify({
        "stid": stueck.stid,
        "name": stueck.name,
        "genre": stueck.genre,
        "jahr": stueck.jahr,
        "schwierigkeit": stueck.schwierigkeit,
        "isdigitalisiert": stueck.isdigitalisiert,
        "composers": [f"{c.person.vorname} {c.person.name}" for c in stueck.composers],
        "arrangers": [f"{a.person.vorname} {a.person.name}" for a in stueck.arrangers]
    })
