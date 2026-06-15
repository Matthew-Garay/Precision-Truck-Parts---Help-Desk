/**
 * Singleton del servidor Socket.io.
 * Se inicializa una sola vez desde server.js con setIO(ioInstance).
 * Los controladores lo importan con getIO() — elimina la dependencia circular
 * que existía al importar `io` directamente desde server.js.
 */
let _io = null;

export function setIO(ioInstance) {
  _io = ioInstance;
}

export function getIO() {
  if (!_io) throw new Error("Socket.io no ha sido inicializado. Llama setIO() antes de usar getIO().");
  return _io;
}
