from flask import Blueprint, request, jsonify
from extensions import db
from models import Komponiert

komponiert_bp = Blueprint('komponiert_bp', __name__)

@komponiert_bp.route("/", methods=["GET", "POST", "PUT", "DELETE"])
def handle_komponiert():
    if request.method == "GET":
        # Fetch all Komponiert records
        komponiert_list = Komponiert.query.all()
        return jsonify([{
            "id": k.kid,
            "stueckid": k.stid,
            "personid": k.pid
        } for k in komponiert_list])

    elif request.method == "POST":
        # Add a new Komponiert record
        data = request.get_json()
        new_komponiert = Komponiert(
            stid=data.get("stueckid"),
            pid=data.get("personid")
        )
        db.session.add(new_komponiert)
        db.session.commit()
        return jsonify({"message": "Komponiert added!"}), 201

    elif request.method == "PUT":
        # Update an existing Komponiert record
        data = request.get_json()
        komponiert = Komponiert.query.get(data["id"])
        if not komponiert:
            return jsonify({"message": "Komponiert not found!"}), 404

        komponiert.stid = data.get("stueckid", komponiert.stid)
        komponiert.pid = data.get("personid", komponiert.pid)

        db.session.commit()
        return jsonify({"message": "Komponiert updated!"}), 200

    elif request.method == "DELETE":
        # Delete an existing Komponiert record
        data = request.get_json()
        komponiert = Komponiert.query.get(data["id"])
        if not komponiert:
            return jsonify({"message": "Komponiert not found!"}), 404

        db.session.delete(komponiert)
        db.session.commit()
        return jsonify({"message": "Komponiert deleted!"}), 200
