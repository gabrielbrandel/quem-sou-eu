# Quem Sou Eu?

App web no estilo do Impostor para jogar **Quem sou eu?** no celular.

## Modos

### Um celular
1. Adicione os jogadores.
2. Cada um escolhe um tema e escreve uma palavra.
3. As palavras são redistribuídas (ninguém recebe a própria).
4. Na mesma ordem, alguém arrasta o card e vê o que vai na cabeça de Y: **passe X para Y**.

### Cada um com o celular
1. Digite seu nome e escolha uma sala da lista.
2. O primeiro a entrar vira anfitrião; os outros entram na mesma sala.
3. Cada um escolhe a palavra.
4. O anfitrião distribui — cada celular mostra a identidade no **modo testa**.

> No modo multi, o anfitrião precisa manter a aba aberta (a sala usa conexão peer-to-peer).

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build / Vercel

```bash
npm run build
```

Publique a pasta `dist` (ou conecte o repositório no Vercel com o preset Vite).
