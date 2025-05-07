import { camera } from "../app.js";

export class Structure extends THREE.Mesh {

    constructor(color, width, height, x, y, name, z = 0.5) {
        super();
        this.material = new THREE.MeshLambertMaterial({
            color: color
            
        });
        this.geometry = new THREE.BoxGeometry(width, height, z);
        this.userData.height = y + (height / 2) + 0.5;
        this.showPos = { x : x, y : y, z: 0};
        this.position.x = (name !== "wall") ? x : -999;
        this.position.y = (name !== "wall") ? y : -999;
        this.position.z = 0;
        this.leName = name;
    }

    async tweenStructure(state) {

        
       this.position.copy(this.showPos);

       if (state == "add") {
        return new Promise(resolve => {
        const dis = this;
        var tween = new TWEEN.Tween({
            x:(Math.random() * 0.3) - 0.15,
            y:(Math.random() * 0.3) - 0.15
        })
        .easing(TWEEN.Easing.Elastic.Out)
        .to({
            x:dis.showPos.x,
            y:dis.showPos.y
        }, Math.random() * 1000 + 2000)
        .onUpdate(function () {
            //console.log(this.pos);
            dis.position.x = this.x;
            dis.position.y = this.y;
        })
        .onComplete(() => {
            console.log("Time's up")
            resolve();
        })
    tween.start();
        });
    }else if (state == "remove") {
        console.log("REMOVING")
        return new Promise(resolve => {
            const dis = this;
            var tween = new TWEEN.Tween({
                y:dis.showPos.y,
                z:dis.showPos.z
            })
            .easing(TWEEN.Easing.Elastic.Out)
            .to({
                y:camera.position.y,
                z:100
            }, Math.random() * 1000 + 2000)
            .onUpdate(function () {
                //console.log(this.pos);
                dis.position.y = this.y
                dis.position.z = this.z
            })
            .onComplete(() => {
                console.log("Time's up")
                resolve();
            })
        tween.start();
            });
    }
    
    }

}