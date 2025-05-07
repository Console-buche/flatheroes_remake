
// source: https://css-tricks.com/building-progress-ring-quickly/

export class ProgressRing extends HTMLElement {
    constructor() {
        super();
      
        // get config from attributes
        const stroke = this.getAttribute('stroke');
        const radius = this.getAttribute('radius');
        const normalizedRadius = radius - stroke * 2;
        this._circumference = normalizedRadius * 2 * Math.PI;
      
        // create shadow dom root
        this._root = this.attachShadow({mode: 'open'});
        this._root.innerHTML = `
        <div id="counterRing">
        <span id="hud">0</span>
          <svg
            height="${radius * 2}"
            width="${radius * 2}"
           >
             <circle
               stroke="#5c553a"
               stroke-dasharray="${this._circumference} ${this._circumference}"
               style="stroke-dashoffset:${this._circumference}"
               stroke-width="${stroke}"
               fill="transparent"
               r="${normalizedRadius}"
               cx="${radius}"
               cy="${radius}"
            />
          </svg>
          </div>
      
          <style>
            #counterRing {
              position: absolute;
              right: 17vmax;
            }
            #hud {
              font-size: 3em;
              color: #5c553a;
              text-align: center;
              position: absolute;
              width: 100%;
              top: 4vmax;
            }
            circle {
              transition: stroke-dashoffset 0.35s;
              transform: rotate(-90deg);
              transform-origin: 50% 50%;
            }
          </style>
        `;
      }

      setProgress(percent) {
        const offset = this._circumference - (percent / 100 * this._circumference);
        const circle = this._root.querySelector('circle');
        circle.style.strokeDashoffset = offset; 
      }
      
      static get observedAttributes() {
        return [ 'progress' ];
      }
      
      attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'progress') {
          this.setProgress(newValue);
        }
      }

}

window.customElements.define('progress-ring', ProgressRing);