#version 300 es
// ============================================================================
// phong.vert — Vertex Shader (GLSL ES 3.00)
// Transforma os vertices para o clip-space e repassa, para o fragment shader,
// os dados em ESPACO DO MUNDO (posicao e normal) usados na iluminacao Phong.
// A iluminacao em si e calculada por FRAGMENTO (ver phong.frag); aqui apenas
// preparamos/interpolamos os atributos.
// ============================================================================
precision highp float;

// Atributos do vertice. As "location" batem com a configuracao do VAO em mesh.js
// (0 = posicao, 1 = normal, 2 = coordenada de textura).
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;

// Matrizes de transformacao (uma por objeto / por camera).
uniform mat4 uModel;        // objeto -> mundo
uniform mat4 uView;         // mundo  -> camera
uniform mat4 uProjection;   // camera -> clip (perspectiva)
uniform mat3 uNormalMatrix; // inverse-transpose do uModel (corrige normais sob escala nao-uniforme)

// Saidas interpoladas para o fragment shader.
out vec3 vFragPos;  // posicao do fragmento no espaco do mundo
out vec3 vNormal;   // normal no espaco do mundo
out vec2 vUv;       // coordenada de textura

void main() {
    // Posicao do vertice no mundo: necessaria para calcular direcoes de luz/visao por fragmento.
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vFragPos = worldPos.xyz;

    // A normal precisa da matriz normal (e nao apenas de uModel) para continuar
    // perpendicular a superficie quando ha escala nao-uniforme.
    vNormal = uNormalMatrix * aNormal;

    vUv = aUv;

    // Posicao final na tela = projecao * visao * mundo.
    gl_Position = uProjection * uView * worldPos;
}
