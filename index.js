class Player {
    constructor () {
        this.score = 0; // player move table
        this.nowPlaying = "X" // X or O 
    }

    move(i) {
        const moves = [0x1, 0x2, 0x4, 0x8, 0x10, 0x20, 0x40, 0x80, 0x100, 0x200];
        this.score |= moves[i];  
    }

    isPlaced(cell) {
        return (this.score & (1 << cell)) === 0 ? false : true;
    }
}

class Rules {
    constructor() {
        this.counter = 0;
    }
    /* 
    * Takes board data and returns winner or false
    * {player1} {player2} - board data
    */
    win(player1, player2) {
        const bitmaskWinners = [448, 56, 7, 292, 146, 73, 84, 273];
        var player = player1;
        for (let i = 0; i < 2; i++) {
            for (let i = 0; i < bitmaskWinners.length; i++) 
                if ((player.score & bitmaskWinners[i]) == bitmaskWinners[i]) 
                    return player.nowPlaying;
            player = player2;
        }
        return false;
    }
    /* 
    * Takes board data and returns tie or false
    * {player1} {player2} {counter} - board data
    */
    tie(player1, player2, counter) {
        if (counter >= 9 && !this.win(player1, player2)) 
            return "tie";
        return false;
    }

    updateNowPlaying(player1, player2) {
       let temp = player1.nowPlaying;
       player1.nowPlaying = player2.nowPlaying;
       player2.nowPlaying = temp;
    }

    // returns which player will move next
    nowMove(counter) {
        return (counter % 2 == 0) ? 1 : 2;
    }

    // returns if cell on board is already placed by players
    isPlacedBoth(player1, player2, i){
        return (player1.isPlaced(i) || player2.isPlaced(i))
    }

    // return array of avaivable moves 
    avaivableMoves(player1, player2) {
        let moves = [];
        for (let i = 0; i < 9; i++)
            if (!this.isPlacedBoth(player1, player2, i) ) 
            moves.push(i);
        return moves;
    }

    // restart game
    restart(player1, player2, counter) {
        player1.score = 0;
        player2.score = 0;
        this.updateNowPlaying(player1, player2)
    }
}


class AI extends Player {
    constructor() {
        super();
        this.rules = new Rules();
        this.aiType = 2; 
    }

    changeAiMode(i) {
        this.aiType = i;
        if (i == 0)document.getElementById("ai").innerText = "Minmax";
        if (i == 1)document.getElementById("ai").innerText = "Rand";
        if (i == 2)document.getElementById("ai").innerText = "None";
    }

    aiRandMove(player1, player2) {
        let moves = this.rules.avaivableMoves(player1, player2);
        return moves[Math.floor(Math.random() * moves.length)];
    }


    //is maximizing == AI X
    minimax(player1, player2, counter, depth, isMaximizing) {
        if      (this.rules.win(player1, player2) == "X" && isMaximizing) return 10;
        else if (this.rules.win(player1, player2) == "O" && !isMaximizing) return 10;
        else if (this.rules.win(player1, player2) && this.rules.tie(counter >= 8)) return 0;
        else if (this.rules.win(player1, player2)) return -10;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            this.rules.avaivableMoves(player1, player2).forEach(element => {
                let tmp1 = player1; let tmp2 = player2;
                if (this.rules.nowMove(counter) == 1)
                    tmp1.move(element);
                else
                    tmp2.move(element);

                let score = this.minimax(player1, player2, counter+1, depth-1, false);
                bestScore = Math.max(bestScore, score-depth)
            });
            return bestScore;
        } else {
            let bestScore = Infinity;
            this.rules.avaivableMoves(player1, player2).forEach(element => {
                let tmp1 = Object.assign({}, player1); let tmp2 = structuredClone(player2);
                if (this.rules.nowMove(counter) == 1)
                    tmp1.move(element);
                else
                    tmp2.move(element);

                let score = this.minimax(player1, player2, counter+1, depth-1, true);
                bestScore = Math.min(bestScore, score-depth)
            });

            return bestScore;
        }    
    }
        
    aiBestMove(player1, player2, counter) {
        let score = -Infinity;
        let move = undefined;
        let scoreBuf = -Infinity;   

        // check fo r avaivable moves
        this.rules.avaivableMoves(player1, player2).forEach(element => {
            let tmp1 = structuredClone(player1); let tmp2 = structuredClone(player2);
            if (this.rules.nowMove(counter) == 1)
                tmp1.move(element);
            else
                tmp2.move(element);

            scoreBuf = this.minimax(tmp1, player2, counter+1, 8-counter+1, true);
            // saving max score 
            if (scoreBuf > score) {
                move = element;
                score = scoreBuf;
            }  
        });
        return move;
    }
}

class Board  {
    constructor() {
        this.rules = new Rules();
        this.player1 = new Player;
        this.player2 = new Player;
        this.player2.nowPlaying = "O";
        this.red = '#604f6e';
        this.blue = '#876a9e';
        this.neutral = 'black';
    }

    getBox(i) {
        return document.getElementById(`box${i}`)
    }

    clear() {
        for (let i = 0; i < 9; i++) {
            let canvas = this.getBox(i)
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, 100, 100);
        }
    }

    drawX(element, color) {
        var ctx = element.getContext("2d");
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(10, 10);
        ctx.lineTo(90, 90);
        ctx.moveTo(10, 90);
        ctx.lineTo(90, 10);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = this.neutralColor;
    }

    drawO(element, color) {
        var ctx = element.getContext("2d");
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.arc(50, 50, 40, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = this.neutralColor;
    }

    preview(element) {
        let i = parseInt(element.id.charAt(3));
        if (!this.rules.isPlacedBoth(this.player1, this.player2, i)) {
            if (this.rules.nowMove(this.rules.counter) == 1) this.drawX(element);
            else this.drawO(element, this.neutralColor);
            this.clearCell(element);
        }
    }
    
    clearCell(element) {
        element.addEventListener("mouseleave", (event => {
            const context = event.target.getContext('2d');
            if(!this.rules.isPlacedBoth(this.player1, this.player2,  parseInt(event.target.id.charAt(3)))) 
                context.clearRect(0, 0, 100, 100);
        }));
    }
}


class Game extends Board{
    constructor() {
        super();
        this.ai = new AI;
        this.aiFlag = 0;
    }

    changeAiMode(element) {
        this.ai.changeAiMode(element)
    }

    winTie() {  
        let w = this.rules.win(this.player1, this.player2)
        let t = this.rules.tie(this.player1, this.player2, this.rules.counter)
        if ((w || t) || t) {
            this.clear()
            this.rules.restart(this.player1, this.player2);
            this.rules.updateNowPlaying(this.player1, this.player2);
            this.rules.counter = 0;   
            document.getElementById("who").innerText = (w) ? w : t;
            return true;
        }
        return false;
    }

    move(box) {
        if (this.winTie()) return; 
        if (this.aiFlag == 1 ) {
            let move = (this.ai.aiType == 1) ? this.ai.aiRandMove(this.player1, this.player2) : this.ai.aiBestMove(this.player1, this.player2, this.rules.counter);
            if (this.rules.nowMove(this.rules.counter) == 1) {
                this.player1.move(move)
                this.drawX(this.getBox(move), this.red);
            }   
            else {
                this.player2.move(move);
                this.drawO(this.getBox(move), this.red);
            }
            this.aiFlag = 0;
            this.rules.counter++;
            
        } else {
            let i = parseInt(box.id.charAt(3));
            if (!this.rules.isPlacedBoth(this.player1, this.player2,  i)) {
                if (this.rules.nowMove(this.rules.counter) == 1) {
                    this.player1.move(i)
                    this.drawX(box, this.red);
                }   
                else {
                    this.player2.move(i);
                    this.drawO(box, this.red);
                }
                this.rules.counter++;
                if (this.ai.aiType != 2) {
                    this.aiFlag = 1;
                    this.move(box);
                }
            }
        }
    }
}

let game = new Game()