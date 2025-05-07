export class MissileShader {
    constructor(radius) {
        this.uniforms = { 
            uRadius:{value:radius},
            amountOfRed:{value:1.},
            implodeTimer: {value:-0.5},
            growth: {value: 0.0}, 
            time: { value : 0.0},
            growthAggressive: {value: 0.0},
            viz: { value: 0.0},
            missileType: { value: 0 }    //default ; 0 == bar ; 1 == homing
        },
        this.vertex = `
        varying vec2 vUv;
        varying vec3 vP;

        void main() {
        vUv = uv;

        vec3 p = vec3(position.x, position.y, position.z );
        
        vP = p;

          gl_Position = projectionMatrix *
                        modelViewMatrix  *
                        vec4(p,1.0);

        }`;
        this.fragment = `
        uniform float growth;
        uniform float uRadius;
        uniform float implodeTimer;
        uniform int missileType;
        uniform float amountOfRed;
        uniform float growthAggressive;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vP;

        float circle(vec2 uv, vec2 pos,float r,  float blur) {
            
            uv -= vec2(.5);
            uv -= pos;
            float d = length(uv);
            float dist = smoothstep(r, r-blur, d);
            
            return dist;
        }


float sharpCircle(vec2 uv, vec2 p, float r, float ta) {
    //p.y = exp(-1.*time)*(cos(.1*time)) * .2;

    // p.y += 1.;
    float d = smoothstep(r,r-0.01,distance(uv, p));
    
    return d;
}

        float Band(float t, float start, float end, float blur) {
            float step1 = smoothstep(start-blur,start+blur, t); 
            float step2 = smoothstep(end+blur,end-blur, t); 
            return step1*step2;
        }

        float Rect(vec2 uv, float left, float right, float bottom, float top, float blur) {
            
            uv -= vec2(.5);
            
            float band1 = Band(uv.x, left, right, blur);
            float band2 = Band(uv.y, bottom, top, blur);
            
            return band1*band2;
        }



        float damping(float t) {
            float dampingConstant = 0.1;
            //AMP1*EXP(-RATE1*X)*SIN(2*PI*X*FREQ1+PHASE1)
            float slowingRate = 1.75; //how fast it comes to a slow/stop
            float speedAnimation = 0.15;
            float initialAmp = 5.;
            float amplitude = initialAmp* exp(slowingRate*-t) * (sin(2.*3.14*t*2. + 6.14)) * speedAnimation;
            return amplitude;

        }

        //source : https://stackoverflow.com/questions/5193331/is-a-point-inside-regular-hexagon
        bool IsInsideHexagon(float x0, float y0, float d, float x, float y) {
            float dx = abs(x - x0)/d;
            float dy = abs(y - y0)/d;
            float a = 0.25 * sqrt(3.0);
            return (dy <= a) && (a*dx + 0.25*dy <= 0.5*a);
        }

        //https://gist.github.com/ayamflow/c06bc0c8a64f985dd431bd0ac5b557cd
        vec2 rotateUV(vec2 uv, float rotation, float mid)
{
    return vec2(
      cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
      cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}


        void main() {
            
            float t = growth;     //total animation duration
            float t2 = t-.5;   //alpha threshhold, starts after .25 elapsed time
            float t3 = t-1.5;   //elongate threshhold, starts after 1 elapsed time
            float tAggro = growthAggressive;   //elongate threshhold, starts after 1 elapsed time

            
            float radius = uRadius;

            float growthSpeedAttenuation = 0.5;
            float blur = 0.005;
            float scale = 2.5;
            float elongate = max(0.015,(min(radius,sin(t3)*growthSpeedAttenuation))) * scale;
           //float vis = 0.5+sin(time)*growthSpeedAttenuation;
            
            //vec2 elastic = vec2(0.0, abs(sin(time*.5)*0.1));
            vec2 dampen = vec2(0., damping(t));

            float heandAndTail = circle(vUv, vec2(0., elongate) + dampen, radius, blur) ;
            heandAndTail += circle(vUv, vec2(0., -elongate) + dampen, radius, blur);
            
            float body = Rect(vUv, -.15, .15, -elongate + dampen.y, elongate + dampen.y,blur);
            
            body += heandAndTail;
            
            vec3 color = vec3(195.0/256.0 * amountOfRed,95.0/256.0 / amountOfRed , 93.0/256.0 / amountOfRed);
            
            float shadow = 1.0;
            
            if (missileType == 0) {
                color *= min(vec3(shadow),  vec3(body) * vec3(shadow)) ;
                gl_FragColor = vec4( color*0.8, clamp(color*t2,0.0,0.8));
            } else { 
               // body = circle(vUv, vec2(0., 0.0) + dampen, radius, blur);
                bool hexa = IsInsideHexagon(vUv.x+ dampen.x, vUv.y+ dampen.y, radius, 0.5, 0.5);
                bool hexaEmptyCenter = IsInsideHexagon(vUv.x+ dampen.x, vUv.y+ dampen.y, radius-0.1, 0.5, 0.5);

                
                
                vec2 rotUv = rotateUV(vUv + dampen, time, 0.5);

                bool col = IsInsideHexagon(rotUv.x, rotUv.y, 0.1 * tAggro * 3., 0.5, 0.5);
                bool col2 = IsInsideHexagon(rotUv.x, rotUv.y, 0.085 * tAggro * 3., 0.5, 0.5);
    
                float vOpacity = clamp(1.0 - tAggro / 2.5, 0.0, 1.0);
                vec3 vCol = vec3(col) * vOpacity;
                vec3 vCol2 = vec3(col2) * vOpacity;
                float redOrDead = step(0.01, vec3(vCol - vCol2).x) * vOpacity;
            
                //EXPLODING CIRCLE
                float irregularRadius = 0.47+abs(sin(vUv.x * vUv.y - implodeTimer * 1.5)) * 0.05;

                float c = sharpCircle(vUv, vec2(0.5,0.5), 0.5, implodeTimer);
                float innerC = sharpCircle(vUv, vec2(0.5,0.5), irregularRadius, implodeTimer);
                c-=innerC;
                

                
                vec3 explodeCircle = vec3(1., 0., 0.) * c;
            

                vec3 hexagon = vec3(hexa);
                if (tAggro < 0.1) {
                    hexagon -= vec3(hexaEmptyCenter);
                }

                //FINAL COLOR
                color *= min(vec3(shadow), vec3(redOrDead) * vOpacity + vec3(hexagon)) ;


                gl_FragColor = vec4( color*0.8, clamp(color*t2,0.0,0.8));
                gl_FragColor += vec4(explodeCircle, c);
            } 
            
            
            //gl_FragColor = vec4( color*0.8, 1. + clamp(color*t2,0.0,0.8));

        }
        `
    }

    get _vertexShader() {
        return this.vertex;
    }

    get _fragmentShader() {
        return this.fragment;
    }
}