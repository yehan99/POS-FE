import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HardwareConfigComponent } from './hardware-config/hardware-config.component';
import { HardwareStatusComponent } from './hardware-status/hardware-status.component';
import { ReceiptDesignerComponent } from './receipt-designer/receipt-designer.component';

const routes: Routes = [
  {
    path: '',
    component: HardwareConfigComponent,
  },
  {
    path: 'status',
    component: HardwareStatusComponent,
  },
  {
    path: 'receipt-designer',
    component: ReceiptDesignerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HardwareRoutingModule {}
