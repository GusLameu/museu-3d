# Museu Virtual 3D

Aplicação interativa desenvolvida para a disciplina de **Computação Gráfica**, com foco na construção de um passeio virtual em primeira pessoa por uma galeria de esculturas a céu aberto. O projeto foi implementado com **WebGL2 puro** e **GLSL ES 3.00**, sem o uso de bibliotecas gráficas de alto nível, utilizando apenas **gl-matrix** para operações de álgebra linear.

O ambiente permite livre navegação pelo espaço expositivo, combinando objetos geométricos, superfícies texturizadas, iluminação dinâmica e animações em tempo real. Entre os principais elementos da cena estão quadros aplicados às paredes, esculturas posicionadas sobre pedestais e uma peça central animada, além de um sistema de iluminação que simula o deslocamento do Sol ao longo do tempo.

> Projeto acadêmico da disciplina de **Computação Gráfica**.  

---

## Visão geral

A proposta do projeto é representar uma galeria virtual renderizada integralmente em tempo real, explorando conceitos fundamentais de computação gráfica, como projeção em perspectiva, câmera em primeira pessoa, iluminação Phong por fragmento, texturização e animação baseada em transformações.

A cena foi planejada para reunir diferentes tipos de elementos visuais em um mesmo ambiente: piso com materiais distintos, quadros texturizados, esculturas geométricas com cores sólidas e uma iluminação pontual animada, responsável por alterar progressivamente a atmosfera visual da cena entre os períodos de dia, entardecer e noite.

**Planta da galeria:**

![Planta da galeria](docs/scene_layout.png)

**Ciclo de iluminação solar:**

![Ciclo do Sol](docs/sun_cycle.png)

**Texturas utilizadas na cena:**

![Texturas](docs/textures_sheet.png)

---

## Funcionalidades implementadas

O projeto contempla os requisitos técnicos propostos para a atividade e organiza esses recursos de forma integrada na cena.

| Requisito | Implementação |
|---|---|
| Projeção em perspectiva e câmera em primeira pessoa | `src/camera.js` |
| Iluminação Phong por fragmento com luz em movimento | `shaders/phong.frag` e `src/light.js` |
| Objeto animado por transformação | `src/scene.js` |
| Aplicação de texturas | `src/texture.js` |
| Objetos com cor sólida | Pedestais, esculturas e molduras |
| Controle por teclado e mouse | `src/input.js` |

Além dos requisitos obrigatórios, o projeto também inclui:
- Ciclo dinâmico de iluminação com transição entre dia, entardecer e noite.
- Sol visível na cena como elemento emissivo.
- Conjunto de quadros com imagens geradas proceduralmente.
- Materiais distintos aplicados ao piso e aos detalhes arquitetônicos.
- Objetos com comportamento animado em tempo real.
- Texturas produzidas por código, sem dependência de modelos ou imagens externas ao escopo do projeto.

---

## Execução local

O projeto utiliza **ES Modules** e faz carregamento de recursos por meio de `fetch()` e `Image`. Por esse motivo, a aplicação deve ser executada em um servidor HTTP local, já que a abertura direta via `file://` pode impedir o carregamento correto dos módulos, shaders e texturas. [web:3]

### Opção 1 — Python

```bash
cd "Comp Grafica"
python -m http.server 8000
```

Se necessário, também é possível usar:

```bash
py -m http.server 8000
```

ou

```bash
python3 -m http.server 8000
```

A aplicação ficará disponível em:

```bash
http://localhost:8000
```

### Opção 2 — Node.js

```bash
npx serve .
```

ou

```bash
npx http-server -p 8000
```

### Opção 3 — VS Code

Com a extensão **Live Server** instalada, basta abrir o arquivo `index.html` com a opção **Open with Live Server**.

Para uma melhor experiência, recomenda-se o uso de navegadores com suporte completo a **WebGL2**, como Chrome, Edge ou Firefox. Ao iniciar a aplicação, clique na cena para ativar o controle de câmera com o mouse e utilize `ESC` para liberar o cursor.

---

## Controles

| Ação | Comando |
|---|---|
| Mover para frente | `W` ou `↑` |
| Mover para trás | `S` ou `↓` |
| Mover para a esquerda | `A` ou `←` |
| Mover para a direita | `D` ou `→` |
| Correr | `Shift` |
| Olhar ao redor | Mouse |
| Liberar cursor | `ESC` |

---

## Estrutura do projeto

```text
.
├── index.html
├── src/
│   ├── main.js
│   ├── gl-utils.js
│   ├── geometry.js
│   ├── mesh.js
│   ├── camera.js
│   ├── input.js
│   ├── texture.js
│   ├── light.js
│   └── scene.js
├── shaders/
│   ├── phong.vert
│   └── phong.frag
├── assets/textures/
├── libs/gl-matrix/
├── docs/
└── README.md
```

---

## Aspectos técnicos

- Renderização desenvolvida com **WebGL2** sem engine gráfica.
- Shaders escritos em **GLSL ES 3.00**.
- Iluminação **Phong por fragmento**, com componentes ambiente, difusa e especular.
- Luz pontual animada em arco para simular o deslocamento do Sol.
- Geometria construída proceduralmente em `geometry.js`.
- Uso de texturas para piso, elementos arquitetônicos e quadros.
- Sistema de animação baseado em `deltaTime`, garantindo independência da taxa de quadros.
- Estrutura modular em JavaScript para separação entre câmera, entrada, geometria, texturas, iluminação e montagem da cena.

---

## Tecnologias utilizadas

- **WebGL2**
- **GLSL ES 3.00**
- **JavaScript**
- **gl-matrix**

---

## Créditos

- Biblioteca [**gl-matrix**](https://glmatrix.net/) para operações de álgebra linear, distribuída sob licença MIT.
- Projeto desenvolvido no contexto da disciplina de **Computação Gráfica**.