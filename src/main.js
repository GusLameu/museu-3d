// ============================================================================
// main.js — Ponto de entrada
// Inicializa o WebGL2, compila o programa Phong, cria a cena, configura a camera
// e a entrada, e roda o LOOP de renderizacao (requestAnimationFrame + deltaTime).
// A cada frame: atualiza Sol/animacoes/camera, limpa com a cor do ceu e desenha
// cada objeto setando seus uniforms.
// ============================================================================
import { createProgramInfo, fetchText, resizeCanvasToDisplaySize } from "./gl-utils.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { createScene, SCENE_BOUNDS, GUARD_POS } from "./scene.js";
import { mat3, mat4, vec4 } from "../libs/gl-matrix/index.js";

// Uniforms usados pelo shader Phong (resolvidos uma vez em createProgramInfo).
const UNIFORMS = [
    "uModel", "uView", "uProjection", "uNormalMatrix",
    "uLightPos", "uLightColor", "uViewPos", "uAmbient",
    "uColor", "uUseTexture", "uTexture",
    "uShininess", "uSpecularStrength", "uEmissive",
];

/** Mostra um erro de forma visivel (no overlay e no console). */
function showFatal(message) {
    console.error(message);
    const el = document.getElementById("error");
    if (el) { el.style.display = "block"; el.textContent = message; }
}

async function main() {
    const canvas = document.getElementById("glcanvas");
    // WebGL2 puro: o canvas serve APENAS para obter o contexto.
    const gl = canvas.getContext("webgl2", { antialias: true });
    if (!gl) {
        showFatal("Seu navegador nao suporta WebGL2. Use um Chrome/Firefox/Edge atual.");
        return;
    }

    // Estado global de renderizacao.
    gl.enable(gl.DEPTH_TEST);     // oclusao correta entre objetos 3D
    gl.disable(gl.CULL_FACE);     // paredes/telas sao planos vistos dos dois lados
    gl.clearColor(0.05, 0.05, 0.08, 1.0);

    // Carrega os shaders por fetch (por isso e preciso um servidor HTTP).
    let vertSrc, fragSrc;
    try {
        [vertSrc, fragSrc] = await Promise.all([
            fetchText("shaders/phong.vert"),
            fetchText("shaders/phong.frag"),
        ]);
    } catch (e) {
        showFatal("Falha ao carregar shaders. Rode por um servidor HTTP (ex.: python -m http.server). Detalhe: " + e.message);
        return;
    }

    // Modo de jogo (vem da URL, ex.: ?mode=GATINHOS!)
    const mode = new URLSearchParams(location.search).get("mode") || "padrão";

    // Sincroniza o radio button do menu com o modo atual
    const modeRadio = document.querySelector(`input[name="mode"][value="${mode}"]`);
    if (modeRadio) modeRadio.checked = true;

    // Programa Phong + cena.
    let programInfo, scene;
    try {
        programInfo = createProgramInfo(gl, vertSrc, fragSrc, UNIFORMS);
        scene = createScene(gl, mode);
    } catch (e) {
        showFatal("Erro ao iniciar a cena: " + e.message);
        return;
    }
    const { program, uniforms: U } = programInfo;

    // --- STATE MACHINE ---
    const STATE = { MENU: 0, PLAYING: 1, INSTRUCTIONS: 2 };
    let gameState = STATE.MENU;

    function setState(newState) {
        gameState = newState;
        const menuEl = document.getElementById("menu");
        const instrEl = document.getElementById("instructions");

        menuEl.classList.toggle("hidden", newState !== STATE.MENU);
        instrEl.classList.toggle("visible", newState === STATE.INSTRUCTIONS);

        if (newState === STATE.PLAYING) {
            canvas.requestPointerLock();
        } else if (document.pointerLockElement === canvas) {
            document.exitPointerLock();
        }
    }

    // Camera em 1a pessoa — spawn na frente do museu (fora, norte).
    const camera = new Camera([0, 2.2, -15], 90, -4);
    const input = new Input(canvas, camera, SCENE_BOUNDS, () => {
        if (gameState !== STATE.MENU) setState(STATE.MENU);
    });

    // Hook simples para depuracao no console do navegador (ex.: window.museu.camera).
    window.museu = { camera, scene, input };

    // Sampler de textura fixo na unidade 0.
    gl.useProgram(program);
    gl.uniform1i(U.uTexture, 0);

    // Botões do menu.
    document.getElementById("btn-start").addEventListener("click", () => {
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        if (selectedMode !== mode) {
            location.search = "?mode=" + encodeURIComponent(selectedMode);
            return;
        }
        // Força o video a tocar no GATINHOS! (precisa de interação do usuário)
        if (selectedMode === "GATINHOS!") {
            const v = document.getElementById("catvideo");
            if (v && v.paused) v.play().catch(() => {});
        }
        setState(STATE.PLAYING);
    });
    document.getElementById("btn-instructions").addEventListener("click", () => setState(STATE.INSTRUCTIONS));
    document.getElementById("btn-close-instructions").addEventListener("click", () => setState(STATE.MENU));

    // Elementos de HUD opcionais.
    const clockEl = document.getElementById("timeofday");
    const speechEl = document.getElementById("speech-bubble");
    const tmpV4 = vec4.create(), tmpM4 = mat4.create();

    // --- LOOP ---
    const nm3 = mat3.create(); // matriz normal reutilizada
    let lastMs = performance.now();

    function frame(nowMs) {
        const dt = Math.min((nowMs - lastMs) / 1000, 0.1); // deltaTime (s), com teto
        lastMs = nowMs;
        const time = nowMs / 1000;

        // Ajusta resolucao/viewport se a janela mudou de tamanho.
        if (resizeCanvasToDisplaySize(gl)) {
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        // Atualiza Sol + animacoes sempre (cena roda em background).
        scene.update(time, dt);

        // Se o modo usa video (GATINHOS!), envia o quadro atual para a GPU
        if (scene.videoUpdate) scene.videoUpdate();

        // Input e controle do jogador apenas no estado PLAYING.
        if (gameState === STATE.PLAYING) {
            input.update(dt);
        }
        document.body.classList.toggle("locked", input.locked && gameState === STATE.PLAYING);

        // Limpa usando a cor do ceu (muda com o ciclo do dia).
        const sky = scene.sun.skyColor;
        gl.clearColor(sky[0], sky[1], sky[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Uniforms por FRAME (camera + luz).
        const aspect = canvas.width / canvas.height;
        gl.useProgram(program);
        gl.uniformMatrix4fv(U.uView, false, camera.getViewMatrix());
        gl.uniformMatrix4fv(U.uProjection, false, camera.getProjectionMatrix(aspect));
        gl.uniform3fv(U.uViewPos, camera.position);
        gl.uniform3fv(U.uLightPos, scene.sun.position);
        gl.uniform3fv(U.uLightColor, scene.sun.lightColor);
        gl.uniform3fv(U.uAmbient, scene.sun.ambient);

        // Uniforms por OBJETO + desenho.
        for (const obj of scene.objects) {
            gl.uniformMatrix4fv(U.uModel, false, obj.modelMatrix);
            mat3.normalFromMat4(nm3, obj.modelMatrix); // inverse-transpose p/ normais
            gl.uniformMatrix3fv(U.uNormalMatrix, false, nm3);

            gl.uniform3fv(U.uColor, obj.color);
            gl.uniform1i(U.uUseTexture, obj.useTexture ? 1 : 0);
            gl.uniform1f(U.uShininess, obj.shininess);
            gl.uniform1f(U.uSpecularStrength, obj.specularStrength);
            gl.uniform1f(U.uEmissive, obj.emissive);

            if (obj.useTexture && obj.texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, obj.texture);
            }
            obj.mesh.draw();
        }

        // HUD: nome da fase do dia (a partir da elevacao do Sol).
        if (clockEl) {
            const e = scene.sun.elevation;
            clockEl.textContent = e > 0.35 ? "Dia" : e > -0.05 ? "Entardecer" : "Noite";
        }

        // Balão de fala: projeta a cabeça do guarda (y + scaleY/2) para coordenadas da tela.
        if (speechEl && gameState === STATE.PLAYING) {
            const guardHead = vec4.fromValues(GUARD_POS.x, GUARD_POS.y + GUARD_POS.scaleY * 0.45, GUARD_POS.z, 1);
            mat4.multiply(tmpM4, camera.getProjectionMatrix(aspect), camera.getViewMatrix());
            vec4.transformMat4(tmpV4, guardHead, tmpM4);
            if (tmpV4[3] > 0.01) {
                const nx = tmpV4[0] / tmpV4[3], ny = tmpV4[1] / tmpV4[3];
                if (nx > -1.2 && nx < 1.2 && ny > -1.2 && ny < 1.2) {
                    speechEl.style.display = "block";
                    speechEl.style.left = ((nx + 1) * 0.5 * canvas.width) + "px";
                    speechEl.style.top = ((1 - ny) * 0.5 * canvas.height) + "px";
                } else { speechEl.style.display = "none"; }
            } else { speechEl.style.display = "none"; }
        } else if (speechEl) { speechEl.style.display = "none"; }

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

main();
