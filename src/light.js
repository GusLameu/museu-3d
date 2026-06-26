// ============================================================================
// light.js — O "Sol": luz pontual ANIMADA que percorre um arco no ceu
// A cada frame, update(time) recalcula:
//   - position      -> posicao da luz (sobe e desce num arco leste->oeste)
//   - lightColor    -> cor * intensidade (branca/quente ao meio-dia, laranja no
//                      entardecer, fraca a noite)
//   - ambient       -> luz ambiente do ciclo (clara de dia, azul-escura a noite)
//   - skyColor      -> cor de fundo do ceu, acompanhando o ciclo
//   - emissiveColor -> cor da ESFERA visivel do Sol (objeto emissivo)
// Isso atende ao requisito de >=1 fonte de luz EM MOVIMENTO e dah o clima
// dia -> entardecer pedido no conceito.
// ============================================================================
import { vec3 } from "../libs/gl-matrix/index.js";

// --- Constantes ajustaveis ---
const DAY_CYCLE_SECONDS = 42;   // duracao de um ciclo completo (dia+noite)
const SUN_ARC_RADIUS = 62;      // alcance horizontal do arco (leste-oeste)
const SUN_ARC_HEIGHT = 48;      // altura maxima do Sol (meio-dia)
const SUN_ARC_Z = -6;           // leve deslocamento em Z (arco nao passa exatamente sobre a cabeca)
const SUN_START_PHASE = 0.12;   // comeca com o Sol alto (cena ja bem iluminada)

// Paletas do ciclo (cor base da luz e do ceu em cada fase).
const LIGHT_WARM = [1.0, 0.55, 0.28];  // luz do entardecer (alaranjada)
const LIGHT_NOON = [1.0, 0.97, 0.90];  // luz do meio-dia (branca quente)
const AMBIENT_NIGHT = [0.07, 0.08, 0.14];
const AMBIENT_DAY = [0.32, 0.32, 0.34];
const SKY_NIGHT = [0.03, 0.04, 0.10];
const SKY_SUNSET = [0.96, 0.46, 0.26];
const SKY_DAY = [0.45, 0.63, 0.86];
const SUN_DISK_LOW = [1.0, 0.36, 0.12];  // disco do Sol perto do horizonte
const SUN_DISK_HIGH = [1.0, 0.96, 0.82]; // disco do Sol alto no ceu

// --- Helpers numericos ---
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}
/** Interpola linearmente dois vec3 (arrays) -> grava em out. */
function lerp3(out, a, b, t) {
    out[0] = a[0] + (b[0] - a[0]) * t;
    out[1] = a[1] + (b[1] - a[1]) * t;
    out[2] = a[2] + (b[2] - a[2]) * t;
    return out;
}

export class Sun {
    constructor() {
        this.position = vec3.create();
        this.lightColor = vec3.create();
        this.ambient = vec3.create();
        this.skyColor = vec3.create();
        this.emissiveColor = vec3.create();
        this.elevation = 0; // -1 (meia-noite) .. 1 (meio-dia), util para HUD
        this.update(0);
    }

    /**
     * Recalcula toda a iluminacao do ciclo em funcao do tempo decorrido.
     * @param {number} time tempo em segundos desde o inicio
     */
    update(time) {
        // Angulo do Sol no arco. Avanca continuamente -> dia e noite se alternam.
        const angle = (time / DAY_CYCLE_SECONDS + SUN_START_PHASE) * 2 * Math.PI;
        const elev = Math.sin(angle); // altura normalizada (-1..1)
        this.elevation = elev;

        // Posicao: leste(+X) -> zenite(+Y) -> oeste(-X), com leve Z fixo.
        this.position[0] = Math.cos(angle) * SUN_ARC_RADIUS;
        this.position[1] = elev * SUN_ARC_HEIGHT;
        this.position[2] = SUN_ARC_Z;

        const t = clamp(elev, 0, 1);              // 0 no horizonte, 1 no zenite
        const dayAmount = smoothstep(-0.10, 0.28, elev); // 0 a noite, 1 de dia

        // Cor + intensidade da luz: quente/fraca embaixo, branca/forte no alto.
        const base = lerp3([0, 0, 0], LIGHT_WARM, LIGHT_NOON, smoothstep(0.05, 0.6, t));
        const intensity = 0.20 + 1.70 * t;
        vec3.scale(this.lightColor, base, intensity);

        // Luz ambiente acompanha o ciclo (nunca deixa a cena 100% preta).
        lerp3(this.ambient, AMBIENT_NIGHT, AMBIENT_DAY, dayAmount);

        // Ceu: combinacao ponderada de noite + entardecer + dia.
        const wNight = clamp(1 - smoothstep(-0.20, 0.05, elev), 0, 1);
        const wDay = clamp(smoothstep(0.20, 0.55, elev), 0, 1);
        const wSet = clamp(1 - wNight - wDay, 0, 1);
        this.skyColor[0] = SKY_NIGHT[0] * wNight + SKY_SUNSET[0] * wSet + SKY_DAY[0] * wDay;
        this.skyColor[1] = SKY_NIGHT[1] * wNight + SKY_SUNSET[1] * wSet + SKY_DAY[1] * wDay;
        this.skyColor[2] = SKY_NIGHT[2] * wNight + SKY_SUNSET[2] * wSet + SKY_DAY[2] * wDay;

        // Cor do disco (esfera emissiva) do Sol.
        lerp3(this.emissiveColor, SUN_DISK_LOW, SUN_DISK_HIGH, smoothstep(0.0, 0.5, t));
    }
}
