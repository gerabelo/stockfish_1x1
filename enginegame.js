function engineGame(options) {
    options = options || {}
    var game = new Chess();
    var board;
    // var engine = new Worker(options.stockfishjs || 'js/stockfish.js');
    var engine1 = new Worker('js/stockfish.js');
    var engine2 = new Worker('js/stockfish.js');

    var engine1Status = {};
    var engine2Status = {};
    var depth1 = 20;
    var depth2 = 7;

    var displayScore = false;

    var time = { wtime: 300000, btime: 300000, winc: 2000, binc: 2000 };
    var playerColor = 'white';
    var clockTimeoutID = null;
    var isEngineRunning = false;

    var winnerCount = { white: 0, black: 0 };
    var stalemate = 0;
    var draw = 0;
    // do not pick up pieces if the game is over
    // only pick up pieces for White
    var onDragStart = function(source, piece, position, orientation) {
        var re = playerColor == 'white' ? /^b/ : /^w/
            if (game.game_over() ||
                piece.search(re) !== -1) {
                return false;
            }
    };

    function permanencia(bestmove,fen) {
        var url='http://localhost:3000/bestmoves/add';
        var data = JSON.stringify({
            fen: fen,
            bestmove: bestmove
        });

        var params = {
            headers:{
                'Access-Control-Allow-Origin':'*',
                'Content-Type': 'application/json'
            },
            body: data,
            method:"POST"
        };

        fetch(url,params)
        .then(data => {return data.json()})
        .then(res => {console.log(res)})
        .catch(error=>console.log(error))

    }

    function permanenciaPGN(pgn) {
        var url='http://localhost:3000/pgn/add';
        var data = JSON.stringify({
            pgn: pgn,
            description: ''
        });

        var params = {
            headers:{
                'Access-Control-Allow-Origin':'*',
                'Content-Type': 'application/json'
            },
            body: data,
            method:"POST"
        };

        fetch(url,params)
        .then(data => {return data.json()})
        .then(res => {console.log(res)})
        .catch(error=>console.log(error))

    }

    function uciCmd1(cmd) {
        engine1.postMessage(cmd);
    }
    uciCmd1('uci');

    function uciCmd2(cmd) {
        engine2.postMessage(cmd);
    }
    uciCmd2('uci');

    function displayStatus1() {
        var status = 'Engine['+playerColor+']: ';
        if(!engine1Status.engineLoaded) {
            status += 'loading...';
        } else if(!engine1Status.engineReady) {
            status += 'loaded...';
        } else {
            status += 'ready.';
        }
        status += ' Book: ' + engine1Status.book;
        if(engine1Status.search) {
            status += '<br>' + engine1Status.search;
            if(engine1Status.score && displayScore) {
                status += ' Score: ' + engine1Status.score;
            }
        }
        $('#engine1Status').html(status);
    }

    function displayStatus2() {
        if (playerColor == 'white') {
            var status = 'Engine[black]: ';
        } else {
            var status = 'Engine[white]: ';
        }
        
        if(!engine2Status.engineLoaded) {
            status += 'loading...';
        } else if(!engine2Status.engineReady) {
            status += 'loaded...';
        } else {
            status += 'ready.';
        }
        status += ' Book: ' + engine2Status.book;
        if(engine2Status.search) {
            status += '<br>' + engine2Status.search;
            if(engine2Status.score && displayScore) {
                status += ' Score: ' + engine2Status.score;
            }
        }
        $('#engine2Status').html(status);
    }

    function displayClock(color, t) {
        var isRunning = false;
        if(time.startTime > 0 && color == time.clockColor) {
            t = Math.max(0, t + time.startTime - Date.now());
            isRunning = true;
        }
        var id = color == playerColor ? '#time2' : '#time1';
        var sec = Math.ceil(t / 1000);
        var min = Math.floor(sec / 60);
        sec -= min * 60;
        var hours = Math.floor(min / 60);
        min -= hours * 60;
        var display = hours + ':' + ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2);
        if(isRunning) {
            display += sec & 1 ? ' <--' : ' <-';
        }
        $(id).text(display);
    }

    function updateClock() {
        displayClock('white', time.wtime);
        displayClock('black', time.btime);
    }

    function clockTick() {
        updateClock();
        var t = (time.clockColor == 'white' ? time.wtime : time.btime) + time.startTime - Date.now();
        var timeToNextSecond = (t % 1000) + 1;
        clockTimeoutID = setTimeout(clockTick, timeToNextSecond);
    }

    function stopClock() {
        if(clockTimeoutID !== null) {
            clearTimeout(clockTimeoutID);
            clockTimeoutID = null;
        }
        if(time.startTime > 0) {
            var elapsed = Date.now() - time.startTime;
            time.startTime = null;
            if(time.clockColor == 'white') {
                time.wtime = Math.max(0, time.wtime - elapsed);
            } else {
                time.btime = Math.max(0, time.btime - elapsed);
            }
        }
    }

    function startClock() {
        if(game.turn() == 'w') {
            time.wtime += time.winc;
            time.clockColor = 'white';
        } else {
            time.btime += time.binc;
            time.clockColor = 'black';
        }
        time.startTime = Date.now();
        clockTick();
    }

    function prepareMove() {
        stopClock();
        $('#pgn').text(game.pgn());
        $('#fen').text(game.fen());
        board.position(game.fen()); // -- é aqui que a pilha de FEN vai entrar após avaliar o lance anterior
        updateClock();
        var turn = game.turn() == 'w' ? 'white' : 'black';
        if(!game.game_over()) {
            if(turn != playerColor || turn == playerColor) {
                var moves = '';
                var history = game.history({verbose: true});
                for(var i = 0; i < history.length; ++i) {
                    var move = history[i];
                    moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '');
                }
                // uciCmd('position startpos moves' + moves);
                uciCmd1('position startpos moves' + moves);
                uciCmd2('position startpos moves' + moves);

                if(time.depth) {
                    // uciCmd('go depth ' + time.depth);
                    uciCmd1('go depth ' + time.depth);
                    uciCmd2('go depth ' + time.depth);
                } else if(time.nodes) {
                    // uciCmd('go nodes ' + time.nodes);
                    uciCmd1('go nodes ' + time.nodes);
                    uciCmd2('go nodes ' + time.nodes);
                } else {//if (depth1 && depth2) {
                    // uciCmd('go wtime ' + time.wtime + ' winc ' + time.winc + ' btime ' + time.btime + ' binc ' + time.binc);
                    // uciCmd1('go depth ' + depth1);
                    // uciCmd2('go depth ' + depth2);
                    uciCmd1('go depth 15');
                    uciCmd2('go depth 5');
                }
                isEngineRunning = true;
            }
            if(game.history().length >= 2 && !time.depth && !time.nodes) {
                startClock();
            }
        } else {
            if (turn == 'black' && game.in_checkmate()) {
                winnerCount.white++;
                $('#whiteCount').text('white: '+winnerCount.white);
            } else if (turn == 'white' && game.in_checkmate()) {
                winnerCount.black++;
                $('#blackCount').text('black: '+winnerCount.black);
            } else if (game.in_stalemate()) {
                stalemate++;
                $('#stalemate').text('stalemates: '+stalemate);
            } else if (game.in_draw()) {
                draw++;
                $('#draw').text('draws: '+draw);
            }

            permanenciaPGN(game.pgn());
        
            var baseTime = parseFloat($('#timeBase').val()) * 60;
            var inc = parseFloat($('#timeInc').val());
            var skill1 = parseInt($('#skillLevel1').val());
            var skill2 = parseInt($('#skillLevel2').val());
            var depthLevel1 = parseInt($('#depthLevel1').val());
            var depthLevel2 = parseInt($('#depthLevel2').val());
            
            game.reset();
            game.setTime(baseTime, inc);
            game.setSkillLevel1(skill1);
            game.setSkillLevel2(skill2);
            game.setDepth1(depthLevel1);
            game.setDepth2(depthLevel2);
            game.setPlayerColor($('#color-white').hasClass('active') ? 'white' : 'black');
            game.setDisplayScore($('#showScore').is(':checked'));
            game.start();
        }
    }

    engine1.onmessage = function(event) {
        var line = event.data;
        if(line == 'uciok') {
            engine1Status.engineLoaded = true;
        } else if(line == 'readyok') {
            engine1Status.engineReady = true;
        } else {
            var match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])?/);
            var turn = game.turn() == 'w' ? 'white' : 'black';
            
            if(turn == playerColor) {
                if(match) {
                    permanencia(match,game.fen());
                    // $('#bestmove').text(match[0].slice(9,13));
                    $('#bestmove').text(match[0]);
                    isEngineRunning = false;
                    game.move({from: match[1], to: match[2], promotion: match[3]});
                    prepareMove();
                } else if(match = line.match(/^info .*\bdepth (\d+) .*\bnps (\d+)/)) {
                    engine1Status.search = 'Depth: ' + match[1] + ' Nps: ' + match[2];
                }
                if(match = line.match(/^info .*\bscore (\w+) (-?\d+)/)) {
                    var score = parseInt(match[2]) * (game.turn() == 'w' ? 1 : -1);
                    if(match[1] == 'cp') {
                        engine1Status.score = (score / 100.0).toFixed(2);
                    } else if(match[1] == 'mate') {
                        engine1Status.score = '#' + score;
                    }
                    if(match = line.match(/\b(upper|lower)bound\b/)) {
                        engine1Status.score = ((match[1] == 'upper') == (game.turn() == 'w') ? '<= ' : '>= ') + engine1Status.score
                    }
                }
            }            
        }
        displayStatus1();
    };
    
    engine2.onmessage = function(event) {
        var line = event.data;
        if(line == 'uciok') {
            engine2Status.engineLoaded = true;
        } else if(line == 'readyok') {
            engine2Status.engineReady = true;
        } else {
            var match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])?/);
            var turn = game.turn() == 'w' ? 'white' : 'black';
            
            if(turn != playerColor) {
                if(match) {
                    isEngineRunning = false;
                    game.move({from: match[1], to: match[2], promotion: match[3]});
                    prepareMove();
                } else if(match = line.match(/^info .*\bdepth (\d+) .*\bnps (\d+)/)) {
                    engine2Status.search = 'Depth: ' + match[1] + ' Nps: ' + match[2];
                }
                if(match = line.match(/^info .*\bscore (\w+) (-?\d+)/)) {
                    var score = parseInt(match[2]) * (game.turn() == 'w' ? 1 : -1);
                    if(match[1] == 'cp') {
                        engine2Status.score = (score / 100.0).toFixed(2);
                    } else if(match[1] == 'mate') {
                        engine2Status.score = '#' + score;
                    }
                    if(match = line.match(/\b(upper|lower)bound\b/)) {
                        engine2Status.score = ((match[1] == 'upper') == (game.turn() == 'w') ? '<= ' : '>= ') + engine2Status.score
                    }
                }
            }            
        }
        displayStatus2();
    };

    var onDrop = function(source, target) {
        // see if the move is legal
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a pawn for example simplicity
        });

        // illegal move
        if (move === null) return 'snapback';

        prepareMove();
    };

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    var onSnapEnd = function() {
        board.position(game.fen());
    };

    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    if(options.book) {
        var bookRequest = new XMLHttpRequest();
        bookRequest.open('GET', options.book, true);
        bookRequest.responseType = "arraybuffer";
        bookRequest.onload = function(event) {
            if(bookRequest.status == 200) {
                // engine.postMessage({book: bookRequest.response});
                engine1.postMessage({book: bookRequest.response});
                engine2.postMessage({book: bookRequest.response});
                engine1Status.book = 'ready.';
                engine2Status.book = 'ready.';
                displayStatus1();
                displayStatus2();
            } else {
                engine1Status.book = 'failed!';
                engine2Status.book = 'failed!';
                displayStatus1();
                displayStatus2();
            }
        };
        bookRequest.send(null);
    } else {
        engine1Status.book = 'none';
        engine2Status.book = 'none';
    }

    board = new ChessBoard('board', cfg);

    return {
        reset: function() {
            game.reset();
            // uciCmd('setoption name Contempt Factor value 0');
            // uciCmd('setoption name Skill Level value 20');
            // uciCmd('setoption name Aggressiveness value 100');

            uciCmd1('setoption name Contempt Factor value 0');
            uciCmd1('setoption name Skill Level value 20');
            uciCmd1('setoption name Aggressiveness value 100');

            uciCmd2('setoption name Contempt Factor value 0');
            uciCmd2('setoption name Skill Level value 7');
            uciCmd2('setoption name Aggressiveness value 100');
        },
        loadPgn: function(pgn) { game.load_pgn(pgn); },
        setPlayerColor: function(color) {
            playerColor = color;
            board.orientation(playerColor);
        },
        setSkillLevel1: function(skill1) {
            // uciCmd('setoption name Skill Level value ' + skill);
            uciCmd1('setoption name Skill Level value ' + skill1);
        },
        setSkillLevel2: function(skill2) {
            // uciCmd('setoption name Skill Level value ' + skill);
            uciCmd2('setoption name Skill Level value ' + skill2);
        },
        setTime: function(baseTime, inc) {
            time = { wtime: baseTime * 1000, btime: baseTime * 1000, winc: inc * 1000, binc: inc * 1000 };
        },
        setDepth1: function(depthLevel1) {
            depth1 = depthLevel1;
        },
        setDepth2: function(depthLevel2) {
            depth2 = depthLevel2;
        },
        // setDepth: function(depth) {
        //     time = { depth: depth };
        // },
        setNodes: function(nodes) {
            time = { nodes: nodes };
        },
        setContempt: function(contempt) {
            // uciCmd('setoption name Contempt Factor value ' + contempt);
        },
        setAggressiveness: function(value) {
            // uciCmd('setoption name Aggressiveness value ' + value);
        },
        setDisplayScore: function(flag) {
            displayScore = flag;
            displayStatus1();
            displayStatus2();
        },
        start: function() {
            // uciCmd('ucinewgame');
            // uciCmd('isready');

            uciCmd1('ucinewgame');
            uciCmd1('isready');

            uciCmd2('ucinewgame');
            uciCmd2('isready');
            engine1Status.engineReady = false;
            engine1Status.search = null;

            engine2Status.engineReady = false;
            engine2Status.search = null;
            
            displayStatus1();
            displayStatus2();
            prepareMove();
        },
        undo: function() {
            if(isEngineRunning)
                return false;
            game.undo();
            game.undo();
            engine1Status.search = null;
            engine2Status.search = null;
            displayStatus1();
            displayStatus2();
            prepareMove();
            return true;
        }
    };
}
