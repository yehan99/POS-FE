import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';

@NgModule({
  declarations: [SettingsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    SettingsRoutingModule,
  ],
})
export class SettingsModule {}
