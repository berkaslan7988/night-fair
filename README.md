# 🎡 Night Fair · Gece Panayırı

<img width="1845" height="907" alt="resim" src="https://github.com/user-attachments/assets/76851306-3b8d-423c-bcd0-40ebd4c0eb75" />

**EN** — A pocket arcade with **64 mini games** in your browser. No install, no build step, no dependencies — pure HTML/CSS/JS. Fully playable in **English** and **Turkish**

**TR** — Tarayıcıda çalışan **64 mini oyunluk** cep arcade salonu. Kurulum yok, build yok, bağımlılık yok — saf HTML/CSS/JS. **Türkçe** ve **İngilizce** tam sürüm

🎮 **Play / Oyna:** [berkaslan7988.github.io/night-fair](https://berkaslan7988.github.io/night-fair/) — or just open `index.html`

## Games / Oyunlar

| Category | Count | Highlights |
|---|---|---|
| 🕹 Arcade | 13 | Snake, Block Rain (Tetris), Brick Breaker, Pong, Balloon Flight, Night Run, Star Hunter, Whack-a-Mole, Road Crossing, Tower Stack, Candy Catch, Meteor Dodge, Jump Tower |
| 🧩 Puzzle | 15 | Memory, 2048, 15 Puzzle, Lights Out, Minesweeper, Sudoku (unique-solution generator), Nonogram, Sokoban, Hanoi, Peg Solitaire, Code Breaker, Simon, Maze, Triple Pop, Pipe Network |
| 🔤 Word | 7 | Daily Word (Wordle), Hangman, Anagram Rush, Word Search, Speed Typer, Missing Vowels, Verbal Memory |
| 🧠 Brain | 10 | Reaction, Math Sprint, Chimp Test, Visual Memory, Stroop, Schulte Table, Digit Span, Dot Estimate, Missing Operator, Number Hunt |
| 🃏 Cards & Dice | 7 | Blackjack, Hi-Lo, War, Video Poker, Dice Five, Pig, Golf Solitaire |
| ♟ Board vs Bot | 6 | Tic-Tac-Toe (minimax), Connect Four, Dots & Boxes, Nim (optimal bot), Battleship, Reversi |
| 🎪 Carnival | 6 | Prize Wheel, Slots, Plinko, High Striker, Duck Shoot, Horse Race |

## Features / Özellikler

- 🎟 Ticket economy across all games / Tüm oyunlarda ortak bilet ekonomisi
- 🏆 Best scores saved in `localStorage` / Rekorlar tarayıcıda saklanır
- ⭐ Favorites, search, category filters, recently played / Favoriler, arama, kategori filtreleri
- 🔗 Deep links (`#g/snake`) / Derin bağlantılar
- 📱 Touch + keyboard controls, responsive / Dokunmatik + klavye, mobil uyumlu
- 🔊 Synthesized sound effects with mute / Sentezlenmiş sesler, susturulabilir

## Structure / Yapı

```
index.html          → language picker (remembers your choice)
en/                 → English version
tr/                 → Türkçe sürüm
assets/css          → shared theme
assets/js/core.js   → engine: registry, hub, router, storage, audio, tickets
assets/js/i18n/     → per-language core dictionaries
assets/js/games/    → 7 packs × 64 games (game strings embedded per language)
```

Both language folders share the same game code; each page loads only its own dictionary. Scores are shared between languages (same origin).

## Run locally / Yerelde çalıştır

Just open `index.html` in a browser. / `index.html` dosyasını tarayıcıda aç.

## License

MIT
