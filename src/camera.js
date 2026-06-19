// ============================================================================
// camera.js — Camera em PRIMEIRA PESSOA (estilo FPS)
// Mantem posicao + angulos yaw/pitch e deriva os vetores front/right/up.
// Fornece a matriz de VISAO (lookAt) e a matriz de PROJECAO PERSPECTIVA.
// O pitch e travado em ~[-89, 89] graus para a camera nunca "virar de cabeca
// para baixo" (no zenite o lookAt fica degenerado).
// ============================================================================
import { vec3, mat4 } from "../libs/gl-matrix/index.js";

// --- Constantes ajustaveis (no topo, conforme pedido) ---
export const FOV_DEGREES = 60;       // campo de visao vertical
const NEAR_PLANE = 0.1;              // plano proximo
const FAR_PLANE = 250;               // plano distante (ceu/sol cabem)
const MOUSE_SENSITIVITY = 0.1;       // graus por pixel de mouse
const PITCH_LIMIT = 89;              // trava do pitch (graus)
const WORLD_UP = vec3.fromValues(0, 1, 0);

const toRad = (deg) => (deg * Math.PI) / 180;

export class Camera {
    /**
     * @param {number[]} position posicao inicial [x,y,z]
     * @param {number} yaw angulo horizontal inicial (graus); -90 olha para -Z
     * @param {number} pitch angulo vertical inicial (graus)
     */
    constructor(position = [0, 2, 8], yaw = -90, pitch = 0) {
        this.position = vec3.fromValues(position[0], position[1], position[2]);
        this.yaw = yaw;
        this.pitch = pitch;

        // Vetores de base da camera (recalculados a partir de yaw/pitch).
        this.front = vec3.create();
        this.right = vec3.create();
        this.up = vec3.create();
        this._updateVectors();
    }

    /** Recalcula front/right/up a partir de yaw e pitch (esfericas -> cartesianas). */
    _updateVectors() {
        const y = toRad(this.yaw);
        const p = toRad(this.pitch);
        this.front[0] = Math.cos(y) * Math.cos(p);
        this.front[1] = Math.sin(p);
        this.front[2] = Math.sin(y) * Math.cos(p);
        vec3.normalize(this.front, this.front);

        // right = front x worldUp (fica sempre no plano horizontal, y = 0)
        vec3.cross(this.right, this.front, WORLD_UP);
        vec3.normalize(this.right, this.right);

        // up real da camera = right x front
        vec3.cross(this.up, this.right, this.front);
        vec3.normalize(this.up, this.up);
    }

    /** Aplica o movimento do mouse (delta em pixels) ao yaw/pitch, com trava. */
    processMouse(deltaX, deltaY) {
        this.yaw += deltaX * MOUSE_SENSITIVITY;
        this.pitch -= deltaY * MOUSE_SENSITIVITY; // mouse para cima => olhar para cima
        // Trava do pitch para evitar o "gimbal flip".
        if (this.pitch > PITCH_LIMIT) this.pitch = PITCH_LIMIT;
        if (this.pitch < -PITCH_LIMIT) this.pitch = -PITCH_LIMIT;
        this._updateVectors();
    }

    /** Matriz de VISAO: mundo -> espaco da camera. */
    getViewMatrix() {
        const view = mat4.create();
        const center = vec3.create();
        vec3.add(center, this.position, this.front); // ponto para onde olhamos
        mat4.lookAt(view, this.position, center, this.up);
        return view;
    }

    /** Matriz de PROJECAO PERSPECTIVA (depende do aspecto da tela). */
    getProjectionMatrix(aspect) {
        const proj = mat4.create();
        mat4.perspective(proj, toRad(FOV_DEGREES), aspect, NEAR_PLANE, FAR_PLANE);
        return proj;
    }
}
