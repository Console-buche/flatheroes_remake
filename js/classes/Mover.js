import * as THREE from '../libs/three/build/three.module.js';
import { hero } from '../app.js';
export class Mover {

    constructor(object) {
        this.object = object;
        this.moveStats = new Map([ //movestats values get normalized and multiplied by speedMultiplier
            [39, 1], //right
            [37, -1] //left

        ]);
        this.hanggable = new Map([
            [39, true], //right
            [37, true] //left

        ]);
        this.keyState = null;
        this.debugger = false;
        this.debugga = false;
        this.hangingTimeout = null;
        this.canHangAgain = false;
        this.lastAction = null;
        this.maxX = 99999;
        this.minX = -99999;
        this.hangingMinMax = {
            min: -99999,
            max: 99999
        }
        this.physics = {
            speedMultiplier: 0.2,
            squareWheelMultiplier: 0,
            state: {
                jump: {
                    active: false,
                    value: 0.5
                },
                isFalling: {
                    active: false
                },
                isHanging: {
                    active: false
                }
            },
            dampenFactor: 0,
            acceleration: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            forces: {
                gravity: new THREE.Vector3(0, -0.015, 0)
            }
        }
        this.keyboardMap = new Map([
            [39, "x"], //right
            [37, "x"],
            [32, "y"]
        ]);
        this.commands = new Set();
        this.dir = null;
        this.lastKey = null;
        this.lastDir = null;
        this.speed = {
            x: 0,
            y: 0,
            z: 0
        };
        this.canDoubleJump = true;
        this.isTweening = false;
        this.isLastRolling = false;
        this.rot = 0; //rot on z axis
        this.activeTween = null;
        this.accelerate = 0;
        this.angles = [Math.PI * 2, Math.PI / 2, Math.PI, 0]
        this.life = 0; //counter since creation, sort of clock to determine anim speed etc
        this.boosting = false;
    }

    get _speed() {
        return new THREE.Vector3(this.speed.x, this.speed.y, this.speed.z);
    }

    get _dampenFactor() {
        return this.physics.dampenFactor;
    }

    get _rot() {
        return this.rot;
    }

    resetSpeed() {
        // this.speed = new THREE.Vector3(0, 0, 0);
    }

    update() {
        //TODO : make this work with AZERTY and QWERTY
        //azerty keyboard, right arrow
        let dir = this.keyboardMap.get(this.dir);
        if (dir) {
            this.resetSpeed();
            this.speed[this.keyboardMap.get(this.dir)] = this.moveStats.get(this.dir);
            //  console.log(this.speed)
        }
    }

    async handleMove(move) {
        let key = Object.values(move)[0];
        //Destruct physics
        let {
            acceleration,
            velocity,
            state: {
                jump,
                isFalling,
                isHanging
            }
        } = this.physics

        this.lastKey = key;
        if (this.keyboardMap.has(key) && key !== 32) { //check if key is authorized before handling
            this.saveInput(move);
        } else if (this.keyboardMap.has(key) && key == 32 && jump.active == false && Object.keys(move)[0] === "keydown" && !isFalling.active) {
            acceleration.y = jump.value;
            jump.active = true;
            isFalling.active = false;
        } else if (this.keyboardMap.has(key) && key == 32 && jump.active && this.canDoubleJump && Object.keys(move)[0] === "keydown") {
            console.log("DOUBLE JUMP");

            velocity.multiplyScalar(0);
            acceleration.multiplyScalar(0);
            acceleration.y = jump.value / 1.5;
            jump.active = true;
            isFalling.active = false;
            this.canDoubleJump = false;
        } else if (key == 32 && isHanging.active) {
            // console.log("JUMP GODAMNIT")
            this.jumpRelease(this.dir)
        } 

        //NINJA DASH MOVE
        if (key == 17 && !this.boosting) {
            this.boosting = true;
            console.log("EN TRAIN DE BOOSTEEEEER")
            hero.ninjaDash(this.boosting);
            await this.boostSpeed();
            console.log("PCHIOUUUU C'EST FINI DE BOOSTER");

            this.boosting = false;
            hero.ninjaDash(this.boosting)
        }
    }

    async boostSpeed() {
         return  new Promise(res => setTimeout(res, 150));
    }

    saveInput(action) {
        this.keyState = Object.keys(action)[0];
        if (Object.keys(action)[0] == "keydown") {
            !this.commands.has(Object.values(action)[0]) && this.commands.add(Object.values(action)[0]);
        } else if (Object.keys(action)[0] == "keyup") {
            this.commands.has(Object.values(action)[0]) && this.commands.delete(Object.values(action)[0]);
        }

        this.setDir();
    }

    setDir() {
        this.dir = [...this.commands][
            [...this.commands].length - 1
        ];
        this.update();
        //update physics
        this.physics.dampenFactor = this.physics.speedMultiplier; //TODO add this to constructor, remove the hardcode in here
    }


    /*
     *   BELOW FUNCTIONS CALLED FROM HERO CLASS
     */
    updatePhysics() {
        if (!this.dir) {
            // console.log(this.physics.dampenFactor);
            //this.physics.dampenFactor = 0;
            this.physics.dampenFactor = (this.physics.dampenFactor > 0.06) ? this.physics.dampenFactor - 0.005 : 0; //TODO : add these values to constructor, remove from hardcore here
        } else {
            this.lastDir = this.dir; //save last known direction for passive use, as during jump (keep rollin)
        }
        this.roll();
    }

    nextRoll(leDir) {

        //Destruct
        let {
            physics,
            physics: {
                state: {
                    jump,
                    isHanging,
                    isFalling
                }
            }
        } = this;

        let accelerateMidair = this._dampenFactor * 1500 || 250; //default 200 for static jump
        let time = 250;
        if (jump.active) {
            time = accelerateMidair;
        } else if (isFalling.active) {
            time = accelerateMidair;
            // console.log("TIME ")
        }

        let rotZ = null;
        if (leDir) {
            switch (leDir) {
                case 37:
                    rotZ = this.object.rotation.z + Math.PI / 2;
                    break;
                case 38:
                    rotZ = this.object.rotation.z - Math.PI / 2;
                    break
            }
        }

        //if cube starts hanging, speed it up to finish and "stick" to the wall. TODO : add easing ?
        if (isHanging.active && !this.debugga) { //TODO : rename debugga. Debugga is used as flag to prevent chaning end rot tween as box is sliding down
            //  console.log(this.activeTween);
            // this.activeTween._duration *= 0.7;
            this.debugga = true;
            //console.log(this.activeTween._valuesEnd.rotZ);
            this.activeTween._valuesEnd.rotZ = (leDir == 37) ? this.activeTween._valuesEnd.rotZ - Math.PI / 2 : this.activeTween._valuesEnd.rotZ + Math.PI / 2;
            this.activeTween._valuesEnd.rotZ = this.activeTween._valuesEnd.rotZ % (Math.PI * 2);

            //console.log(this.activeTween._valuesEnd.rotZ);
            //console.log('change rot')
        }

        if (!this.isTweening && leDir && !isHanging.active) {
            var dis = this;
            var orientation = {
                rotZ: (leDir == 37) ? (dis.object.rotation.z + Math.PI / 2) : (dis.object.rotation.z - Math.PI / 2)
            };

            var tween = new TWEEN.Tween({
                    rotZ: this.object.rotation.z
                })
                .to(
                    orientation, time)
                .onUpdate(function (e) {
                    dis.object.rotation.z = this.rotZ;
                    dis.object.rotation.z = this.rotZ % (Math.PI * 2)
                    //dis.object.position.add(dis._speed.normalize().multiplyScalar(0.05));
                    //dis.physics.speedMultiplier = e / 10; //TODO : influence speed based on easing to prevent cube moving linearly (as would a nice round wheel)
                    if (!jump.active || isFalling.active) {
                        physics.squareWheelMultiplier = e;
                    } else {
                        physics.squareWheelMultiplier = 1;
                    }

                })
                .onStart(function () {
                    dis.isTweening = true;
                    dis.activeTween = tween;
                })
                .onComplete(function () {
                    dis.isTweening = false;
                    physics.squareWheelMultiplier = 0;
                    dis.debugga = false;
                    //dis.physics.speedMultiplier = 0.1;
                });

            tween.start();

        }
    }

    roll() {

        if (this.dir == 37 || this.dir == 39 || this.physics.state.jump.active) {
            this.nextRoll(this.dir);
        }

    }

    hang() {

        //Destruct physics
        let {
            velocity,
            acceleration,
            state
        } = this.physics;

        if (this.hanggable.get(this.dir) == true) {
            velocity.multiplyScalar(0);
            acceleration.multiplyScalar(0);
            state.isHanging.active = true;
        }

    }

    async delay(t) {
        return new Promise(resolve => {
            setTimeout(resolve, t);
        });
    }

    async release() {
        await this.delay(100);
        this.physics.state.isHanging.active = false;
        // console.log("RELEAAAASE")
    }


    jumpRelease(leDir) {

        let {
            hanggable,
            physics: {
                state: {
                    isHanging,
                    jump,
                    isFalling
                },
                velocity,
                acceleration
            }
        } = this;

        hanggable.set(leDir, false);
        isHanging.active = false;
        velocity.y = 0;
        acceleration.y = jump.value;
        jump.active = true;
        isFalling.active = false;
    }

}