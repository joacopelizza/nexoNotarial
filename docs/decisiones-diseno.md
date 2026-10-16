# Documentación de Decisiones de Diseño - Taller II

## 1. Código Analizado
**Módulo:** `app.py`  
**Funcionalidad:** Proceso de Gestión de Actas Notariales (Creación y Listado).  

**Detalle de lo analizado:**
Nos enfocamos en cómo viaja la información desde que el usuario envía una solicitud hasta que el acta se guarda. Analizamos tres partes clave:
- **La ruta de Flask (`/actas` POST):** Analizamos cómo recibe los datos en formato JSON y cómo responde al usuario.
- **La clase `ActaService`:** Analizamos la lógica para validar que los datos estén completos y cómo se arma el acta (generando el ID único y la fecha).
- **La clase `ActaRepository`:** Analizamos cómo se separó la forma de guardar los datos (en este caso, una lista en memoria) del resto del programa.

Al analizar esto, nos aseguramos de que cada parte haga solo lo que le corresponde, evitando que el código se mezcle y sea difícil de entender.

## 2. Diagnóstico Técnico
Al revisar el flujo, analizamos qué pasaría si implementábamos todo de manera simple (poniendo toda la lógica dentro de la ruta de Flask).

**Riesgos detectados:**
- **Mucho trabajo para una sola función:** La ruta de Flask terminaría haciendo todo (validar, crear el acta y guardarla). Esto crea lo que se conoce como un *God Object*, una función que hace demasiadas cosas y es difícil de mantener.
- **Dependencia total (Acoplamiento):** Si el día de mañana queremos cambiar la forma en que guardamos las actas, tendríamos que modificar la ruta de Flask. Esto hace que el sistema sea frágil y propenso a errores.
- **Dificultad para probar:** No podríamos probar la lógica de creación de actas sin tener que ejecutar todo el servidor de Flask y hacer peticiones reales, lo que hace que encontrar errores sea más lento.

## 3. Alternativas Consideradas
Consideramos dos caminos posibles:

1.  **Hacerlo simple (Modelo de Scripting):** Poner toda la lógica en la ruta.
    - *Ventaja:* Se termina más rápido.
    - *Desventaja:* Se genera "deuda técnica" (problemas que habrá que arreglar después). El código se vuelve rígido y difícil de cambiar.
2.  **Hacerlo organizado (Arquitectura en Capas - Elegida):** Dividir el programa en Presentación, Negocio y Datos.
    - *Ventaja:* El código queda limpio, organizado y es muy fácil de cambiar o ampliar.
    - *Desventaja:* Hay que escribir un poco más de código al principio para crear las clases.

## 4. Decisión de Diseño y Fundamentación
Decidimos usar una arquitectura desacoplada basada en estos principios:

- **Patrón Repository & DIP:** Creamos una interfaz `ActaRepository`. Así, el `ActaService` no sabe *cómo* se guardan los datos, solo sabe que puede llamarlos. Esto aplica el **Principio de Inversión de Dependencias (DIP)** y permite cambiar la base de datos sin tocar el resto del código.
- **Capa de Servicio (SRP):** Pusimos la lógica de negocio en `ActaService`. Así, la ruta de Flask solo se encarga de recibir y enviar respuestas, mientras que el servicio se encarga de que el acta esté bien creada. Esto cumple con el **Principio de Responsabilidad Única (SRP)**.
- **Diseño para el Futuro:** Organizamos el código para que cada clase tenga una sola razón para cambiar, evitando que un cambio pequeño rompa todo el sistema.

## 5. Evidencia y Trade-offs

### Evidencia en el Código:
- **Rutas livianas:** La ruta de Flask ahora es muy corta; solo llama al servicio y maneja el error si algo sale mal.
- **Guardado flexible:** Gracias a la clase abstracta, podemos cambiar la lista en memoria por una base de datos real sin cambiar la lógica de negocio.

### Análisis de Costo/Beneficio (Trade-offs):
- **Costo:** Tuvimos que crear más clases y archivos al principio.
- **Beneficio:** Logramos un código con **Alta Cohesión** (cada parte hace lo suyo) y **Bajo Acoplamiento** (las partes no dependen rígidamente entre sí). Esto hace que el sistema sea profesional, fácil de testear y muy sencillo de mantener.
