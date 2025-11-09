import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HardwareConfigComponent } from './hardware-config/hardware-config.component';

const routes: Routes = [
  {
    path: '',
    component: HardwareConfigComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HardwareRoutingModule {}
