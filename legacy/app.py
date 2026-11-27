import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv
import uuid
from datetime import datetime
from abc import ABC, abstractmethod

load_dotenv()

class ActaRepository(ABC):
    @abstractmethod
    def save(self, acta):
        pass

    @abstractmethod
    def get_all(self):
        pass

class MemoryActaRepository(ActaRepository):
    def __init__(self):
        self._actas = []

    def save(self, acta):
        self._actas.append(acta)
        return acta

    def get_all(self):
        return self._actas

class ActaService:
    def __init__(self, repository: ActaRepository):
        self.repository = repository

    def crear_acta(self, cliente, contenido):
        if not cliente or not contenido:
            raise ValueError("El cliente y el contenido son obligatorios.")

        nuevo_acta = {
            "id": str(uuid.uuid4()),
            "cliente": cliente,
            "contenido": contenido,
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "estado": "Borrador"
        }

        return self.repository.save(nuevo_acta)

    def listar_todas(self):
        return self.repository.get_all()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")

repo = MemoryActaRepository()
service = ActaService(repo)

@app.route("/")
def index():
    return jsonify({
        "proyecto": "Sistema de Organización de Datos de Escribanía",
        "estado": "Arquitectura SOLID implementada",
    })

@app.route("/actas", methods=["POST"])
def crear_acta():
    data = request.get_json() or {}
    try:
        acta = service.crear_acta(
            cliente=data.get("cliente"),
            contenido=data.get("contenido")
        )
        return jsonify({"mensaje": "Acta creada exitosamente", "acta": acta}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/actas", methods=["GET"])
def listar_actas():
    return jsonify(service.listar_todas()), 200

if __name__ == "__main__":
    app.run(debug=True)
