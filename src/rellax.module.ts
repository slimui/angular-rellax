import { NgModule } from '@angular/core';
import { RellaxDirective } from './rellax/rellax.directive';

@NgModule({
    declarations: [RellaxDirective],
    exports: [RellaxDirective]
})
export class RellaxModule { }