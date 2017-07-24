import { AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer } from '@angular/core';
import * as Rellax from 'rellax';

@Directive({
    selector: '[rellax]'
})
export class RellaxDirective implements OnInit, AfterViewInit {

    @Input('options') options;

    private block;
    private posY = 0;
    private screenY = 0;
    private pause = false;

    private loop =
    window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || (<any>window).mozRequestAnimationFrame
    || (<any>window).msRequestAnimationFrame
    || (<any>window).oRequestAnimationFrame
    || function (callback) { setTimeout(callback, 1000 / 60); }

    private transformProp = (<any>window).transformProp || (function () {
        const testEl = document.createElement('div');
        if (testEl.style.transform == null) {
            const vendors = ['Webkit', 'Moz', 'ms'];
            for (const vendor in vendors) {
                if (testEl.style[vendors[vendor] + 'Transform'] !== undefined) {
                    return vendors[vendor] + 'Transform';
                }
            }
        }
        return 'transform';
    })();


    constructor(
        private el: ElementRef,
        private renderer: Renderer
    ) {

    }

    ngOnInit() {
        let options = { speed: -2, center: false, round: true };
        Object.keys(this.options).forEach((key) => {
            options[key] = this.options[key];
        });
        this.options = options;
        this.clamp(this.options.speed, -10, 10);
    }

    ngAfterViewInit() {
        this.init();
    }

    clamp(num, min, max) {
        return (num <= min) ? min : ((num >= max) ? max : num);
    };

    init() {
        this.screenY = window.innerHeight;
        this.setPosition();
        // Get and cache initial position of all elements
        this.block = this.createBlock(this.el.nativeElement);

        window.addEventListener('resize', () => {
            this.animate();
        });

        // Start the loop
        this.update();

        // The loop does nothing if the scrollPosition did not change
        // so call animate to make sure every element has their transforms
        this.animate();
    }

    createBlock(el: HTMLElement) {
        const dataPercentage = this.options.percentage;
        const dataSpeed = this.options.speed;

        // initializing at scrollY = 0 (top of browser)
        // ensures elements are positioned based on HTML layout.
        //
        // If the element has the percentage attribute, the posY needs to be
        // the current scroll position's value, so that the elements are still positioned based on HTML layout
        let posY = dataPercentage
            || this.options.center ? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) : 0;

        const blockTop = posY + el.getBoundingClientRect().top;
        const blockHeight = el.clientHeight || el.offsetHeight || el.scrollHeight;

        // apparently parallax equation everyone uses
        let percentage = dataPercentage ? dataPercentage : (posY - blockTop + screenY) / (blockHeight + screenY);
        if (this.options.center) { percentage = 0.5; }

        // Optional individual block speed as data attr, otherwise global speed
        // Check if has percentage attr, and limit speed to 5, else limit it to 10
        let speed = dataSpeed ? this.clamp(dataSpeed, -10, 10) : this.options.speed;
        if (dataPercentage || this.options.center) {
            speed = this.clamp(dataSpeed || this.options.speed, -5, 5);
        }

        const base = this.updatePosition(percentage, speed);

        // ~~Store non-translate3d transforms~~
        // Store inline styles and extract transforms
        const style = el.style.cssText;
        let transform = '';

        // Check if there's an inline styled transform
        if (style.indexOf('transform') >= 0) {
            // Get the index of the transform
            const index = style.indexOf('transform');

            // Trim the style to the transform point and get the following semi-colon index
            const trimmedStyle = style.slice(index);
            const delimiter = trimmedStyle.indexOf(';');

            // Remove "transform" string and save the attribute
            if (delimiter) {
                transform = ' ' + trimmedStyle.slice(11, delimiter).replace(/\s/g, '');
            } else {
                transform = ' ' + trimmedStyle.slice(11).replace(/\s/g, '');
            }
        }

        return {
            base: base,
            top: blockTop,
            height: blockHeight,
            speed: speed,
            style: style,
            transform: transform
        };
    }

    setPosition() {
        const oldY = this.posY;

        if (window.pageYOffset !== undefined) {
            this.posY = window.pageYOffset;
        } else {
            this.posY = (document.documentElement || (<any>document.body.parentNode) || document.body).scrollTop;
        }

        if (oldY !== this.posY) {
            // scroll changed, return true
            return true;
        }

        // scroll did not change
        return false;
    }

    updatePosition(percentage, speed) {
        const value = (speed * (100 * (1 - percentage)));
        return this.options.round ? Math.round(value * 10) / 10 : value;
    }

    update() {
        if (this.setPosition() && this.pause === false) {
            this.animate();
        }

        // loop again
        this.loop(this.update);
    }

    animate() {
        console.log('animating');

        let percentage = ((this.posY - this.block.top + screenY) / (this.block.height + screenY));

        // Subtracting initialize value, so element stays in same spot as HTML
        const position = this.updatePosition(percentage, this.block.speed) - this.block.base;

        // Move that element
        // (Set the new translation and append initial inline transforms.)
        const translate = 'translate3d(0,' + position + 'px,0) ' + this.block.transform;


        /* TODO CHECK THIS LINE */
        this.renderer.setElementStyle(this.el.nativeElement, this.transformProp, translate);
        //  this.el.nativeElement.style[this.transformProp] = translate;
    }

    destroy() {
        {
            this.el.nativeElement.style.cssText = this.block.style;
            this.pause = true;
        }
    }
}
