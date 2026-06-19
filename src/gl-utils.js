// ============================================================================
// gl-utils.js — Utilitarios de baixo nivel do WebGL2
// Responsabilidades: compilar/linkar shaders (com mensagens de erro CLARAS),
// montar um "programInfo" com as localizacoes de uniforms/atributos e alguns
// helpers (buscar arquivos de texto, redimensionar o canvas).
// Mantemos tudo aqui para o restante do codigo nao repetir boilerplate de GL.
// ============================================================================

/**
 * Compila um shader e, em caso de erro, lanca uma excecao com o log do driver
 * e o codigo-fonte numerado — isso facilita MUITO achar o erro de GLSL.
 * @param {WebGL2RenderingContext} gl
 * @param {number} type gl.VERTEX_SHADER ou gl.FRAGMENT_SHADER
 * @param {string} source codigo GLSL
 * @returns {WebGLShader}
 */
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        const numbered = source
            .split("\n")
            .map((line, i) => `${String(i + 1).padStart(3, " ")}| ${line}`)
            .join("\n");
        gl.deleteShader(shader);
        const tipo = type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";
        throw new Error(`Erro ao compilar shader ${tipo}:\n${log}\n--- fonte ---\n${numbered}`);
    }
    return shader;
}

/**
 * Linka um programa a partir dos fontes de vertex e fragment shader.
 * Lanca excecao com log claro se a linkagem falhar.
 * @returns {WebGLProgram}
 */
export function createProgram(gl, vertexSource, fragmentSource) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Erro ao linkar o programa:\n${log}`);
    }

    // Shaders ja podem ser descartados apos a linkagem.
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
}

/**
 * Cria um "programInfo": o programa + um mapa pronto de localizacoes de uniforms.
 * Centralizar as localizacoes evita chamar getUniformLocation a cada frame.
 * @param {WebGL2RenderingContext} gl
 * @param {string} vertexSource
 * @param {string} fragmentSource
 * @param {string[]} uniformNames nomes dos uniforms a resolver
 * @returns {{program: WebGLProgram, uniforms: Object<string, WebGLUniformLocation>}}
 */
export function createProgramInfo(gl, vertexSource, fragmentSource, uniformNames) {
    const program = createProgram(gl, vertexSource, fragmentSource);
    const uniforms = {};
    for (const name of uniformNames) {
        uniforms[name] = gl.getUniformLocation(program, name);
    }
    return { program, uniforms };
}

/**
 * Le um arquivo de texto (shaders) via fetch. Por isso o projeto precisa de um
 * servidor HTTP: fetch nao funciona no protocolo file:// na maioria dos browsers.
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchText(url) {
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Falha ao carregar "${url}": HTTP ${resp.status}`);
    }
    return resp.text();
}

/**
 * Ajusta a resolucao do canvas ao tamanho exibido (considerando devicePixelRatio)
 * para a imagem nao ficar borrada/esticada. Retorna true se houve mudanca.
 * @param {WebGL2RenderingContext} gl
 * @returns {boolean}
 */
export function resizeCanvasToDisplaySize(gl) {
    const canvas = gl.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // limita a 2x por desempenho
    const width = Math.floor(canvas.clientWidth * dpr);
    const height = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}
