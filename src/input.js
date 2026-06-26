// ============================================================================
// input.js — Entrada por TECLADO e MOUSE (apenas eventos nativos do DOM)
// Teclado: WASD + setas movem a camera nos eixos LOCAIS (frente/lado), no plano
// horizontal (estilo caminhada). Mouse: Pointer Lock para "olhar" livremente.
// Todo movimento usa deltaTime para ficar independente da taxa de quadros.
// ============================================================================
import { vec3 } from "../libs/gl-matrix/index.js";

// --- Constantes ajustaveis ---
const MOVE_SPEED = 6.0;        // unidades por segundo
const RUN_MULTIPLIER = 2.0;    // segurar Shift para correr
const EYE_HEIGHT = 2.2;        // altura dos "olhos" (camera nao sobe/desce ao andar)

export class Input {
    /**
     * @param {HTMLCanvasElement} canvas elemento que recebe o Pointer Lock
     * @param {import('./camera.js').Camera} camera camera controlada
     * @param {{minX:number,maxX:number,minZ:number,maxZ:number}} bounds limites do salao (colisao simples)
     * @param {()=>void} onUnlock callback quando o Pointer Lock for perdido (ESC)
     */
    constructor(canvas, camera, bounds, onUnlock) {
        this.canvas = canvas;
        this.camera = camera;
        this.bounds = bounds;
        this.keys = new Set();   // teclas pressionadas no momento
        this.locked = false;     // Pointer Lock ativo?
        this.onUnlock = onUnlock || (() => {});

        this._initKeyboard();
        this._initMouse();
    }

    _initKeyboard() {
        window.addEventListener("keydown", (e) => {
            this.keys.add(e.code);
            // Evita a pagina rolar quando usamos as setas/espaco.
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    }

    _initMouse() {
        // Atualiza o estado de trava quando o navegador confirma a mudanca.
        document.addEventListener("pointerlockchange", () => {
            this.locked = document.pointerLockElement === this.canvas;
            if (!this.locked) this.onUnlock();
        });
        // So giramos a camera quando o Pointer Lock esta ativo (movimentos relativos).
        document.addEventListener("mousemove", (e) => {
            if (this.locked) this.camera.processMouse(e.movementX, e.movementY);
        });
    }

    /**
     * Aplica o movimento do quadro atual.
     * @param {number} dt deltaTime em segundos
     */
    update(dt) {
        const cam = this.camera;
        const speed = MOVE_SPEED * (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? RUN_MULTIPLIER : 1) * dt;

        // "Frente" horizontal: ignora o componente Y para a caminhada ficar nivelada
        // (olhar para cima/baixo nao faz voar).
        const forward = vec3.fromValues(cam.front[0], 0, cam.front[2]);
        vec3.normalize(forward, forward);
        const right = cam.right; // ja e horizontal por construcao

        const move = vec3.create();
        if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) vec3.scaleAndAdd(move, move, forward, 1);
        if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) vec3.scaleAndAdd(move, move, forward, -1);
        if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) vec3.scaleAndAdd(move, move, right, 1);
        if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) vec3.scaleAndAdd(move, move, right, -1);

        // Normaliza para a diagonal nao ser mais rapida que andar reto.
        if (vec3.length(move) > 0) {
            vec3.normalize(move, move);
            vec3.scaleAndAdd(cam.position, cam.position, move, speed);
        }

        // Colisao simples: mantem a camera dentro do salao e na altura dos olhos.
        const b = this.bounds;
        cam.position[0] = Math.max(b.minX, Math.min(b.maxX, cam.position[0]));
        cam.position[2] = Math.max(b.minZ, Math.min(b.maxZ, cam.position[2]));
        cam.position[1] = EYE_HEIGHT;
    }
}
