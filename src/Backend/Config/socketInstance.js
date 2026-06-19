/**
 * socketInstance.js
 *
 * Implementa el patron singleton para la instancia de Socket.io.
 *
 * El problema que resuelve es una dependencia circular: si los controladores
 * importaran `io` directamente desde server.js, y server.js importa los
 * controladores, Node.js resolveria el modulo como un objeto vacio en alguno
 * de los dos extremos del ciclo.
 *
 * Solucion: server.js crea la instancia y la registra con setIO() una sola vez
 * al arrancar. Los controladores la obtienen con getIO() en tiempo de ejecucion,
 * cuando el modulo ya esta completamente cargado.
 *
 * Funciones exportadas:
 *   setIO(ioInstance) - registra la instancia. Debe llamarse exactamente una vez desde server.js
 *   getIO()           - retorna la instancia registrada. Lanza Error si se llama antes de setIO
 */
let _io = null;

export function setIO(ioInstance) {
  _io = ioInstance;
}

export function getIO() {
  if (!_io) throw new Error("Socket.io no ha sido inicializado. Llama setIO() antes de usar getIO().");
  return _io;
}
