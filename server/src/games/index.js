// games/index.js — registry of playable games. GameManager looks games up here.
// This repo ships one U.S. History Unit 2 game: Tax Collector vs. Tea Party.

import usTaxCollectorTeaParty from './usTaxCollectorTeaParty.js';

export const GAMES = {
  [usTaxCollectorTeaParty.id]: usTaxCollectorTeaParty,
};

export function getGame(id) {
  return GAMES[id] || null;
}
