// ============================================================================
// scene.js — Montagem da CENA (orientada a dados)
// createScene() cria as malhas (geometria procedural), carrega as texturas e
// devolve uma LISTA de objetos. Cada objeto e um dado simples:
//   { mesh, modelMatrix, color, useTexture, texture, shininess,
//     specularStrength, emissive, update(time, dt) }
// O main.js so percorre essa lista e desenha — nao conhece "o que" e cada coisa.
// Tambem devolve o Sol (luz animada) e um update() central da cena.
//
// CONCEITO: um patio/galeria de esculturas a CEU ABERTO ao entardecer (sem teto,
// para o Sol percorrer o ceu visivelmente). Chao de MADEIRA com faixa de MARMORE,
// paredes com QUADROS texturizados, PEDESTAIS de cor solida com esculturas
// geometricas e uma escultura central GIRANDO.
// ============================================================================
import { mat4 } from "../libs/gl-matrix/index.js";
import { Mesh } from "./mesh.js";
import { loadTexture } from "./texture.js";
import { Sun } from "./light.js";
import {
    createPlane, createQuad, createBox, createSphere, createCylinder, createTorus,
} from "./geometry.js";

// --- Dimensoes do salao (constantes ajustaveis) ---
const FLOOR_W = 34;   // largura (X)
const FLOOR_D = 26;   // profundidade (Z)
const WALL_H = 7;     // altura das paredes

// --- Dimensoes da entrada (parede norte) ---
const ENTRANCE_W = 3.5;   // largura da abertura
const ENTRANCE_H = 4.5;   // altura da abertura

// Segmentos de parede nos lados da entrada.
const northSegW = (FLOOR_W - ENTRANCE_W) / 2;
const leftWallCenter = -(FLOOR_W + ENTRANCE_W) / 4;
const rightWallCenter = (FLOOR_W + ENTRANCE_W) / 4;

// Limites de caminhada — estendido para fora (norte) e dentro (sul).
export const SCENE_BOUNDS = {
    minX: -FLOOR_W / 2 + 1.5, maxX: FLOOR_W / 2 - 1.5,
    minZ: -FLOOR_D / 2 - 4, maxZ: FLOOR_D / 2 - 1.5,
};

// Cores de moldura reutilizadas.
const FRAME_DARK = [0.14, 0.09, 0.05];
const FRAME_GOLD = [0.55, 0.42, 0.16];

/** Monta uma matriz de modelo a partir de posicao, rotacao (Euler) e escala. */
function makeModel(position, euler = [0, 0, 0], scale = [1, 1, 1]) {
    const m = mat4.create();
    mat4.translate(m, m, position);
    mat4.rotateY(m, m, euler[1]);
    mat4.rotateX(m, m, euler[0]);
    mat4.rotateZ(m, m, euler[2]);
    mat4.scale(m, m, scale);
    return m;
}

/**
 * Cria toda a cena.
 * @param {WebGL2RenderingContext} gl
 * @returns {{objects:Array, sun:Sun, update:(time:number,dt:number)=>void}}
 */
export function createScene(gl) {
    // ---------------------------------------------------------------------
    // 1) MALHAS (criadas uma vez e reaproveitadas por varios objetos)
    // ---------------------------------------------------------------------
    const meshes = {
        floor: new Mesh(gl, createPlane(FLOOR_W, FLOOR_D, 8)),       // ladrilho 8x
        marbleStrip: new Mesh(gl, createPlane(11, 8, 3)),           // faixa central de marmore
        wallNS: new Mesh(gl, createQuad(1, 1, FLOOR_W / 3.5, WALL_H / 3.5)),
        wallNSLeft: new Mesh(gl, createQuad(1, 1, northSegW / 3.5, WALL_H / 3.5)),
        wallNSRight: new Mesh(gl, createQuad(1, 1, northSegW / 3.5, WALL_H / 3.5)),
        wallEW: new Mesh(gl, createQuad(1, 1, FLOOR_D / 3.5, WALL_H / 3.5)),
        canvas: new Mesh(gl, createQuad(1, 1)),                      // tela do quadro
        box: new Mesh(gl, createBox(1, 1, 1)),
        sphere: new Mesh(gl, createSphere(1, 32, 32)),
        sunSphere: new Mesh(gl, createSphere(1, 24, 24)),
        cylinder: new Mesh(gl, createCylinder(1, 1, 40)),
        torus: new Mesh(gl, createTorus(1, 0.32, 64, 32)),
        torusSmall: new Mesh(gl, createTorus(1, 0.4, 40, 20)),
    };

    // ---------------------------------------------------------------------
    // 2) TEXTURAS (carga assincrona com placeholder)
    // ---------------------------------------------------------------------
    const TX = "assets/textures/";
    const tex = {
        wood: loadTexture(gl, TX + "wood_floor.png"),
        marble: loadTexture(gl, TX + "marble.png"),
        wall: loadTexture(gl, TX + "wall.png"),
        paintings: [1, 2, 3, 4, 5, 6].map((i) => loadTexture(gl, TX + `painting${i}.png`, { repeat: false })),
        guard: loadTexture(gl, TX + "guard.png", { repeat: false }),
        sign: loadTexture(gl, TX + "sign.png", { repeat: false }),
    };

    const objects = [];
    const animated = []; // objetos com update() (animacao por transformacao)

    // pequeno helper para adicionar objetos com valores-padrao de material
    function add(o) {
        const obj = {
            mesh: o.mesh,
            modelMatrix: o.modelMatrix || makeModel(o.position, o.euler, o.scale),
            color: o.color || [1, 1, 1],
            useTexture: !!o.texture,
            texture: o.texture || null,
            shininess: o.shininess ?? 32,
            specularStrength: o.specularStrength ?? 0.3,
            emissive: o.emissive ? 1 : 0,
            update: o.update || null,
        };
        objects.push(obj);
        if (obj.update) animated.push(obj);
        return obj;
    }

    // ---------------------------------------------------------------------
    // 3) CHAO (madeira) + faixa central de MARMORE  -> objetos TEXTURIZADOS
    // ---------------------------------------------------------------------
    add({ mesh: meshes.floor, position: [0, 0, 0], texture: tex.wood, shininess: 24, specularStrength: 0.12 });
    add({ mesh: meshes.marbleStrip, position: [0, 0.02, 0], texture: tex.marble, shininess: 80, specularStrength: 0.45 });

    // ---------------------------------------------------------------------
    // 4) PAREDES (reboco texturizado) — patio aberto, sem teto
    // ---------------------------------------------------------------------
    const wallMat = { shininess: 8, specularStrength: 0.05, texture: tex.wall };
    add({ mesh: meshes.wallNSLeft, position: [leftWallCenter, WALL_H / 2, -FLOOR_D / 2], euler: [0, 0, 0], scale: [northSegW, WALL_H, 1], ...wallMat });
    add({ mesh: meshes.wallNSRight, position: [rightWallCenter, WALL_H / 2, -FLOOR_D / 2], euler: [0, 0, 0], scale: [northSegW, WALL_H, 1], ...wallMat });
    add({ mesh: meshes.wallNS, position: [0, WALL_H / 2, FLOOR_D / 2], euler: [0, Math.PI, 0], scale: [FLOOR_W, WALL_H, 1], ...wallMat });
    add({ mesh: meshes.wallEW, position: [FLOOR_W / 2, WALL_H / 2, 0], euler: [0, -Math.PI / 2, 0], scale: [FLOOR_D, WALL_H, 1], ...wallMat });
    add({ mesh: meshes.wallEW, position: [-FLOOR_W / 2, WALL_H / 2, 0], euler: [0, Math.PI / 2, 0], scale: [FLOOR_D, WALL_H, 1], ...wallMat });

    // Rodape de MARMORE nas paredes (reforca o estilo "misto" madeira + marmore).
    const baseMat = { texture: tex.marble, shininess: 80, specularStrength: 0.4 };
    add({ mesh: meshes.box, position: [leftWallCenter, 0.5, -FLOOR_D / 2 + 0.15], scale: [northSegW, 1, 0.3], ...baseMat });
    add({ mesh: meshes.box, position: [rightWallCenter, 0.5, -FLOOR_D / 2 + 0.15], scale: [northSegW, 1, 0.3], ...baseMat });
    add({ mesh: meshes.box, position: [0, 0.5, FLOOR_D / 2 - 0.15], scale: [FLOOR_W, 1, 0.3], ...baseMat });
    add({ mesh: meshes.box, position: [FLOOR_W / 2 - 0.15, 0.5, 0], scale: [0.3, 1, FLOOR_D], ...baseMat });
    add({ mesh: meshes.box, position: [-FLOOR_W / 2 + 0.15, 0.5, 0], scale: [0.3, 1, FLOOR_D], ...baseMat });

    // ---------------------------------------------------------------------
    // 5) QUADROS emoldurados (TEXTURIZADOS) distribuidos pelas 4 paredes
    // ---------------------------------------------------------------------
    // Config por parede: rotacao da normal e funcao que posiciona ao longo dela.
    const WALLS = {
        north: { rot: 0, normal: [0, 0, 1], pos: (a) => [a, 3.6, -FLOOR_D / 2 + 0.18] },
        south: { rot: Math.PI, normal: [0, 0, -1], pos: (a) => [a, 3.6, FLOOR_D / 2 - 0.18] },
        east: { rot: -Math.PI / 2, normal: [-1, 0, 0], pos: (a) => [FLOOR_W / 2 - 0.18, 3.6, a] },
        west: { rot: Math.PI / 2, normal: [1, 0, 0], pos: (a) => [-FLOOR_W / 2 + 0.18, 3.6, a] },
    };
    function addPainting(wallKey, along, texture, frameColor) {
        const w = WALLS[wallKey];
        const c = w.pos(along);
        const f = [c[0] - 0.09 * w.normal[0], c[1] - 0.09 * w.normal[1], c[2] - 0.09 * w.normal[2]];
        // Moldura (caixa fina, COR SOLIDA) um pouco atras...
        add({ mesh: meshes.box, position: f, euler: [0, w.rot, 0], scale: [3.15, 3.15, 0.12], color: frameColor, shininess: 40, specularStrength: 0.3 });
        // ...e a tela (quad TEXTURIZADO) na frente.
        add({ mesh: meshes.canvas, position: c, euler: [0, w.rot, 0], scale: [2.8, 2.8, 1], texture, shininess: 24, specularStrength: 0.16 });
    }
    const P = tex.paintings;
    addPainting("north", -11, P[0], FRAME_GOLD);
    addPainting("north", 11, P[2], FRAME_GOLD);
    addPainting("south", -8, P[3], FRAME_DARK);
    addPainting("south", 8, P[4], FRAME_DARK);
    addPainting("east", -6, P[5], FRAME_GOLD);
    addPainting("east", 6, P[0], FRAME_DARK);
    addPainting("west", -6, P[2], FRAME_DARK);
    addPainting("west", 6, P[4], FRAME_GOLD);

    // ---------------------------------------------------------------------
    // 6) ENTRADA DO MUSEU — parede norte (z = -FLOOR_D/2)
    // ---------------------------------------------------------------------
    const STONE_LIGHT = [0.75, 0.72, 0.68];
    const METAL = [0.35, 0.35, 0.40];
    const NZ = -FLOOR_D / 2; // atalho para posicao Z da parede norte

    // --- Arquitetonico: pilares + verga (lintel) + soleira ---
    const halfEntry = ENTRANCE_W / 2;
    add({ mesh: meshes.box, position: [-halfEntry - 0.2, ENTRANCE_H / 2, NZ], scale: [0.25, ENTRANCE_H, 0.25], color: STONE_LIGHT, shininess: 40, specularStrength: 0.3 });
    add({ mesh: meshes.box, position: [halfEntry + 0.2, ENTRANCE_H / 2, NZ], scale: [0.25, ENTRANCE_H, 0.25], color: STONE_LIGHT, shininess: 40, specularStrength: 0.3 });
    add({ mesh: meshes.box, position: [0, ENTRANCE_H + 0.15, NZ], scale: [ENTRANCE_W + 0.65, 0.3, 0.3], color: STONE_LIGHT, shininess: 40, specularStrength: 0.3 });
    add({ mesh: meshes.box, position: [0, 0.05, NZ], scale: [ENTRANCE_W, 0.1, 0.5], color: [0.5, 0.5, 0.5], shininess: 40, specularStrength: 0.3 });

    // --- FACHADA EXTERNA (lado norte, z < NZ) ---
    const FZ = NZ - 0.05; // plano da fachada (fora)
    // Platibanda / cornija acima da entrada (fora)
    add({ mesh: meshes.box, position: [0, ENTRANCE_H + 0.5, FZ], scale: [ENTRANCE_W + 1.2, 0.5, 0.6], color: STONE_LIGHT, shininess: 40, specularStrength: 0.3 });
    // Frontão triangular (degraus)
    const pedSteps = [
        [ENTRANCE_W + 0.8, 0.25, 0.5, ENTRANCE_H + 1.0],
        [ENTRANCE_W + 0.4, 0.25, 0.5, ENTRANCE_H + 1.4],
        [ENTRANCE_W, 0.25, 0.5, ENTRANCE_H + 1.7],
        [ENTRANCE_W - 0.6, 0.25, 0.5, ENTRANCE_H + 1.9],
    ];
    for (const [w, h, d, y] of pedSteps) {
        add({ mesh: meshes.box, position: [0, y, FZ], scale: [w, h, d], color: STONE_LIGHT, shininess: 40, specularStrength: 0.3 });
    }

    // --- Placa "sign.png" na FACHADA (lado ESQUERDO, perto da porta) ---
    const signX = -halfEntry - 1.5;
    const signY = 2.2;
    const signW = 2.0;
    const signH = 1.0;
    // Moldura (fora)
    add({ mesh: meshes.box, position: [signX, signY, FZ - 0.05], scale: [signW + 0.2, signH + 0.2, 0.08], color: FRAME_GOLD, shininess: 60, specularStrength: 0.5 });
    // Placa texturizada na fachada (voltada para -Z)
    add({
        mesh: meshes.canvas, position: [signX, signY, FZ], euler: [0, Math.PI, 0], scale: [signW, signH, 1],
        texture: tex.sign, shininess: 16, specularStrength: 0.1, emissive: 0.6,
    });

    // --- Guarda na FACHADA (lado direito, grande, sempre de frente) ---
    const gx = halfEntry + 1.5, gy = 1.9, gz = NZ - 1.5;
    const gScale = [1.8, 3.6, 1];
    add({
        mesh: meshes.canvas, position: [gx, gy, gz], scale: gScale,
        texture: tex.guard, shininess: 8, specularStrength: 0.05,
        update(_t, _dt, obj) {
            const cam = window.museu.camera;
            obj.modelMatrix = makeModel([gx, gy, gz], [0, Math.atan2(cam.position[0] - gx, cam.position[2] - gz), 0], gScale);
        },
    });

    // --- Seguranca: catraca ---
    add({ mesh: meshes.cylinder, position: [halfEntry + 1.4, 0.35, NZ + 1.2], scale: [0.25, 0.7, 0.25], color: METAL, shininess: 50, specularStrength: 0.4 });
    add({ mesh: meshes.box, position: [halfEntry + 1.4, 0.75, NZ + 1.2], scale: [0.05, 0.05, 0.4], color: [0.6, 0.6, 0.6], shininess: 30, specularStrength: 0.3 });

    // --- Seguranca: detector de metal (portal) ---
    const DETECT_Z = NZ + 1.8;
    add({ mesh: meshes.box, position: [-1.2, 1.5, DETECT_Z], scale: [0.12, 3.0, 0.12], color: METAL, shininess: 60, specularStrength: 0.5 });
    add({ mesh: meshes.box, position: [1.2, 1.5, DETECT_Z], scale: [0.12, 3.0, 0.12], color: METAL, shininess: 60, specularStrength: 0.5 });
    add({ mesh: meshes.box, position: [0, 3.0, DETECT_Z], scale: [2.52, 0.10, 0.12], color: METAL, shininess: 60, specularStrength: 0.5 });
    // Sensor vermelho no topo
    add({ mesh: meshes.sphere, position: [0, 3.1, DETECT_Z], scale: [0.08, 0.08, 0.08], color: [0.9, 0.1, 0.1], shininess: 80, specularStrength: 0.6 });

    // --- Seguranca: cameras nas paredes adjacentes ---
    const camPos = (x, z, rot) => ({
        mesh: meshes.box, position: [x, 4.2, z], euler: [0, rot, 0], scale: [0.1, 0.1, 0.2],
        color: [0.12, 0.12, 0.12], shininess: 20, specularStrength: 0.1,
    });
    add(camPos(-FLOOR_W / 2 + 1, NZ, Math.PI / 2));            // camera na parede oeste
    add(camPos(FLOOR_W / 2 - 1, NZ, -Math.PI / 2));            // camera na parede leste
    add(camPos(leftWallCenter - 2, NZ, 0));                      // camera na parede norte (esquerda)

    // ---------------------------------------------------------------------
    // 7) PEDESTAIS (COR SOLIDA) + esculturas geometricas
    // ---------------------------------------------------------------------
    const STONE = [0.62, 0.60, 0.58];
    const pedestal = (x, z) => add({
        mesh: meshes.box, position: [x, 0.75, z], scale: [1.1, 1.5, 1.1],
        color: STONE, shininess: 16, specularStrength: 0.12,
    });

    // Canto 1: CUBO girando (objeto ANIMADO).
    pedestal(-9, -6);
    add({
        mesh: meshes.box, position: [-9, 1.9, -6], scale: [0.8, 0.8, 0.8],
        color: [0.82, 0.16, 0.16], shininess: 32, specularStrength: 0.4,
        update(t, _dt, obj) { obj.modelMatrix = makeModel([-9, 1.9, -6], [0, t * 0.8, 0], [0.8, 0.8, 0.8]); },
    });

    // Canto 2: ESFERA dourada (COR SOLIDA, especular forte que segue o Sol).
    pedestal(9, -6);
    add({
        mesh: meshes.sphere, position: [9, 2.05, -6], scale: [0.55, 0.55, 0.55],
        color: [0.86, 0.66, 0.22], shininess: 128, specularStrength: 0.95,
    });

    // Canto 3: ANEL + CUBO (substitui troféu, versões menores no canto).
    pedestal(-9, 6);
    const cY = 1.5; // topo do pedestal do canto
    add({
        mesh: meshes.torus, position: [-9, cY + 0.55, 6], euler: [Math.PI / 2, 0, 0], scale: [0.45, 0.45, 0.45],
        color: [0.95, 0.72, 0.25], shininess: 140, specularStrength: 1.0,
        update(t, _dt, obj) { obj.modelMatrix = makeModel([-9, cY + 0.55, 6], [Math.PI / 2, 0, t * 0.7], [0.45, 0.45, 0.45]); },
    });
    add({
        mesh: meshes.box, position: [-9, cY + 0.55, 6], scale: [0.25, 0.25, 0.25],
        color: [0.10, 0.70, 0.30], shininess: 80, specularStrength: 0.6,
        update(t, _dt, obj) { obj.modelMatrix = makeModel([-9, cY + 0.55, 6], [t * 1.4, t * 1.1, t * 0.6], [0.25, 0.25, 0.25]); },
    });

    // Canto 4: TORUS laranja tombando (objeto ANIMADO).
    pedestal(9, 6);
    add({
        mesh: meshes.torusSmall, position: [9, 2.0, 6], scale: [0.5, 0.5, 0.5],
        color: [0.92, 0.50, 0.10], shininess: 96, specularStrength: 0.7,
        update(t, _dt, obj) { obj.modelMatrix = makeModel([9, 2.0, 6], [t * 1.0, t * 0.4, 0], [0.5, 0.5, 0.5]); },
    });

    // ---------------------------------------------------------------------
    // 8) ESCULTURA CENTRAL em DESTAQUE, GIRANDO (requisito principal de animacao)
    // ---------------------------------------------------------------------
    // Pedestal alto, claro (cor solida tipo marmore).
    add({
        mesh: meshes.cylinder, position: [0, 0.9, 0], scale: [0.9, 1.8, 0.9],
        color: [0.82, 0.82, 0.86], shininess: 70, specularStrength: 0.5,
    });
    // TROFÉU central MAIOR (substitui anel + cubo, com balanço sutil).
    const centerTopY = 1.8; // topo do pedestal central
    const S = 1.5;
    const GM = { color: [0.95, 0.72, 0.25], shininess: 140, specularStrength: 1.0 };
    const centerParts = [
        [meshes.cylinder, [0, centerTopY + 0.04 * S, 0], [0.4 * S, 0.08 * S, 0.4 * S]],
        [meshes.cylinder, [0, centerTopY + 0.25 * S, 0], [0.07 * S, 0.34 * S, 0.07 * S]],
        [meshes.sphere, [0, centerTopY + 0.52 * S, 0], [0.28 * S, 0.16 * S, 0.28 * S]],
        [meshes.torusSmall, [0, centerTopY + 0.68 * S, 0], [0.30 * S, 0.30 * S, 0.30 * S]],
        [meshes.sphere, [0, centerTopY + 0.78 * S, 0], [0.06 * S, 0.06 * S, 0.06 * S]],
    ];
    for (const [mesh, pos, scale] of centerParts) {
        add({ mesh, position: pos, scale, ...GM, update: (t, _dt, obj) => { obj.modelMatrix = makeModel(pos, [Math.sin(t * 0.5) * 0.04, 0, 0], scale); } });
    }

    // --- Placa no pedestal (texto renderizado em canvas 2D) ---
    const plaqueTex = (() => {
        const c = document.createElement("canvas");
        c.width = 512; c.height = 96;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#c49a3c";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.strokeStyle = "#7a5c1a";
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
        ctx.fillStyle = "#1a1000";
        ctx.font = "bold 28px system-ui, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("melhor jogo 2d de Similação", c.width / 2, c.height / 2);
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return tex;
    })();
    add({
        mesh: meshes.canvas, position: [0, 1.1, -0.91], euler: [0, Math.PI, 0], scale: [0.6, 0.12, 1],
        texture: plaqueTex, shininess: 40, specularStrength: 0.4,
    });

    // ---------------------------------------------------------------------
    // 9) O SOL — esfera EMISSIVA que segue a luz pontual animada
    // ---------------------------------------------------------------------
    const sun = new Sun();
    const sunObj = add({
        mesh: meshes.sunSphere, position: [0, 50, 0], scale: [2.4, 2.4, 2.4],
        color: [1, 1, 1], emissive: true,
        update(_t, _dt, obj) {
            // segue a posicao da luz e adota a cor do disco do Sol
            obj.modelMatrix = makeModel([sun.position[0], sun.position[1], sun.position[2]], [0, 0, 0], [2.4, 2.4, 2.4]);
            obj.color = sun.emissiveColor;
        },
    });

    // ---------------------------------------------------------------------
    // update central da cena: avanca o Sol e todos os objetos animados
    // ---------------------------------------------------------------------
    function update(time, dt) {
        sun.update(time);
        for (const obj of animated) obj.update(time, dt, obj);
    }

    return { objects, sun, update };
}
