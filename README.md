# Budget Hustle

A small browser game about making your way through a city, one challenge at a time. I kept the neon map and quick rounds, with quizzes about budgets, scams, code, and business mixed in with five-second tapping games.

Start at Budget Hub. Finish a district and build up enough cash to open the next one. You can replay districts to earn more. There are ten in total, ending at FinTech Tower. Red gremlins take cash, and pink ones also take a heart. Running out of hearts pauses the run and refills them; your completed districts stay with you.

Tap a building to play, or tap the ground to move. On a keyboard, use WASD or the arrow keys and press E near a building. The tapping rounds also accept separate Space presses. Escape leaves a challenge without a reward. The menu pauses the city.

Progress saves in your browser on this device. The reset button asks for a second click before clearing it. If browser storage is blocked, the game still works for the current session. Switching tabs cancels an unfinished challenge so a hidden timer cannot award cash later.

## Run it

Open `index.html` in a browser. There is no build step, account, or external service. For a consistent address and saved progress, run a local server with Python 3:

```sh
python3 -m http.server 5180 --bind 127.0.0.1
```

Then open http://127.0.0.1:5180. Browser storage belongs to the address you use, so opening the file directly and using the server may show different saves.

## Work on it

`index.html` holds the city and screens. `style.css` handles the map, controls, and small-screen layout. `rules.js` holds the district questions, unlock rules, rewards, and save validation. `game.js` handles movement, enemies, rounds, and browser events. Keeping the rules separate makes them easier to change and test without opening a browser.

Movement uses elapsed time so a faster screen does not make the game run faster. A round can finish only once, answers lock after selection, and timed rounds clear their timers when you leave. The tapping reward has a cap to keep progression predictable. These are small choices, but they keep a quick click from breaking a whole run.

To run the checks, use Node.js 22 or newer and Python 3:

```sh
npm ci
npx playwright install chromium
npm test
```

`npm run check` runs the rule tests and JavaScript syntax checks. `npm test` also starts a local server and checks rewards, saved progress, repeated answers, canceled timers, mobile layout, reset behavior, and all ten districts in Chromium. GitHub runs these checks on pushes and pull requests.

The questions are simplified game scenarios. The city uses CSS shapes rather than downloaded artwork, and the game has no backend, multiplayer, or cloud saves.
