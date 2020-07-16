#!/usr/bin/env node
'use strict';
const clear = require('clear');
clear();
var game = require('./bin/game.js');
const data = require('./board.json');
var engine = new game.GameEngine(data);
engine.Run();


