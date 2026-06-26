// ============================================================================
// geometry.js — Geradores de GEOMETRIA PROCEDURAL
// Toda a cena e construida 100% por codigo (exigencia do trabalho). Cada gerador
// devolve { positions, normals, uvs, indices } com Float32Array/Uint16Array,
// prontos para virar buffers em mesh.js.
// Convencoes: posicoes centradas na origem; normais para fora; UVs em [0,1]
// (com fator de repeticao opcional para texturas que ladrilham, ex.: o chao).
// ============================================================================

/**
 * Helper: gera os indices (2 triangulos por celula) de uma grade regular de
 * (rows+1) x (cols+1) vertices. Usado por esfera, cilindro e torus.
 */
function gridIndices(rows, cols) {
    const indices = [];
    const stride = cols + 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const a = r * stride + c;
            const b = a + stride;
            indices.push(a, b, a + 1);   // triangulo 1
            indices.push(a + 1, b, b + 1); // triangulo 2
        }
    }
    return indices;
}

/**
 * PLANO no eixo XZ (normal apontando para +Y). Ideal para o chao.
 * @param {number} width  largura (eixo X)
 * @param {number} depth  profundidade (eixo Z)
 * @param {number} uvRepeat quantas vezes a textura se repete (ladrilho)
 */
export function createPlane(width = 1, depth = 1, uvRepeat = 1) {
    const hw = width / 2, hd = depth / 2;
    const positions = new Float32Array([
        -hw, 0, -hd,  hw, 0, -hd,  hw, 0, hd,  -hw, 0, hd,
    ]);
    const normals = new Float32Array([
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    ]);
    const uvs = new Float32Array([
        0, 0,  uvRepeat, 0,  uvRepeat, uvRepeat,  0, uvRepeat,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    return { positions, normals, uvs, indices };
}

/**
 * QUAD no plano XY (normal para +Z). Usado nas paredes e nas telas dos quadros.
 */
export function createQuad(width = 1, height = 1, uvRepeatX = 1, uvRepeatY = 1) {
    const hw = width / 2, hh = height / 2;
    const positions = new Float32Array([
        -hw, -hh, 0,  hw, -hh, 0,  hw, hh, 0,  -hw, hh, 0,
    ]);
    const normals = new Float32Array([
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    ]);
    const uvs = new Float32Array([
        0, 0,  uvRepeatX, 0,  uvRepeatX, uvRepeatY,  0, uvRepeatY,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    return { positions, normals, uvs, indices };
}

/**
 * CUBO/CAIXA centrada na origem. 24 vertices (4 por face) para ter normais e
 * UVs corretas por face (vertices compartilhados estragariam as normais).
 */
export function createBox(width = 1, height = 1, depth = 1) {
    const hw = width / 2, hh = height / 2, hd = depth / 2;
    // Cada face: 4 vertices, normal propria, UV 0..1.
    const faces = [
        // dir (+X)
        { n: [1, 0, 0], v: [[hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [hw, hh, hd]] },
        // esq (-X)
        { n: [-1, 0, 0], v: [[-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-hw, hh, -hd]] },
        // cima (+Y)
        { n: [0, 1, 0], v: [[-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd]] },
        // baixo (-Y)
        { n: [0, -1, 0], v: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd]] },
        // frente (+Z)
        { n: [0, 0, 1], v: [[-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]] },
        // tras (-Z)
        { n: [0, 0, -1], v: [[hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd]] },
    ];
    const positions = [], normals = [], uvs = [], indices = [];
    faces.forEach((f, i) => {
        f.v.forEach((p) => { positions.push(...p); normals.push(...f.n); });
        uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
        const o = i * 4;
        indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        uvs: new Float32Array(uvs),
        indices: new Uint16Array(indices),
    };
}

/**
 * ESFERA UV (esfera de latitude/longitude). Boa para esculturas e para o Sol.
 */
export function createSphere(radius = 1, latBands = 32, lonBands = 32) {
    const positions = [], normals = [], uvs = [];
    for (let lat = 0; lat <= latBands; lat++) {
        const theta = (lat * Math.PI) / latBands; // 0..PI (polo a polo)
        const sinT = Math.sin(theta), cosT = Math.cos(theta);
        for (let lon = 0; lon <= lonBands; lon++) {
            const phi = (lon * 2 * Math.PI) / lonBands; // 0..2PI (volta)
            const sinP = Math.sin(phi), cosP = Math.cos(phi);
            const x = cosP * sinT, y = cosT, z = sinP * sinT;
            normals.push(x, y, z);            // na esfera, a normal = direcao do ponto
            positions.push(radius * x, radius * y, radius * z);
            uvs.push(lon / lonBands, lat / latBands);
        }
    }
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        uvs: new Float32Array(uvs),
        indices: new Uint16Array(gridIndices(latBands, lonBands)),
    };
}

/**
 * CILINDRO ao longo do eixo Y (com tampas), centrado na origem.
 */
export function createCylinder(radius = 1, height = 1, radialSegments = 32) {
    const positions = [], normals = [], uvs = [], indices = [];
    const hh = height / 2;

    // --- Lateral (grade radialSegments x 1) ---
    for (let i = 0; i <= radialSegments; i++) {
        const a = (i / radialSegments) * 2 * Math.PI;
        const x = Math.cos(a), z = Math.sin(a);
        // vertice inferior e superior na mesma coluna
        positions.push(radius * x, -hh, radius * z); normals.push(x, 0, z); uvs.push(i / radialSegments, 0);
        positions.push(radius * x, hh, radius * z); normals.push(x, 0, z); uvs.push(i / radialSegments, 1);
    }
    for (let i = 0; i < radialSegments; i++) {
        const o = i * 2;
        indices.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
    }

    // --- Tampas (topo +Y e base -Y) ---
    const addCap = (y, ny) => {
        const center = positions.length / 3;
        positions.push(0, y, 0); normals.push(0, ny, 0); uvs.push(0.5, 0.5);
        const start = positions.length / 3;
        for (let i = 0; i <= radialSegments; i++) {
            const a = (i / radialSegments) * 2 * Math.PI;
            const x = Math.cos(a), z = Math.sin(a);
            positions.push(radius * x, y, radius * z);
            normals.push(0, ny, 0);
            uvs.push(0.5 + 0.5 * x, 0.5 + 0.5 * z);
        }
        for (let i = 0; i < radialSegments; i++) {
            if (ny > 0) indices.push(center, start + i, start + i + 1);
            else indices.push(center, start + i + 1, start + i);
        }
    };
    addCap(hh, 1);
    addCap(-hh, -1);

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        uvs: new Float32Array(uvs),
        indices: new Uint16Array(indices),
    };
}

/**
 * TORUS (rosquinha). Otima como escultura central girando — superficie curva
 * que mostra muito bem o especular do Phong.
 * @param {number} R raio do anel (centro -> centro do tubo)
 * @param {number} r raio do tubo
 */
export function createTorus(R = 1, r = 0.4, radialSegments = 48, tubeSegments = 24) {
    const positions = [], normals = [], uvs = [];
    for (let i = 0; i <= radialSegments; i++) {
        const u = (i / radialSegments) * 2 * Math.PI; // volta no anel
        const cosU = Math.cos(u), sinU = Math.sin(u);
        for (let j = 0; j <= tubeSegments; j++) {
            const v = (j / tubeSegments) * 2 * Math.PI; // volta no tubo
            const cosV = Math.cos(v), sinV = Math.sin(v);
            const x = (R + r * cosV) * cosU;
            const y = r * sinV;
            const z = (R + r * cosV) * sinU;
            positions.push(x, y, z);
            // normal: direcao do ponto do tubo em relacao ao seu centro
            normals.push(cosV * cosU, sinV, cosV * sinU);
            uvs.push(i / radialSegments, j / tubeSegments);
        }
    }
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        uvs: new Float32Array(uvs),
        indices: new Uint16Array(gridIndices(radialSegments, tubeSegments)),
    };
}
