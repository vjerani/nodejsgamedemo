const chalk = require('chalk');
const prompts = require('prompts');
prompts.override(require('yargs').argv);

class GameEngine {
    constructor(data) {
        console.log('Iniatializing board');
        this.board = data;
        data.forEach(x => console.log(x));
        this.gamecharacters = [];
        this.gameover = false;
        this.round = 0;
        this.figlet = require('figlet');
    }

    Run() {
        this.LoadData();
        this.NewRound();
    }

    LoadData() {
        let builder = new GameCharactersBuilder(this.board);
        this.gamecharacters = builder.create();
    }

    getPlayableCharacters() {
        return this.gamecharacters.filter(x => x.health > 0 && x.attackReady === true);
    }

    getAttackableCharacters() {
        return this.gamecharacters.filter(x => x.health > 0 );
    }

    getPlayableTargets(attacker) {
        let playable = this.getAttackableCharacters().filter(x => x.entityId !== attacker.entityId);
        if (attacker.entityType === 2) {
            return playable.filter(x => x.entityType === 2);
        }
        return playable;
    }

    displayHealth() {
        this.gamecharacters.forEach(c => {
            let charType = c instanceof Avartar ? 'Avartar' : 'Creature';
            console.log(chalk.blue('%s %s Health:%s Played: %s'), charType, c.entityId, c.health, c.attackReady ? 'No':'Yes');
        });
    }

    NewRound() {
        this.round++;
        this.gamecharacters.filter(x => x.health > 0).forEach(attacker => {
            attacker.attackReady = true;
        });
        let playableCharacters = this.getPlayableCharacters();
        if (playableCharacters.length > 1) {
            console.log(chalk.blue.bgRed.bold('********** Round %s **********'), this.round);
            this.NextMove();
        } else {
            this.gameover = true;
        }

        if (this.gameover) { 
            this.figlet('Game over!!', function(err, data) {
                if (err) {
                    console.log('Something went wrong...');
                    console.dir(err);
                    return;
                }
                console.log(data);
            });
            console.log(chalk.red.bold('Winner is'));
            console.log(JSON.stringify(this.gamecharacters.filter(character => character.health > 0)));
        }
    }

    NextMove() {
        console.log(chalk.blue.bold('Next move'));
        this.displayHealth();
        let playableCharacters = this.getPlayableCharacters();
        if (playableCharacters.length >= 2) {

            const options = playableCharacters.map(x => ({ title: ((x.entityType === 1 ? 'Avartar ':'Creature ') + x.entityId), value: x.entityId }));
            (async () => {
                const response = await prompts([
                  {
                    type: 'select',
                    name: 'attackerid',
                    message: 'Choose character for attack?',
                    choices: options
                  }
                ]);
                const attacker = this.gamecharacters.find(x => x.entityId === response.attackerid);
                const targets = this.getPlayableTargets(attacker);
                if (targets.length==0) {
                    //in case we select creature and there are only avartars left
                    //as creature can't attack avartars
                    console.log('Selected character has no targets');
                    this.NextMove();
                } else {
                    const targetoptions = targets.map(x => ({ title: ((x.entityType === 1 ? 'Avartar ':'Creature ') + x.entityId), value: x.entityId }));
                    const targetresponse = await prompts([
                        {
                          type: 'select',
                          name: 'targetid',
                          message: 'Which character to attack?',
                          choices: targetoptions
                        }
                    ]);
                    attacker.attackTarget(this.gamecharacters.find(x => x.entityId === targetresponse.targetid));
                    this.NextMove();
                }
            })();
        } else {
            this.NewRound();
        }
    }
}

class GameCharacter {
    constructor(obj) {
        this.entityId = obj.entityId;
        this.health = obj.health;
        this.attack = obj.attack;
        this.attackReady = obj.attackReady;
        this.entityType = obj.entityType;
        this.modifiers = obj.modifiers;
    }

    attackTarget(target) {
        if (this.attackReady && target.health > 0) {
            let charType = this instanceof Avartar ? 'Avartar' : 'Creature';
            let targetType = target instanceof Avartar ? 'Avartar' : 'Creature';
            let damage = this.calculateDamage(target);
            console.log(chalk.red('%s ID:%s attacks %s ID:%s doing %s damage'), charType, this.entityId, targetType, target.entityId, damage);
            target.health = target.health - damage < 0 ? 0 : target.health - damage;
            console.log(targetType + ' ID:' + target.entityId + ' health is ' + target.health);
            if (target instanceof Creature && target.health > 0) {
                console.log('retaliate');
                target.retaliate(this);
            }
            this.attackReady = false;
        }
    }

    retaliate(attacker) {
        let targetType = this instanceof Avartar ? 'Avartar' : 'Creature';
        let damage = this.calculateDamage(attacker);
        console.log(chalk.yellow('%s ID:%s retaliates doing %s damage'), targetType, this.entityId, damage);
        attacker.health = attacker.health - damage < 0 ? 0 : attacker.health - damage;
    }

    calculateDamage(target) {
        let damage = this.attack;
        let armor = 0;
        let vunrelability = 0;
        target.modifiers.forEach(modifier => {
            if (modifier.modifierType === 1) {
                armor = modifier.value;
            }
            else if (modifier.modifierType === 2) {
                vunrelability = modifier.value;
            };
        });
        return damage + vunrelability - armor;
    }
}

class Avartar extends GameCharacter {
    constructor(obj) {
        super(obj);
    };

    attackTarget(target) {
        super.attackTarget(target);
    }
}

class Creature extends GameCharacter {
    constructor(obj) {
        super(obj);
    };

    attackTarget(target) {
        super.attackTarget(target);
    }
}


class GameCharactersBuilder {
    constructor(jsondata) {
        this.data = jsondata;
        this.characters = [];
    }

    create() {
        this.data.forEach(charobj => {
            try {
                if (charobj.entityType === 1) {
                    this.characters.push(new Avartar(charobj));
                } else if (charobj.entityType === 2) {
                    this.characters.push(new Creature(charobj));
                }
            } catch (error) {
                console.error(error);
            }
        });
        return this.characters;
    }
}

module.exports = {
    GameCharacter : GameCharacter,
    Avartar : Avartar,
    Creature: Creature,
    GameCharactersBuilder: GameCharactersBuilder,
    GameEngine:GameEngine
}