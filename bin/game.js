const chalk = require('chalk');

class GameEngine {
    constructor(data) {
        console.log('Iniatializing board');
        this.board = data;
        console.log(data);
        this.gamecharacters = [];
        this.gameover = false;
        this.round = 0;
        this.figlet = require('figlet');
    }

    Run() {
        this.LoadData();
        while(!this.gameover) {
            this.NewRound();
        }

    }

    LoadData() {
        let builder = new GameCharactersBuilder(this.board);
        this.gamecharacters = builder.create();
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    NewRound(){
        this.round++;
        this.gamecharacters.forEach(attacker => {
            attacker.attackReady = true;
        });
        console.log(chalk.blue.bgRed.bold('********** Round %s **********'), this.round);
        this.gamecharacters.filter(c => c.health > 0).forEach(c => {
            let charType = c instanceof Avartar ? 'Avartar' : 'Creature';
            console.log(chalk.blue('%s %s Health:%s'), charType, c.entityId, c.health);
        });
        this.gamecharacters.forEach(attacker => {
            if (attacker.attackReady && attacker.health > 0) {
                const targets = this.gamecharacters.filter(t => t.entityId != attacker.entityId && t.health > 0);
                var idx = this.getRandomInt(targets.length);
                if (targets.length !== 0) {
                    const target = targets[this.getRandomInt(idx)];
                    attacker.attackTarget(target);
                } else this.gameover = true;

            }
        });
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
            if (this instanceof Creature && target instanceof Avartar) return;
            // attack
            let charType = this instanceof Avartar ? 'Avartar' : 'Creature';
            let targetType = target instanceof Avartar ? 'Avartar' : 'Creature';
            let damage = this.calculateDamage(target);
            console.log(chalk.red('%s ID:%s attacks %s ID:%s doing %s damage'), charType, this.entityId, targetType, target.entityId, damage);
            target.health = target.health - damage < 0 ? 0 : target.health - damage;
            console.log(targetType + ' ID:' + target.entityId + ' health is ' + target.health);
            if (target instanceof Creature && this.health > 0) {
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