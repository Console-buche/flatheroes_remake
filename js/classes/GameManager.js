
import { hero, animate, missiles, floors, scene, buildLevel, slv, baseHero } from '../app.js';
import { Burst } from './Bursts.js';

export class GameManager {
    constructor() {
        this.currentLevel = "level0";
        this.isPending = false;
        this.isFrozen = false;
        this.missilesTotal = null;
        this.remainingMissiles = null;
        this.tick = document.querySelector("#tickLevelDone")
    }

    toggleTick(tog, retrying) {
        if (retrying) {
            return;
        } else if (tog == "show") {
            this.tick.setAttribute("class", "showTick");
        } else {
            this.tick.setAttribute("class", "");
        }
    }

    async setup(lvl) {
        return new Promise(resolve => {
        floors.children.forEach(async structure => {

            //console.log(structure);
    
                if (structure.leName == lvl || structure.leName == "wall")  {
                    await structure.tweenStructure("add");
                    resolve();
                } else {
                    structure.position.copy(new THREE.Vector3(999,999,0));
                }

           });
        });
    }

    async playerWantsToContinue() {
        let timer = 0;
        return new Promise(res => {
            window.addEventListener('keydown', function(e) {
                if (e.keyCode == 13)
                timer++;
                //if (timer > 30) res();
                res();
            });
            window.addEventListener('keyup', (e) => timer = (e.keyCode == 13) ? 0 : timer);
        });
    }

    async nextLevel(lvl) {
        const infoPanel = document.getElementById("info");
        infoPanel.style.display = "grid";
        hero.linesShaderPlane.material.uniforms.shouldBeVisible.value = false;
        const retrying = hero.isHit;
        this.currentLevel = (lvl.length <= 6) ? lvl.slice(-1) : lvl.slice(-2);
        this.toggleTick("show", retrying)
        
        hero.visible = false;
        hero.speedLines_holder.visible = false;
        const prevLvl = (this.currentLevel > 0 )  ? this.currentLevel-1:0;
        await this.delay(1500);
        const arr = floors.children.filter(struct => struct.leName == `level${prevLvl}`);
        arr.forEach(s => s.tweenStructure("remove"));

        console.log("WAITING FOR PLAYER INPUT")
        await this.playerWantsToContinue();
        infoPanel.style.display = "none";
        console.log("PLAYER MOVES ON TO NEXT LEVEL")
        this.toggleTick("hide", retrying)


        
        const hud = document.querySelector("progress-ring").shadowRoot.querySelector("#hud")
        hud.textContent = this.currentLevel;
        await this.setup(lvl);
        
        console.log("should go");
        
        hero.isHit = false;
    
        hero.children[0].material.opacity = 0;
        hero.material.color = new THREE.Color("rgb(114, 156, 36)");
        hero.material.opacity = 1;
        hero.children[0].material.size = 0.8;
        hero.burst.reset();

    
        //reset salves state
        slv.reset();    //RESET FROM HERE DYNAMICALY TODO::::

        //wipe out all objects
        
        if (missiles.length > 0) {
        for (let missile of missiles) {
            this.deleteFromScene(missile);
        }
    }

/*
        if (lvl !== "level1") {
        for (let structure of floors.children) {
            const object = scene.getObjectByProperty( 'uuid', structure.uuid );
            this.deleteFromScene(object);
        }
    }*/
       // this.deleteFromScene(floors);

      

        
       const dis = this;
        setTimeout(function() {
 //build level
 const nextLevel = lvl;
 buildLevel(nextLevel);
    // console.log("building next level")
 //position hero
 
 hero.position.copy(hero.startPos);
 hero.visible = true;
 setTimeout(function() {
 hero.speedLines_holder.visible = false;
 hero.linesShaderPlane.material.uniforms.shouldBeVisible.value = true;
 },1000);
 dis.isFrozen = false;
        }, 250);

    }

    logMeshes() {
        let count = 0;

        scene.children.forEach(child => {
            if (child.type == "Mesh") {
            count++;
           // console.log(child)
            }
        });

        console.log(`${count} meshe(s) found!`);
            
    }

    deleteFromScene(object) {
        object.geometry.dispose();
        object.material.dispose();
        scene.remove( object );
    }

    start() {
        //reset cube pos
        hero.position.copy(hero.startPos);
        animate();
    }


    //insane async/await for high order array & object operations 
    //Doc :
    //https://advancedweb.hu/how-to-use-async-functions-with-array-some-and-every-in-javascript/
 
    async asyncEvery (arr, predicate) {
        for (let e of arr) {
            if (await predicate(e)) return false;
        }
        return true;
    };

    async structuresAreAllSet(lllvvvlll) {
        console.log(lllvvvlll)
        const arr = floors.children.filter(struct => struct.leName == lllvvvlll);
         
        let t = 1000;
        console.log("starting");
        await this.delay(t);
        console.log(`Waited for ${t}ms`)

        console.log(arr)
        
        await this.asyncEvery(arr, async (i) => {
            console.log(`Checking ${i.doneMoving}`);
            return i.doneMoving === true;
        });
        
    }

    async removeStructures(lllvvvlll) {
        console.log(lllvvvlll)
        const arr = floors.children.filter(struct => struct.leName == lllvvvlll);

    }
         

    async delay(t) {
        return new Promise(resolve => {
            setTimeout(resolve, t);
        });
    }

    checkIfAllDoneMoving(s) {
        return s.doneMoving == true;
    }
}