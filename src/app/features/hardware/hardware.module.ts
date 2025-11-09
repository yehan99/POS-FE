import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HardwareRoutingModule } from './hardware-routing.module';
import { HardwareConfigComponent } from './hardware-config/hardware-config.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [HardwareConfigComponent],
  imports: [CommonModule, FormsModule, HardwareRoutingModule, SharedModule],
})
export class HardwareModule {}
