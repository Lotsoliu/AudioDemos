const canvasWidth = 300, canvasHeight = 600;
const COLS = 10, ROWS = 20;
const BLOCK_W = canvasWidth / COLS, BLOCK_H = canvasHeight / ROWS;
var board = [];
var lose;
var interval;
var current; // 目前正在移动的方块
var currentX, currentY; // 目前方块的位置
var freezed; // 目前的方块是否固定到方框当中了？
var shapes = [
    [ 1, 1, 1, 1 ],
    [ 1, 1, 1, 0,
      1 ],
    [ 1, 1, 1, 0,
      0, 0, 1 ],
    [ 1, 1, 0, 0,
      1, 1 ],
    [ 1, 1, 0, 0,
      0, 1, 1 ],
    [ 0, 1, 1, 0,
      1, 1 ],
    [ 0, 1, 0, 0,
      1, 1, 1 ]
];

// 每个方块的颜色
var colors = [
    'cyan', 'orange', 'blue', 'yellow', 'red', 'green', 'purple'
];
// 获取浏览器语音识别对象
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition

// 单词列表
const oprations = ['左', '右','下','落地', '翻转']

// 初始化语音识别对象
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.lang = 'cmn-Hans-CN';
recognition.interimResults = false;
recognition.maxAlternatives = 10;

recognition.onresult = function(event) {
  var result = event.results[event.resultIndex];
  for(let i = 0;i<result.length;i++){
    if(oprations.includes(result[i].transcript)){
    //   console.log(result[i].transcript);
        move(result[i].transcript);
    }
  }
}

recognition.onnomatch = function(event) {
    console.log("未识别出结果")
}

recognition.onend = () => {
  console.log("语音识别服务失去连接");
  index = 0;
  recognition.start();
};

recognition.onerror = function(event) {
  console.log(event.error);
}

// 创建一个新的方块形状，大小为4*4
function newShape() {
    var id = Math.floor( Math.random() * shapes.length ); //id决定形状和颜色
    var shape = shapes[ id ];

    current = [];
    for ( var y = 0; y < 4; ++y ) {
        current[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            var i = 4 * y + x;
            if ( typeof shape[ i ] != 'undefined' && shape[ i ] ) {
                current[ y ][ x ] = id + 1;
            }
            else {
                current[ y ][ x ] = 0;
            }
        }
    }
    
    // 新的形状开始移动
    freezed = false;
    // 当前方块的位置
    currentX = 5;
    currentY = 0;
}

// 清除board
function init() {
    for ( var y = 0; y < ROWS; ++y ) {
        board[ y ] = [];
        for ( var x = 0; x < COLS; ++x ) {
            board[ y ][ x ] = 0;
        }
    }
}

// 保持元素向下移动，创造新的形状和清除方块已满的行
function tick() {
    if ( valid( 0, 1 ) ) {
        ++currentY;
    }
    // 该方块无法继续移动
    else {
        freeze();
        valid(0, 1);
        clearLines();
        if (lose) {
            clearInterval( interval );
            alert("游戏结束！")
            return false;
        }
        newShape();
    }
}

// 在其位置上停住形状并将其固定在板上
function freeze() {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                board[ y + currentY ][ x + currentX ] = current[ y ][ x ];
            }
        }
    }
    freezed = true;
}

// 返回当前方块的逆时针旋转
function rotate2( current ) {
    var newCurrent = [];
    for ( var y = 0; y < 4; ++y ) {
        newCurrent[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            newCurrent[ y ][ x ] = current[ 3 - x ][ y ];
        }
    }

    return newCurrent;
}

// 查看是否存在需要消除的行
function clearLines() {
    for ( var y = ROWS - 1; y >= 0; --y ) {
        var rowFilled = true;
        for ( var x = 0; x < COLS; ++x ) {
            if ( board[ y ][ x ] == 0 ) {
                rowFilled = false;
                break;
            }
        }
        if ( rowFilled ) {
            document.getElementById( 'clearsound' ).play();
            for ( var yy = y; yy > 0; --yy ) {
                for ( var x = 0; x < COLS; ++x ) {
                    board[ yy ][ x ] = board[ yy - 1 ][ x ];
                }
            }
            ++y;
        }
    }
}

function move( key ) {
    switch ( key ) {
        case '左':
            if ( valid( -1 ) ) {
                --currentX;
            }
            break;
        case '右':
            if ( valid( 1 ) ) {
                ++currentX;
            }
            break;
        case '下':
            if ( valid( 0, 1 ) ) {
                ++currentY;
            }
            break;
        case '翻转':
            var rotated = rotate2( current );
            if ( valid( 0, 0, rotated ) ) {
                current = rotated;
            }
            break;
        case '落地':
            while( valid(0, 1) ) {
                ++currentY;
            }
            tick();
            break;
    }
}

// 查看下一步位置是否合法
function valid( offsetX, offsetY, newCurrent ) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    offsetX = currentX + offsetX;
    offsetY = currentY + offsetY;
    newCurrent = newCurrent || current;

    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( newCurrent[ y ][ x ] ) {
                if ( typeof board[ y + offsetY ] == 'undefined'
                  || typeof board[ y + offsetY ][ x + offsetX ] == 'undefined'
                  || board[ y + offsetY ][ x + offsetX ]
                  || x + offsetX < 0
                  || y + offsetY >= ROWS
                  || x + offsetX >= COLS ) {
                    if (offsetY == 1 && freezed) {
                        lose = true; // lose if the current shape is settled at the top most row
                        document.getElementById('playbutton').disabled = false;
                    } 
                    return false;
                }
            }
        }
    }
    return true;
}



function setup(){
    clearInterval( interval );
    init();
    newShape();
    lose = false;
    createCanvas(canvasWidth, canvasHeight);
    interval = setInterval( tick, 2000 );
    recognition.start()
}


function draw(){
    background(220);
    for ( let x = 0; x < COLS; ++x ) {
        for ( let y = 0; y < ROWS; ++y ) {
            if ( board[ y ][ x ] ) {
                fill(colors[ board[ y ][ x ] - 1 ]);
                noStroke();
                rect( BLOCK_W * x, BLOCK_H * y, BLOCK_W - 1 , BLOCK_H - 1 );
                stroke('black');
                noFill();
                rect( BLOCK_W * x, BLOCK_H * y, BLOCK_W - 1 , BLOCK_H - 1 );
            }
        }
    }
    for ( let y = 0; y < 4; ++y ) {
        for ( let x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                fill(colors[ current[ y ][ x ] - 1 ]);
                noStroke();
                rect( BLOCK_W * (currentX + x), BLOCK_H * (currentY + y), BLOCK_W - 1 , BLOCK_H - 1 );
                stroke('black');
                noFill();
                rect( BLOCK_W * (currentX + x), BLOCK_H * (currentY + y), BLOCK_W - 1 , BLOCK_H - 1 );
            }
        }
    }
}