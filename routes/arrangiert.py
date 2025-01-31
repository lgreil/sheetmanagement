from flask import Blueprint, request, jsonify
from extensions import db
from models import Arrangiert

arrangiert_bp = Blueprint('arrangiert_bp', __name__)

@arrangiert_bp.route("/", methods=["GET", "POST", "PUT", "DELETE"])
def handle_arrangiert():
    if request.method == "GET":
        # Fetch all Arrangiert records
        arrangiert_list = Arrangiert.query.all()
        return jsonify([{
            "id": a.aid,
            "stueckid": a.stid,
            "personid": a.pid
        } for a in arrangiert_list])

    elif request.method == "POST":
        # Add a new Arrangiert record
        data = request.get_json()
        new_arrangiert = Arrangiert(
            stid=data.get("stueckid"),
            pid=data.get("personid")
        )
        db.session.add(new_arrangiert)
        db.session.commit()
        return jsonify({"message": "Arrangiert added!"}), 201

    elif request.method == "PUT":
        # Update an existing Arrangiert record
        data = request.get_json()
        arrangiert = Arrangiert.query.get(data["id"])
        if not arrangiert:
            return jsonify({"message": "Arrangiert not found!"}), 404

        arrangiert.stid = data.get("stueckid", arrangiert.stid)
        arrangiert.pid = data.get("personid", arrangiert.pid)

        db.session.commit()
        return jsonify({"message": "Arrangiert updated!"}), 200

    elif request.method == "DELETE":
        # Delete an existing Arrangiert record
        data = request.get_json()
        arrangiert = Arrangiert.query.get(data["id"])
        if not arrangiert:
            return jsonify({"message": "Arrangiert not found!"}), 404

        db.session.delete(arrangiert)
        db.session.commit()
        return jsonify({"message": "Arrangiert deleted!"}), 200
