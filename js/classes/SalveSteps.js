
import { manager } from '../app.js';
import { levels } from '../data/levels.js';

//interface entre les salves
export class SalvesManager {
    constructor(salvesCount) {
        this.salvesCount = salvesCount; //on level init, feed this util the class count
        this.salves = new Map([
            ['salve1',  true],
            ['salve2',  false],
            ['salve3', false]
          ]);
        this.gameRange = {min:-13.5, max:13};    //TODO FEED THE SALVESMANAGER VALUES FROM LEVEL ? OR KEEP GAME BOARD RANGE ?
        this.currentStep = 0;
    }

    updateSteps() {
        //console.log("updating steps")
    }

    reset() {   //T0D0 : BEURK, MAKE THIS DYNAMIC TAKING INTO ACCOUNT NEXT LEVEL OPTIONS (nb of salves) AND POPULATE MAP ACCORDINGLY
        const currentLevel = manager.currentLevel;

        //console.log(levels["level"+currentLevel]);
        //reset map
        this.salves = new Map();
        console.log(currentLevel)
        const { options } = levels["level"+currentLevel].level;
        //console.log(options)

        Object.entries(options.salvesReadyStatusAtStart).forEach((s, k) => {
     
             this.salves.set(s[0], s[1].ready)
           
        });

      // console.log(this.salves);
        
        
    }

    normalizedSalveRange(val, max = this.gameRange.max, min = this.gameRange.min) { return (val - min) / (max - min); }


}