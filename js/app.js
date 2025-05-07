import * as THREE from './libs/three/build/three.module.js';
import {
    Hero
} from './classes/Hero.js';
import {
    Structure
} from './classes/Structure.js';
import {
    Missile
} from './classes/Missile.js';

import {
    levels
} from './data/levels.js';
import {
    SalvesManager
} from './classes/SalveSteps.js';

import {
    GameManager
} from './classes/GameManager.js';
import {
    ProgressRing
} from './classes/ProgressRing.js';

let nbOfMissiles = null;
let missiles = [];
let manager = null;
let levelStructs = {
    level1: [],
    level2: [],
    level3: []
};
let baseHero = null;


//check if mobile
// source : https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };



var raycasterDown = new THREE.Raycaster();
var raycasterRight = new THREE.Raycaster();
var raycasterLeft = new THREE.Raycaster();
var raycasterTop = new THREE.Raycaster();

const slv = new SalvesManager();


var floors = new THREE.Object3D();
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
//renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

var light = new THREE.AmbientLight(0x0000, 0.3); // soft white light
scene.add(light);

var dLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dLight.position.z = 10;
dLight.target.set = new THREE.Vector3(0, 0, 0);
scene.add(dLight);

var plight = new THREE.PointLight(0xFAFA00, 1, 50);
scene.add(plight);

camera.position.x = 5;
camera.position.y = 21;
camera.position.z = 28;


var animate = function () {
    if (manager) {
        requestAnimationFrame(animate);
        TWEEN.update();
        
        if (!manager.isFrozen) {
            if (missiles.length == nbOfMissiles) {

                missiles.forEach((m) => {
                    m.update();
                })
            }

        } else {
            if (missiles.length == nbOfMissiles) {
                missiles.forEach((m) => {
                    m.fadeEndLevel();
                })
            }
        }

        if (hero) {
            castRays(hero);
            hero.update();
        }
        renderer.render(scene, camera);
    }
};

//LEVEL MAKER 
//TODO : AUTOMATE THIS FROM JSON DESCRIPTOR FILE
//struct => color, width, height, posX, posY
const thinness = 0.55;


//LEVEL 1

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 27, 1 * thinness, -1, 18, "level1");
floors.add(struct4);


//LEVEL 2

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 15, 1 * thinness, -7, 19, "level2");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 15, 1 * thinness, 17, 19, "level2");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 20, 1 * thinness, 15, 35, "level2");
floors.add(struct4);


//LEVEL 3 : ONLY WALLS
scene.add(floors);


//LEVEL 4
const reminder = new Structure()
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 10, -8, 32, "level4");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 10, 18, 32, "level4");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 8, 1 * thinness, 14.25, 27, "level4");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 8, 1 * thinness, -4.5, 20, "level4");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 9, 1 * thinness, 13.5, 15, "level4");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 11, 1 * thinness, -2, 10, "level4");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 11, 1 * thinness, 13, 5, "level4");
floors.add(struct4);

//LEVEL 5
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 10, -11, 35, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 10, 21, 35, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 10, 5, 27, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 15, 1 * thinness, 5, 32, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 9, 1 * thinness, 16, 25, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 9, 1 * thinness, -7, 25, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 9, 1 * thinness, 15, 16, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 9, 1 * thinness, -5, 16, "level5");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 20, 1 * thinness, 5, 8, "level5");
floors.add(struct4);


//LEVEL 6
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 26, 1 * thinness, 2, 7, "level6");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 20, 1 * thinness, 4.5, 19, "level6");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 26, 1 * thinness, 7.5, 31, "level6");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 9, -12.5, 25, "level6");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 9, 22, 13, "level6");
floors.add(struct4);


//LEVEL 7
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 8, 1 * thinness, 14, 7, "level7");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 8, 1 * thinness, -3, 12, "level7");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 7, 1 * thinness, -6, 25, "level7");
floors.add(struct4);


var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 6, 5, 22, "level7");
floors.add(struct4);


var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 8, 1 * thinness, 16, 22, "level7");
floors.add(struct4);

//LEVEL 8
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 16, 5, 14, "level8");
floors.add(struct4);

//LEVEL 9
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 25, 1 * thinness, -2, 28, "level9");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 25, 1 * thinness, 12, 19, "level9");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 25, 1 * thinness, -2, 9, "level9");
floors.add(struct4);

//LEVEL 10
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 15, 1 * thinness, 2, 37.5, "level10");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 15, 1 * thinness, 9, 2.5, "level10");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 15, -12, 16, "level10");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 15, 22, 23, "level10");
floors.add(struct4);

//LEVEL 11
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 30, 1 * thinness, 0, 22, "level11");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 15, 1 * thinness, 0, 11, "level11");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 15, 7.5, 7, "level11");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 6, -4, 3, "level11");
floors.add(struct4);


//LEVLE 12
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 7, 5, 16, "level12");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 7, -5, 10, "level12");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 7, 15, 10, "level12");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 6, 1 * thinness, 17, 27, "level12");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 6, 1 * thinness, -8, 27, "level12");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 8, 1 * thinness, 5, 32, "level12");
floors.add(struct4);

//LEVEL 13
//NO STRUCTURES

//LEVLE 14
var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 14, -7, 17, "level14");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 1 * thinness, 14, 17, 17, "level14");
floors.add(struct4);

var struct4 = new Structure(new THREE.Color("rgb(254, 107, 62)"), 24, 1 * thinness, 5, 17, "level14");
floors.add(struct4);


//4 WALLS
var ground = new Structure(new THREE.Color("rgb(251, 106, 53)"), 40, 1 * thinness, 5, 0, "wall");
floors.add(ground);

var rightWall = new Structure(new THREE.Color("rgb(109, 144, 39)"), 1 * thinness, 40, 24.75, 20, "wall");
floors.add(rightWall);

var celing = new Structure(new THREE.Color("rgb(215, 190, 68)"), 40, 1 * thinness, 5, 40, "wall");
floors.add(celing);

var leftWall = new Structure(new THREE.Color("rgb(84, 71, 50)"), 1 * thinness, 40, -14.75, 20, "wall");
floors.add(leftWall);

floors.children.forEach(s => s.position.z = 100)

//ADD HERO
let hero = new Hero("flatHero");
hero.init();

baseHero = hero;

/*
var debug = new Hero("Debugger");
debug.position.z = 10;
debug.visible = false;
scene.add(debug);
*/




//event listeners
//TODO : réécrire tout ce basard et bind les listeners au document en déclenchant les methods de la classe Hero (comme hero.update)...
document.addEventListener("keydown", (e) => {
    if (e.keyCode == 13) {
        manager.shouldContinue = true;
    } else {
        hero.handleMove(e);
    }
});
document.addEventListener("keyup", (e) => {
    hero.handleMove(e);
});



//document.addEventListener("keyup", hero.handleMove);

function castRays(source) {
    raycasterDown.set(source.position, new THREE.Vector3(0, -1, 0));
    raycasterRight.set(source.position, new THREE.Vector3(1, 0, 0));
    raycasterLeft.set(source.position, new THREE.Vector3(-1, 0, 0));
    raycasterTop.set(source.position, new THREE.Vector3(0, 1, 0));

    // calculate objects intersecting the picking ray
    var intersectsDown = raycasterDown.intersectObjects(floors.children);
    var intersectsRight = raycasterRight.intersectObjects(floors.children);
    var intersectsLeft = raycasterLeft.intersectObjects(floors.children);
    var intersectsTop = raycasterTop.intersectObjects(floors.children);

    let lastAc = hero.mover.lastAction;
    //console.log(lastAc);

    //console.log(hero.dirX);
    //HORIZONTAL RAYCASTING
    //WATCH TO THE RIGHT
    if (intersectsRight.length > 0) {
        hero.mover.maxX = intersectsRight[0].point.x - hero.width / 2;
        if (intersectsRight[0].distance < hero.width && hero.mover.dir == "39") {
            hero.mover.hang();
        } else

            //starts rolling as soon as loses hang on structure
            if (intersectsRight[0].distance < hero.width && hero.mover.dir !== "39") {
                hero.mover.release();
            }
        //make hanggable as soon as hero as moved away from the last struct
        if (intersectsRight[0].distance >= hero.width) {
            hero.mover.hanggable.set(39, true);
        }
    }


    //console.log(hero.mover.lastKey);
    //TODO : WATCH TO THE LEFT
    if (intersectsLeft.length > 0) {
        hero.mover.minX = intersectsLeft[0].point.x + hero.width / 2;
        if (intersectsLeft[0].distance < hero.width && hero.mover.dir == "37") {
            hero.mover.hang();
        } else
            //starts rolling as soon as loses hang on structure
            if (intersectsLeft[0].distance < hero.width && hero.mover.dir !== "37") {
                hero.mover.release();

            }
        //make hanggable as soon as hero as moved away from the last struct
        if (intersectsLeft[0].distance >= hero.width) {
            hero.mover.hanggable.set(37, true);
        }
    }
    /*
        if (hero.mover.maxX - hero.position.x > hero.width / 2) {
            hero.mover.release();
            console.log("RELEAAAASE")
        }
        */

    //console.log(hero.mover.maxX);

    //VERTICAL RAYCASTING :
    //LOOK DOWN AND WALK ON FLOORS
    if (intersectsDown.length > 0) {
        //console.log(intersects[0].object.name);
        const prevHeight = hero.floorHeight;
        hero.floorHeight = intersectsDown[0].object.userData.height;

        if (intersectsDown[0].distance < 1.1) {
            //camUpdate(intersectsDown[0].object);
            // console.log(hero.mover.lastKey)
            if (hero.mover.lastAction == "isHanging") {
                console.log("SHOULD CLEAR");
                hero.mover.physics.state.isHanging.active = false;
            }
        }
        // console.log(intersects[0].object.name);
        //intersects[0].object.material.color.set(0x00FF00);
        // console.log(intersects[i].object.name);
    }

    //LOOK UP AND BUMP ON CEILINGS
    // console.log(lastAc)
    if (intersectsTop.length > 0 && intersectsTop[0].distance < hero.width && lastAc == "jump") {

        //console.log(intersects[0].object.name)
        hero.mover.physics.velocity.y = -0.1;
        // console.log("BYMP HEAD");
    }

}

function camUpdate(floor) {
    var tween = new TWEEN.Tween({
            y: camera.position.y
        })
        .to({
            y: floor.userData.height + 5
        }, 350)
        .onUpdate(function () {
            camera.position.y = this.y;
        })
    tween.start();
}

/////////////////
/////EXPORTS/////
/////////////////

async function delay(t) {
    return new Promise(resolve => {
        setTimeout(resolve, t);
    });
}

function buildLevel(levelName) {
    missiles = []; //empty the missile array for new level
    const lvl = levelName;
    //nbOfMissiles = levels[lvl].level.salves.salve1.length + levels.level3.level.salves.salve2.length + levels.level3.level.salves.salve3.length; //TODO : write this in levels object
    //nbOfMissiles = levels.level2.salves.salve1.length + levels.level2.salves.salve2.length //TODO : write this in levels object
    //nbOfMissiles = levels.level1.salves.salve1.length; //TODO : write this in levels object

    nbOfMissiles = [...Object.values(levels[lvl].level.salves).flat()].length;
    manager.missilesTotal = nbOfMissiles
    manager.remainingMissiles = nbOfMissiles;

    const el = document.querySelector('progress-ring');
    el.setAttribute('progress', 100);

    //get current level
    let currentSalves = [];
    const {
        level: currentLevel
    } = levels[lvl]; //dynamic destructuring impossible in JS. Solution TODO : 
    const {
        options
    } = levels[lvl].level;

    //console.log(currentLevel);
    const lvlOptions = options;

    for (const salve of Object.entries(currentLevel.salves)) {
        // console.log(salve);
        currentSalves = [...currentSalves, salve];
        runSalve(salve[0], salve[1], lvlOptions);
    }

    const audioElem = document.getElementById("bassLoop");
    const audioBG = audioElem.cloneNode(true); //TODO : research, which is better : clone node, or add on init ? I think add on init ?
    audioBG.volume = 0.5;
    //audioBG.play();

}; //TODO : make this an async function AWAITing all structures to be READY. timeout(0) hacky to simply make it async

async function runSalve(salveIndex, salve, lvlOptions) {
    for (var i = 0; i < salve.length; i++) {
        // console.log(salve);
        const spawnOrder = i;
        const a = i * 10;
        let dir = null;
        if (lvlOptions.salvesReadyStatusAtStart[salveIndex].horiz) {
            dir = new THREE.Vector3(salve[i][2], 0, 0);
        } else {
            dir = new THREE.Vector3(0, salve[i][2], 0);
        }
        const startY = salve[i][1];
        const startX = salve[i][0];

        //MISSILE TRIGGERING NEXT WAVE 
        const triggerIndex = 30;
        let missile = new Missile(new THREE.Vector3(startX, startY, 0), dir, spawnOrder, salveIndex, lvlOptions);

        missiles.push(missile);
        missile.init();

    }
}


/*
 *   GAME MANAGEMENT : SWITCHING LEVELS...
 */

manager = new GameManager();
manager.start();

async function ddelay(t) {
    return new Promise(resolve => {
        setTimeout(resolve, t);
    });
}

//AT THIS POINT : WORKING ON LEVLE SWITCHING. GOTTA CHECK IF EVERY MISSILE IS DONE AND HERO IS ALIVE THEN NEXT LEVEL 

async function startGame() {
    await ddelay(1000);
    const level = "level1";
    const hud = document.querySelector("progress-ring").shadowRoot.querySelector("#hud");
    console.log(hud);
    const lvlSliced =  (level.length <= 6) ? level.slice(-1) : level.slice(-2);
    hud.textContent = lvlSliced;
    console.log(lvlSliced);
    manager.nextLevel(level)

}

if (window.mobileCheck() == false) {
startGame();
} else {
    const info = document.getElementById("info");
    info.textContent = "This does not run on mobile, sorry folk. Try it on PC. :]"
}



//DEBUG MESH
var geometry = new THREE.SphereGeometry(1, 32, 32);
var material = new THREE.MeshBasicMaterial({
    color: 0xffff00
});
var sphere = new THREE.Mesh(geometry, material);
sphere.visible = false;
scene.add(sphere);

export {
    sphere
};

/*
 * TEST AREA
 */




/*
*
*      TESTING : DELETE MESHES AFTER ROUND WIN OR LOSE
*
*
async function shoot() {
    await ddelay(2000);
    manager.logMeshes();
await ddelay(5000);
manager.nextLevel();
manager.logMeshes();

}



shoot();
*/



const missMat = new THREE.MeshBasicMaterial({color:0xFF0000})
export {
    scene,
    plight,
    hero,
    baseHero,
    missiles,
    slv,
    raycasterDown,
    raycasterRight,
    raycasterLeft,
    raycasterTop,
    floors,
    manager,
    nbOfMissiles,
    camera,
    missMat,
    animate,
    buildLevel
};